from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Count, Sum, Q, F

from users.permissions import IsManager, IsManagerOrSupervisor, IsSupervisor
from .models import Assignment, TaskSubmission, RejectionLog, ActivityLog
from .serializers import (
    AssignmentSerializer, TaskSubmissionSerializer, SubmissionApprovalSerializer,
    AuditEntrySerializer, RejectionLogSerializer, ActivityLogSerializer,
)
from .utils import get_business_date


def _optimize_image(upload, max_width=1080, quality=75):
    """Resize + convert to WebP. Returns a ContentFile ready for django storage."""
    import io
    from PIL import Image
    from django.core.files.base import ContentFile

    img = Image.open(upload)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    if img.width > max_width:
        new_h = int((max_width / img.width) * img.height)
        img = img.resize((max_width, new_h), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='WEBP', quality=quality, optimize=True)
    buf.seek(0)
    return ContentFile(buf.read())


class PhotoUploadView(GenericAPIView):
    """Upload photo → optimize to WebP → save to R2 → return public URL."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        from uuid import uuid4
        from django.core.files.storage import default_storage

        file = request.FILES.get('photo')
        if not file:
            return Response({'error': 'Fotoğraf bulunamadı.'}, status=400)
        if not getattr(file, 'content_type', '').startswith('image/'):
            return Response({'error': 'Sadece resim dosyası yüklenebilir.'}, status=400)

        try:
            optimized = _optimize_image(file)
        except Exception:
            return Response({'error': 'Görsel işlenemedi.'}, status=400)

        filename = f'submissions/{uuid4().hex}.webp'
        saved = default_storage.save(filename, optimized)
        url = default_storage.url(saved)
        if not url.startswith('http'):
            url = request.build_absolute_uri(url)

        return Response({'url': url})


class AssignmentSuggestView(GenericAPIView):
    """Rule-based smart assignment suggestions for a given date."""
    permission_classes = [IsAuthenticated, IsManagerOrSupervisor]

    DISHWASH_KW = ['bulaşık', 'dishwash', 'bulaşıkhane', 'yıkama']
    HARD_KW     = ['bulaşık', 'ağır', 'kaldırma', 'taşıma']

    # Task categories that belong to each shift group
    MORNING_CATEGORIES = {'opening'}
    EVENING_CATEGORIES = {'closing', 'responsibility'}
    ALL_CATEGORIES     = {'general'}

    def get(self, request):
        import random
        from datetime import date as date_cls, timedelta
        from collections import defaultdict
        from users.models import User as UserModel
        from tasks.models import Task as TaskModel, WorkSchedule

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date is required'}, status=400)
        try:
            target_date = date_cls.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'invalid date'}, status=400)

        trday = target_date.weekday()  # 0=Mon … 6=Sun

        # ── Employees ──────────────────────────────────────────────────────
        employees = list(UserModel.objects.filter(role='employee', is_active=True))
        if not employees:
            return Response({'date': date_str, 'suggestions': [], 'employee_loads': [], 'avg_load': 0})

        # Shift type per employee: 'morning' | 'evening' | 'all' | 'off'
        work_schedules = {
            ws.user_id: ws
            for ws in WorkSchedule.objects.filter(user__in=employees, date=target_date)
        }

        def shift_type(emp):
            ws = work_schedules.get(emp.id)
            if not ws:
                return 'all'        # no schedule = no restriction
            if ws.is_off:
                return 'off'
            if ws.start_time is None:
                return 'all'
            return 'morning' if ws.start_time.hour < 12 else 'evening'

        emp_shift = {emp.id: shift_type(emp) for emp in employees}
        active_employees = [e for e in employees if emp_shift[e.id] != 'off']

        # Determine "new" employees: hired < 30 days ago OR < 5 completed assignments
        cutoff = target_date - timedelta(days=30)
        completed_counts = dict(
            Assignment.objects.filter(
                user__role='employee',
                status__in=['completed', 'approved'],
            ).values('user_id').annotate(n=Count('id')).values_list('user_id', 'n')
        )
        new_emp_ids = {
            emp.id for emp in active_employees
            if emp.created_at.date() > cutoff or completed_counts.get(emp.id, 0) < 5
        }

        # ── Tasks ──────────────────────────────────────────────────────────
        tasks = list(TaskModel.objects.select_related('zone').prefetch_related('permanent_assignees'))

        def task_applies(t):
            try:
                sch = t.schedule
            except Exception:
                return True
            if not sch:
                return True
            freq = sch.frequency
            if freq in ('daily', 'multiple_daily', 'interval_daily'):
                return True
            if freq == 'weekly':
                dow = sch.days_of_week or []
                return trday in dow or trday in [int(d) for d in dow]
            if freq == 'monthly':
                return target_date.day == sch.month_day
            if freq == 'yearly':
                return target_date.day == sch.month_day and target_date.month == sch.month
            return False

        available_tasks = [t for t in tasks if task_applies(t)]

        # ── Current load already assigned on this date ──────────────────────
        employee_loads = defaultdict(float)
        for a in Assignment.objects.filter(date=target_date).select_related('task'):
            employee_loads[a.user_id] += float(a.coefficient_share or a.task.coefficient)
        for emp in active_employees:
            employee_loads.setdefault(emp.id, 0.0)

        # ── Helpers ────────────────────────────────────────────────────────
        def is_dishwash(task):
            combined = (task.title + ' ' + (task.description or '')).lower()
            return any(kw in combined for kw in self.DISHWASH_KW)

        def is_hard(task):
            combined = (task.title + ' ' + (task.description or '')).lower()
            return any(kw in combined for kw in self.HARD_KW)

        def shift_eligible(emp, task_category):
            """Return True if employee's shift matches the task's category."""
            s = emp_shift[emp.id]
            if s == 'all':
                return True
            if task_category in self.MORNING_CATEGORIES:
                return s == 'morning'
            if task_category in self.EVENING_CATEGORIES:
                return s == 'evening'
            return True  # general / special → everyone

        def build_pool(task):
            dishwash = is_dishwash(task)
            hard     = is_hard(task)
            result = []
            for emp in active_employees:
                if task.allowed_genders and emp.gender != task.allowed_genders:
                    continue
                if dishwash and emp.gender == 'female':
                    continue
                if emp.id in new_emp_ids and (task.coefficient > 3 or hard or dishwash):
                    continue
                if task.allowed_roles and emp.role not in task.allowed_roles:
                    continue
                if not shift_eligible(emp, task.category):
                    continue
                result.append(emp)

            # Fallback 1: relax new-employee restriction
            if not result:
                result = [e for e in active_employees
                          if (not task.allowed_genders or e.gender == task.allowed_genders)
                          and not (dishwash and e.gender == 'female')
                          and shift_eligible(e, task.category)]

            # Fallback 2: relax shift restriction too
            if not result:
                result = [e for e in active_employees
                          if (not task.allowed_genders or e.gender == task.allowed_genders)
                          and not (dishwash and e.gender == 'female')]

            return result

        def pick_least_loaded(pool):
            """Among the pool, pick randomly from those with the minimum load."""
            min_load = min(employee_loads[e.id] for e in pool)
            tied = [e for e in pool if employee_loads[e.id] == min_load]
            return random.choice(tied)

        # ── Build suggestions ──────────────────────────────────────────────
        suggestions = []

        for task in available_tasks:
            # Special tasks are not auto-suggested — manager assigns manually
            if task.category == 'special':
                continue

            permanents = list(task.permanent_assignees.filter(is_active=True))
            if permanents:
                share = round(task.coefficient / len(permanents), 2)
                for emp in permanents:
                    suggestions.append({
                        'task_id':           task.id,
                        'task_title':        task.title,
                        'task_category':     task.category,
                        'task_coefficient':  task.coefficient,
                        'zone_id':           task.zone_id,
                        'zone_name':         task.zone.name if task.zone else None,
                        'user_id':           emp.id,
                        'user_name':         emp.name,
                        'user_gender':       emp.gender,
                        'is_new_employee':   emp.id in new_emp_ids,
                        'coefficient_share': share,
                        'reason':            'Sabit atanmış görev',
                        'permanent':         True,
                    })
                    employee_loads[emp.id] += share
                continue

            pool = build_pool(task)
            if not pool:
                continue

            chosen = pick_least_loaded(pool)

            # Human-readable reason
            parts = []
            if task.category in self.MORNING_CATEGORIES:
                parts.append('sabah vardiyası')
            elif task.category in self.EVENING_CATEGORIES:
                parts.append('akşam vardiyası')
            if chosen.id in new_emp_ids:
                parts.append('yeni çalışan')
            parts.append(f'yük: {employee_loads[chosen.id]:.0f} puan')

            suggestions.append({
                'task_id':           task.id,
                'task_title':        task.title,
                'task_category':     task.category,
                'task_coefficient':  task.coefficient,
                'zone_id':           task.zone_id,
                'zone_name':         task.zone.name if task.zone else None,
                'user_id':           chosen.id,
                'user_name':         chosen.name,
                'user_gender':       chosen.gender,
                'is_new_employee':   chosen.id in new_emp_ids,
                'coefficient_share': float(task.coefficient),
                'reason':            ' · '.join(parts),
                'permanent':         False,
            })
            employee_loads[chosen.id] += float(task.coefficient)

        # ── Workload balance summary ───────────────────────────────────────
        loads = [
            {'user_id': e.id, 'user_name': e.name,
             'total_load': round(employee_loads[e.id], 2),
             'shift': emp_shift[e.id]}
            for e in active_employees
        ]
        avg_load = round(sum(l['total_load'] for l in loads) / len(loads), 2) if loads else 0

        return Response({
            'date':           date_str,
            'suggestions':    suggestions,
            'employee_loads': loads,
            'avg_load':       avg_load,
        })


class PerformanceView(GenericAPIView):
    """Returns per-user performance metrics over a date range.
    Managers/supervisors see all users; employees see only themselves."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from users.models import User as UserModel
        from datetime import date as date_cls

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = Assignment.objects.all()
        # Employees can only see their own stats
        if request.user.role == 'employee':
            qs = qs.filter(user=request.user)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Aggregate assignment-level stats per user
        agg = (
            qs.values('user_id', 'user__name', 'user__role')
            .annotate(
                total_assignments=Count('id'),
                completed=Count('id', filter=Q(status__in=['completed', 'approved', 'rejected'])),
                approved=Count('id', filter=Q(status='approved')),
                rejected=Count('id', filter=Q(status='rejected')),
                pending=Count('id', filter=Q(status='pending')),
                total_coefficient=Sum('coefficient_share'),
            )
            .order_by('user__name')
        )

        # For redo rate and submission counts, query submissions separately
        sub_qs = TaskSubmission.objects.filter(assignment__in=qs)
        if date_from:
            sub_qs = sub_qs.filter(assignment__date__gte=date_from)
        if date_to:
            sub_qs = sub_qs.filter(assignment__date__lte=date_to)

        # Count total submissions per user
        sub_totals = dict(
            sub_qs.values('assignment__user_id')
            .annotate(n=Count('id'))
            .values_list('assignment__user_id', 'n')
        )

        # Count assignments that had >1 submission (redo requests)
        redo_assignment_ids = (
            sub_qs.values('assignment_id')
            .annotate(n=Count('id'))
            .filter(n__gt=1)
            .values_list('assignment_id', flat=True)
        )
        redo_by_user = dict(
            qs.filter(id__in=redo_assignment_ids)
            .values('user_id')
            .annotate(n=Count('id'))
            .values_list('user_id', 'n')
        )

        # Feedback stats per user (feedbacks submitted BY each user, evaluated by manager)
        from feedback.models import Feedback as FeedbackModel
        user_ids = [row['user_id'] for row in agg]

        # is_active map for filtering on frontend
        user_active_map = dict(
            UserModel.objects.filter(id__in=user_ids).values_list('id', 'is_active')
        )
        fb_qs = FeedbackModel.objects.filter(user_id__in=user_ids)
        if date_from:
            fb_qs = fb_qs.filter(created_at__date__gte=date_from)
        if date_to:
            fb_qs = fb_qs.filter(created_at__date__lte=date_to)
        # Only count feedbacks that have received a manager response
        fb_responded = fb_qs.filter(response__isnull=False)
        fb_pos = dict(fb_responded.filter(response='positive').values('user_id').annotate(n=Count('id')).values_list('user_id', 'n'))
        fb_neg = dict(fb_responded.filter(response='negative').values('user_id').annotate(n=Count('id')).values_list('user_id', 'n'))
        fb_tot = dict(fb_responded.values('user_id').annotate(n=Count('id')).values_list('user_id', 'n'))

        results = []
        for row in agg:
            uid = row['user_id']
            total = row['total_assignments']
            approved = row['approved']
            rejected = row['rejected']
            completed = row['completed']
            total_subs = sub_totals.get(uid, 0)
            redo_count = redo_by_user.get(uid, 0)

            # approval_rate = approved / (approved + rejected), or None if no decisions
            judged = approved + rejected
            approval_rate = round(approved / judged * 100, 1) if judged > 0 else None

            # redo_rate = assignments with >1 submission / completed assignments
            redo_rate = round(redo_count / completed * 100, 1) if completed > 0 else None

            # completion_rate = completed / total
            completion_rate = round(completed / total * 100, 1) if total > 0 else None

            # avg submissions per completed task
            avg_submissions = round(total_subs / completed, 2) if completed > 0 else None

            # feedback management rates
            fb_positive = fb_pos.get(uid, 0)
            fb_negative = fb_neg.get(uid, 0)
            fb_total    = fb_tot.get(uid, 0)
            fb_pos_rate = round(fb_positive / fb_total * 100, 1) if fb_total > 0 else None

            results.append({
                'user_id': uid,
                'user_name': row['user__name'],
                'user_role': row['user__role'],
                'total_assignments': total,
                'completed': completed,
                'approved': approved,
                'rejected': rejected,
                'pending': row['pending'],
                'total_coefficient': float(row['total_coefficient'] or 0),
                'completion_rate': completion_rate,
                'approval_rate': approval_rate,
                'redo_rate': redo_rate,
                'redo_count': redo_count,
                'total_submissions': total_subs,
                'avg_submissions_per_task': avg_submissions,
                'feedback_positive': fb_positive,
                'feedback_negative': fb_negative,
                'feedback_total': fb_total,
                'feedback_pos_rate': fb_pos_rate,
                'is_active': user_active_map.get(uid, True),
            })

        return Response(results)


class BusinessDateView(GenericAPIView):
    """Returns the current business date and cutoff hour."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'business_date': str(get_business_date()),
            'cutoff_hour': getattr(settings, 'BUSINESS_DAY_CUTOFF_HOUR', 4),
        })


class AuditView(GenericAPIView):
    """Manager-only audit log of all approvals and rejections."""
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        qs = TaskSubmission.objects.filter(
            approval_status__in=['approved', 'rejected']
        ).select_related(
            'assignment__user', 'assignment__task', 'assignment__zone', 'approved_by'
        ).order_by('-submitted_at')

        supervisor_id = request.query_params.get('supervisor_id')
        task_id = request.query_params.get('task_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        status_filter = request.query_params.get('status')

        if supervisor_id:
            qs = qs.filter(approved_by_id=supervisor_id)
        if task_id:
            qs = qs.filter(assignment__task_id=task_id)
        if date_from:
            qs = qs.filter(assignment__date__gte=date_from)
        if date_to:
            qs = qs.filter(assignment__date__lte=date_to)
        if status_filter:
            qs = qs.filter(approval_status=status_filter)

        qs = qs[:200]
        return Response(AuditEntrySerializer(qs, many=True).data)


class ActivityLogView(GenericAPIView):
    """Manager/supervisor: filtrelenebilir etkinlik günlüğü."""
    permission_classes = [IsAuthenticated, IsManagerOrSupervisor]

    def get(self, request):
        qs = ActivityLog.objects.select_related('actor', 'target_user', 'assignment')

        action = request.query_params.get('action')
        actor_id = request.query_params.get('actor_id')
        user_id = request.query_params.get('user_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        business_date = request.query_params.get('business_date')

        if action:
            qs = qs.filter(action=action)
        if actor_id:
            qs = qs.filter(actor_id=actor_id)
        if user_id:
            qs = qs.filter(target_user_id=user_id)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if business_date:
            qs = qs.filter(business_date=business_date)

        qs = qs[:300]
        return Response(ActivityLogSerializer(qs, many=True).data)


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManagerOrSupervisor()]

    def get_queryset(self):
        qs = Assignment.objects.select_related(
            'user', 'task', 'shift', 'zone', 'assigned_by'
        ).prefetch_related('submission_set', 'submission_set__photos')

        user = self.request.user
        if user.role == 'employee':
            qs = qs.filter(user=user)
        else:
            user_id = self.request.query_params.get('user_id')
            if user_id:
                qs = qs.filter(user_id=user_id)

        date_filter = self.request.query_params.get('date')
        # Default to today so we never load the full history unpaged
        if date_filter:
            qs = qs.filter(date=date_filter)
        else:
            qs = qs.filter(date=get_business_date())

        return qs.order_by('-date')

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk(self, request):
        """Bulk-create assignments for a day, replacing existing pending ones."""
        from tasks.models import Task as TaskModel
        from users.models import User as UserModel

        date_str = request.data.get('date')
        items = request.data.get('assignments', [])

        if not date_str:
            return Response({'error': 'date is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Replace all pending assignments for this date
        Assignment.objects.filter(date=date_str, status='pending').delete()

        # Pre-validate and deduplicate; count assignees per task for coefficient splitting
        seen = set()
        valid_items = []
        errors = []

        for item in items:
            user_id = item.get('user_id')
            task_id = item.get('task_id')
            zone_id = item.get('zone_id')
            key = (user_id, task_id)
            if key in seen:
                continue
            seen.add(key)
            try:
                user = UserModel.objects.get(id=user_id)
                task = TaskModel.objects.get(id=task_id)
            except (UserModel.DoesNotExist, TaskModel.DoesNotExist):
                errors.append(f'Geçersiz kullanıcı ({user_id}) veya görev ({task_id}).')
                continue
            # Managers cannot be assigned tasks
            if user.role == 'manager':
                errors.append(f'{user.name} → {task.title}: yöneticilere görev atanamaz.')
                continue
            if task.allowed_genders and user.gender != task.allowed_genders:
                gender_label = 'erkek' if task.allowed_genders == 'male' else 'kadın'
                errors.append(f'{user.name} → {task.title}: sadece {gender_label} personel atanabilir.')
                continue
            valid_items.append({'user': user, 'task': task, 'zone_id': zone_id})

        # Count how many people share each task (for coefficient splitting)
        from collections import Counter
        task_counts = Counter(vi['task'].id for vi in valid_items)

        def get_times_per_day(task):
            try:
                sch = task.schedule
                if sch and sch.frequency in ('multiple_daily', 'interval_daily'):
                    return max(1, sch.times_per_day or 1)
            except Exception:
                pass
            return 1

        created_objs = []
        from django.db import IntegrityError
        for vi in valid_items:
            task = vi['task']
            count = task_counts[task.id]
            coeff_share = round(task.coefficient / count, 2)
            times = get_times_per_day(task)
            for occ in range(1, times + 1):
                try:
                    a = Assignment.objects.create(
                        user=vi['user'],
                        task=task,
                        zone_id=vi['zone_id'] or task.zone_id,
                        date=date_str,
                        occurrence=occ,
                        coefficient_share=coeff_share,
                        assigned_by=request.user,
                    )
                    created_objs.append(a)
                except IntegrityError:
                    errors.append(
                        f'{vi["user"].name} → {task.title}: bu tarih için zaten atama mevcut (tamamlandı/onaylandı).'
                    )

        # Log one entry per assignment created
        logs = []
        for a in created_objs:
            logs.append(ActivityLog(
                actor=request.user,
                actor_name=request.user.name,
                action='bulk_assigned',
                assignment=a,
                target_user=a.user,
                target_user_name=a.user.name,
                task_title=a.task.title,
                business_date=a.date,
            ))
        if logs:
            ActivityLog.objects.bulk_create(logs)

        return Response({
            'created': len(created_objs),
            'errors': errors,
            'assignments': AssignmentSerializer(created_objs, many=True, context={'request': request}).data,
        })

    @action(detail=False, methods=['get'], url_path='store', permission_classes=[IsAuthenticated])
    def store(self, request):
        """Returns all assignments for the current business date — accessible to all roles."""
        today = str(get_business_date())
        qs = Assignment.objects.filter(date=today).select_related('user', 'task', 'shift', 'zone', 'assigned_by')
        return Response(AssignmentSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='previous-day')
    def previous_day(self, request):
        """Return assignments from the most recent day before the given date."""
        from datetime import date as date_cls, timedelta

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            d = date_cls.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'invalid date'}, status=status.HTTP_400_BAD_REQUEST)

        prev = d - timedelta(days=1)
        for _ in range(7):
            qs = Assignment.objects.filter(date=prev).select_related('user', 'task', 'zone', 'shift')
            if qs.exists():
                return Response(AssignmentSerializer(qs, many=True, context={'request': request}).data)
            prev -= timedelta(days=1)

        return Response([])

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        a = serializer.save(assigned_by=self.request.user)
        ActivityLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.name,
            action='assigned',
            assignment=a,
            target_user=a.user,
            target_user_name=a.user.name,
            task_title=a.task.title,
            business_date=a.date,
        )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.name,
            action='deleted',
            target_user=instance.user,
            target_user_name=instance.user.name,
            task_title=instance.task.title,
            business_date=instance.date,
        )
        instance.delete()


class SubmissionViewSet(viewsets.ModelViewSet):
    http_method_names = ['get', 'post', 'put', 'head', 'options']

    def get_permissions(self):
        if self.action in ('approve', 'reject'):
            return [IsAuthenticated(), IsSupervisor()]
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsManagerOrSupervisor()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ('approve', 'reject'):
            return SubmissionApprovalSerializer
        return TaskSubmissionSerializer

    def get_queryset(self):
        qs = TaskSubmission.objects.select_related(
            'assignment__user', 'assignment__task', 'assignment__zone',
            'assignment__shift', 'approved_by'
        ).prefetch_related('photos')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(approval_status=status_filter)
        assignment_id = self.request.query_params.get('assignment_id')
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(assignment__user_id=user_id)
        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(assignment__date=date_filter)
        elif not assignment_id and not user_id:
            # Tarih ve filtre olmadan tüm geçmişi çekmemek için bugünle sınırla
            qs = qs.filter(assignment__date=get_business_date())
        return qs.order_by('-submitted_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        submission = serializer.save()
        assignment = submission.assignment
        assignment.status = 'completed'
        assignment.save(update_fields=['status'])
        ActivityLog.objects.create(
            actor=self.request.user,
            actor_name=self.request.user.name,
            action='completed',
            assignment=assignment,
            target_user=assignment.user,
            target_user_name=assignment.user.name,
            task_title=assignment.task.title,
            business_date=assignment.date,
        )

    @action(detail=True, methods=['put'])
    def approve(self, request, pk=None):
        submission = self.get_object()
        serializer = self.get_serializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        submission.approval_status = 'approved'
        submission.approved_by = request.user
        if 'note' in serializer.validated_data:
            submission.note = serializer.validated_data['note']
        if 'rating' in serializer.validated_data:
            submission.rating = serializer.validated_data['rating']
        submission.save()
        submission.assignment.status = 'approved'
        submission.assignment.save(update_fields=['status'])
        ActivityLog.objects.create(
            actor=request.user,
            actor_name=request.user.name,
            action='approved',
            assignment=submission.assignment,
            target_user=submission.assignment.user,
            target_user_name=submission.assignment.user.name,
            task_title=submission.assignment.task.title,
            business_date=submission.assignment.date,
            note=submission.note,
        )
        return Response(TaskSubmissionSerializer(submission, context={'request': request}).data)

    @action(detail=True, methods=['put'])
    def reject(self, request, pk=None):
        submission = self.get_object()
        serializer = self.get_serializer(submission, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        submission.approval_status = 'rejected'
        submission.approved_by = request.user
        submission.note = serializer.validated_data.get('note', submission.note)
        submission.save()
        # Immutable audit trail
        RejectionLog.objects.create(
            submission=submission,
            assignment=submission.assignment,
            rejected_by=request.user,
            note=submission.note,
        )
        ActivityLog.objects.create(
            actor=request.user,
            actor_name=request.user.name,
            action='rejected',
            assignment=submission.assignment,
            target_user=submission.assignment.user,
            target_user_name=submission.assignment.user.name,
            task_title=submission.assignment.task.title,
            business_date=submission.assignment.date,
            note=submission.note,
        )
        # Return ALL assignees of this task+date to pending so everyone must redo
        Assignment.objects.filter(
            task=submission.assignment.task,
            date=submission.assignment.date,
        ).exclude(status='approved').update(status='pending')
        return Response(TaskSubmissionSerializer(submission, context={'request': request}).data)
