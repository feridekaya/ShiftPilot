from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsManager, IsManagerOrSupervisor, IsSupervisor
from .models import Assignment, TaskSubmission
from .serializers import AssignmentSerializer, TaskSubmissionSerializer, SubmissionApprovalSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    http_method_names = ['get', 'post', 'head', 'options']

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
        return qs.order_by('-date')

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
            'assignment__user', 'assignment__task', 'approved_by'
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(approval_status=status_filter)
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
        submission.assignment.status = 'rejected'
        submission.assignment.save(update_fields=['status'])
        return Response(TaskSubmissionSerializer(submission, context={'request': request}).data)
