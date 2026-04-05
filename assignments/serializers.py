from rest_framework import serializers
from django.db.models import Sum, Avg

from tasks.models import Task, Shift, Zone
from tasks.serializers import TaskSerializer, ShiftSerializer, ZoneSerializer
from users.models import User
from users.serializers import UserSerializer
from .models import Assignment, TaskSubmission


class AssignmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    task = TaskSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(), source='task', write_only=True
    )
    shift = ShiftSerializer(read_only=True)
    shift_id = serializers.PrimaryKeyRelatedField(
        queryset=Shift.objects.all(), source='shift', write_only=True
    )
    zone = ZoneSerializer(read_only=True)
    zone_id = serializers.PrimaryKeyRelatedField(
        queryset=Zone.objects.all(), source='zone', write_only=True
    )
    assigned_by = UserSerializer(read_only=True)
    status = serializers.CharField(read_only=True)
    submissions = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'user', 'user_id', 'task', 'task_id',
            'shift', 'shift_id', 'zone', 'zone_id',
            'date', 'status', 'assigned_by', 'submissions',
        ]

    def get_submissions(self, obj):
        subs = obj.submission_set.order_by('submitted_at')
        return [
            {
                'id': s.id,
                'submitted_at': s.submitted_at.isoformat(),
                'approval_status': s.approval_status,
                'note': s.note,
                'photo_url': s.photo_url,
                'approved_by': s.approved_by.name if s.approved_by else None,
            }
            for s in subs
        ]

    def validate(self, data):
        user = data.get('user')
        task = data.get('task')
        date = data.get('date')

        if not (user and task and date):
            return data

        existing_qs = Assignment.objects.filter(user=user, date=date)
        current_workload = existing_qs.aggregate(total=Sum('task__coefficient'))['total'] or 0
        new_workload = current_workload + task.coefficient

        avg_result = (
            Assignment.objects
            .filter(date=date)
            .values('user')
            .annotate(total=Sum('task__coefficient'))
            .aggregate(avg=Avg('total'))
        )
        avg_workload = avg_result['avg']

        if avg_workload and new_workload > avg_workload * 1.2:
            raise serializers.ValidationError(
                f'Workload imbalance: this employee would have {new_workload} coefficient '
                f'points vs average {avg_workload:.1f}. Max allowed: {avg_workload * 1.2:.1f}.'
            )
        return data


class SubmissionAssignmentSerializer(serializers.ModelSerializer):
    """Lightweight assignment info embedded in submissions."""
    user = UserSerializer(read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    zone_name = serializers.CharField(source='zone.name', read_only=True, default=None)
    shift_name = serializers.CharField(source='shift.name', read_only=True, default=None)

    class Meta:
        model = Assignment
        fields = ['id', 'user', 'task_title', 'zone_name', 'shift_name', 'date', 'status']


class TaskSubmissionSerializer(serializers.ModelSerializer):
    assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=Assignment.objects.all(), source='assignment', write_only=True
    )
    assignment = SubmissionAssignmentSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    approval_status = serializers.CharField(read_only=True)
    submitted_at = serializers.DateTimeField(read_only=True)
    business_date = serializers.DateField(read_only=True)

    class Meta:
        model = TaskSubmission
        fields = [
            'id', 'assignment_id', 'assignment', 'photo_url', 'submitted_at',
            'business_date', 'approved_by', 'approval_status', 'note',
        ]

    def validate_photo_url(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Photo URL cannot be empty.')
        return value

    def validate(self, data):
        request = self.context.get('request')
        assignment = data.get('assignment')
        if request and assignment and request.user.role == 'employee':
            if assignment.user != request.user:
                raise serializers.ValidationError(
                    'You can only submit for your own assignments.'
                )
        return data


class SubmissionApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSubmission
        fields = ['note']
