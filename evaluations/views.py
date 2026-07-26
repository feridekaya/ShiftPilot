from datetime import date as date_type

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tasks.models import WorkSchedule
from users.models import User
from .models import EmployeeEvaluation
from .serializers import EmployeeEvaluationSerializer


class DailyEmployeeListView(APIView):
    """
    GET /api/evaluations/daily-employees/?date=YYYY-MM-DD
    Returns employees scheduled to work (is_off=False in WorkSchedule) on the given date.
    Falls back to employees with assignments if no schedule entries exist for that date.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('manager', 'supervisor'):
            return Response({'detail': 'Yetkisiz.'}, status=status.HTTP_403_FORBIDDEN)

        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = date_type.fromisoformat(date_str)
            except ValueError:
                return Response({'detail': 'Geçersiz tarih formatı.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = date_type.today()

        is_supervisor = request.user.role == 'supervisor'
        if is_supervisor and not request.user.unit_id:
            return Response([])

        # Primary source: WorkSchedule (çizelge) — employees not on off day
        schedule_qs = WorkSchedule.objects.filter(
            date=target_date, is_off=False, user__tenant=request.user.tenant, user__role='employee', user__is_active=True
        )
        if is_supervisor:
            schedule_qs = schedule_qs.filter(user__unit_id=request.user.unit_id)
        schedule_ids = schedule_qs.values_list('user_id', flat=True).distinct()

        if schedule_ids:
            employee_ids = list(schedule_ids)
        else:
            # Fallback: employees with assignments that day
            from assignments.models import Assignment
            assignment_qs = Assignment.objects.filter(
                date=target_date, tenant=request.user.tenant, user__role='employee', user__is_active=True
            )
            if is_supervisor:
                assignment_qs = assignment_qs.filter(user__unit_id=request.user.unit_id)
            employee_ids = list(assignment_qs.values_list('user_id', flat=True).distinct())

        evaluated_ids = set(
            EmployeeEvaluation.objects
            .filter(date=target_date, evaluatee_id__in=employee_ids)
            .values_list('evaluatee_id', flat=True)
        )

        employees = User.objects.filter(id__in=employee_ids, tenant=request.user.tenant).order_by('name')

        result = []
        for emp in employees:
            entry = {
                'id': emp.id,
                'name': emp.name,
                'role': emp.role,
                'gender': emp.gender,
                'evaluated': emp.id in evaluated_ids,
            }
            if emp.id in evaluated_ids:
                try:
                    ev = EmployeeEvaluation.objects.get(evaluatee_id=emp.id, date=target_date)
                    entry['evaluation_id'] = ev.id
                    entry['evaluator_name'] = ev.evaluator.name if ev.evaluator else ''
                    entry['avg_score'] = round((
                        ev.punctuality + ev.break_compliance + ev.customer_comm +
                        ev.speed_agility + ev.teamwork + ev.hygiene_uniform +
                        ev.problem_solving + ev.feedback_openness + ev.energy_motivation
                    ) / 9, 1)
                except EmployeeEvaluation.DoesNotExist:
                    pass
            result.append(entry)

        return Response(result)


class EmployeeEvaluationCreateView(generics.CreateAPIView):
    """
    POST /api/evaluations/
    Creates an evaluation. Returns 409 if the employee is already evaluated that day.
    """
    serializer_class = EmployeeEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ('manager', 'supervisor'):
            return Response({'detail': 'Yetkisiz.'}, status=status.HTTP_403_FORBIDDEN)

        evaluatee_id = request.data.get('evaluatee')
        date_str = request.data.get('date')
        if not evaluatee_id or not date_str:
            return Response({'detail': 'evaluatee ve date zorunlu.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = date_type.fromisoformat(str(date_str))
        except ValueError:
            return Response({'detail': 'Geçersiz tarih.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == 'supervisor':
            evaluatee_qs = User.objects.filter(tenant=request.user.tenant)
            evaluatee_qs = evaluatee_qs.filter(unit_id=request.user.unit_id) if request.user.unit_id else evaluatee_qs.none()
            if not evaluatee_qs.filter(id=evaluatee_id).exists():
                return Response(
                    {'detail': 'Sadece kendi biriminizdeki personeli değerlendirebilirsiniz.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if EmployeeEvaluation.objects.filter(evaluatee_id=evaluatee_id, evaluatee__tenant=request.user.tenant, date=target_date).exists():
            return Response(
                {'detail': 'Bu personel bugün zaten değerlendirildi.'},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(evaluator=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EmployeeEvaluationDetailView(generics.RetrieveAPIView):
    """GET /api/evaluations/<id>/"""
    serializer_class = EmployeeEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = EmployeeEvaluation.objects.filter(evaluatee__tenant=user.tenant)
        if user.role == 'supervisor':
            qs = qs.filter(evaluatee__unit_id=user.unit_id) if user.unit_id else qs.none()
        elif user.role == 'employee':
            qs = qs.filter(evaluatee=user)
        return qs.select_related('evaluatee', 'evaluator')


class EvaluationSummaryView(APIView):
    """
    GET /api/evaluations/summary/?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
    Returns per-employee aggregated avg scores across the date range.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('manager', 'supervisor'):
            return Response({'detail': 'Yetkisiz.'}, status=status.HTTP_403_FORBIDDEN)

        from django.db.models import Avg, Count

        qs = EmployeeEvaluation.objects.filter(evaluatee__tenant=request.user.tenant)
        if request.user.role == 'supervisor':
            qs = qs.filter(evaluatee__unit_id=request.user.unit_id) if request.user.unit_id else qs.none()
        qs = qs.select_related('evaluatee')
        date_from_str = request.query_params.get('date_from')
        date_to_str   = request.query_params.get('date_to')
        if date_from_str:
            try:
                qs = qs.filter(date__gte=date_type.fromisoformat(date_from_str))
            except ValueError:
                pass
        if date_to_str:
            try:
                qs = qs.filter(date__lte=date_type.fromisoformat(date_to_str))
            except ValueError:
                pass

        rows = qs.values('evaluatee__id', 'evaluatee__name').annotate(
            eval_count=Count('id'),
            avg_punctuality=Avg('punctuality'),
            avg_break_compliance=Avg('break_compliance'),
            avg_customer_comm=Avg('customer_comm'),
            avg_speed_agility=Avg('speed_agility'),
            avg_teamwork=Avg('teamwork'),
            avg_hygiene_uniform=Avg('hygiene_uniform'),
            avg_problem_solving=Avg('problem_solving'),
            avg_feedback_openness=Avg('feedback_openness'),
            avg_energy_motivation=Avg('energy_motivation'),
        )

        FIELDS = [
            'avg_punctuality', 'avg_break_compliance', 'avg_customer_comm',
            'avg_speed_agility', 'avg_teamwork', 'avg_hygiene_uniform',
            'avg_problem_solving', 'avg_feedback_openness', 'avg_energy_motivation',
        ]

        result = []
        for r in rows:
            vals = [r[f] or 0 for f in FIELDS]
            avg_total = sum(vals) / len(vals)
            entry = {
                'employee_id':   r['evaluatee__id'],
                'employee_name': r['evaluatee__name'],
                'eval_count':    r['eval_count'],
                'avg_total':     round(avg_total, 2),
            }
            for f in FIELDS:
                entry[f] = round(r[f] or 0, 2)
            result.append(entry)

        result.sort(key=lambda x: x['avg_total'], reverse=True)
        return Response(result)
