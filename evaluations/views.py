from datetime import date as date_type

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from assignments.models import Assignment
from users.models import User
from .models import EmployeeEvaluation
from .serializers import EmployeeEvaluationSerializer


class DailyEmployeeListView(APIView):
    """
    GET /api/evaluations/daily-employees/?date=YYYY-MM-DD
    Returns distinct employees who have assignments on the given date,
    with a flag indicating whether they have already been evaluated that day.
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

        employee_ids = (
            Assignment.objects
            .filter(date=target_date, user__role='employee', user__is_active=True)
            .values_list('user_id', flat=True)
            .distinct()
        )

        evaluated_ids = set(
            EmployeeEvaluation.objects
            .filter(date=target_date, evaluatee_id__in=employee_ids)
            .values_list('evaluatee_id', flat=True)
        )

        employees = User.objects.filter(id__in=employee_ids).order_by('name')

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

        if EmployeeEvaluation.objects.filter(evaluatee_id=evaluatee_id, date=target_date).exists():
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
    queryset = EmployeeEvaluation.objects.select_related('evaluatee', 'evaluator')
