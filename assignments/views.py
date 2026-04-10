from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.db.models import Count, Sum, Q, F

from users.permissions import IsManager, IsManagerOrSupervisor, IsSupervisor
from .models import Assignment, TaskSubmission, RejectionLog
from .serializers import (
    AssignmentSerializer, TaskSubmissionSerializer, SubmissionApprovalSerializer,
    AuditEntrySerializer, RejectionLogSerializer,
)
from .utils import get_business_date


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
        )
        user = self.request.user
        if user.role == 'employee':
            qs = qs.filter(user=user)
        else:
            user_id = self.request.query_params.get('user_id')
            if user_id:
                qs = qs.filter(user_id=user_id)
        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(date=date_filter)
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
            if task.allowed_genders and user.gender != task.allowed_genders:
                gender_label = 'erkek' if task.allowed_genders == 'male' else 'kadın'
                errors.append(f'{user.name} → {task.title}: sadece {gender_label} personel atanabilir.')
                continue
            valid_items.append({'user': user, 'task': task, 'zone_id': zone_id})

        # Count how many people share each task (for coefficient splitting)
        from collections import Counter
        task_counts = Counter(vi['task'].id for vi in valid_items)

        created_objs = []
        for vi in valid_items:
            task = vi['task']
            count = task_counts[task.id]
            coeff_share = round(task.coefficient / count, 2)
            a = Assignment.objects.create(
                user=vi['user'],
                task=task,
                zone_id=vi['zone_id'] or task.zone_id,
                date=date_str,
                coefficient_share=coeff_share,
                assigned_by=request.user,
            )
            created_objs.append(a)

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
        serializer.save(assigned_by=self.request.user)


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
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(approval_status=status_filter)
        assignment_id = self.request.query_params.get('assignment_id')
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            qs = qs.filter(assignment__user_id=user_id)
        return qs.order_by('-submitted_at')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        submission = serializer.save()
        # Mark the related assignment as completed
        assignment = submission.assignment
        assignment.status = 'completed'
        assignment.save(update_fields=['status'])

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
        # Return task to employee as pending so they can resubmit
        submission.assignment.status = 'pending'
        submission.assignment.save(update_fields=['status'])
        return Response(TaskSubmissionSerializer(submission, context={'request': request}).data)
