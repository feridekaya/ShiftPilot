from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

from users.permissions import IsManager, IsManagerOrSupervisor, IsSupervisor
from .models import Assignment, TaskSubmission
from .serializers import AssignmentSerializer, TaskSubmissionSerializer, SubmissionApprovalSerializer
from .utils import get_business_date


class BusinessDateView(GenericAPIView):
    """Returns the current business date and cutoff hour."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'business_date': str(get_business_date()),
            'cutoff_hour': getattr(settings, 'BUSINESS_DAY_CUTOFF_HOUR', 4),
        })


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManager()]

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

        created_objs = []
        errors = []
        seen = set()  # deduplicate (user_id, task_id)

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

            a = Assignment.objects.create(
                user=user,
                task=task,
                zone_id=zone_id or task.zone_id,
                date=date_str,
                assigned_by=request.user,
            )
            created_objs.append(a)

        return Response({
            'created': len(created_objs),
            'errors': errors,
            'assignments': AssignmentSerializer(created_objs, many=True, context={'request': request}).data,
        })

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
        # Return task to employee as pending so they can resubmit
        submission.assignment.status = 'pending'
        submission.assignment.save(update_fields=['status'])
        return Response(TaskSubmissionSerializer(submission, context={'request': request}).data)
