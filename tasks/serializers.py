from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Zone, Unit, Shift, Task, TaskSchedule, WorkSchedule

User = get_user_model()

VALID_ROLES = ['manager', 'supervisor', 'employee']
VALID_DAYS = list(range(7))  # 0=Monday … 6=Sunday


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ['id', 'name', 'description']


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'description']


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ['id', 'name', 'start_time', 'end_time']


class TaskScheduleSerializer(serializers.ModelSerializer):
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(), source='task', write_only=True, required=False
    )

    class Meta:
        model = TaskSchedule
        fields = ['id', 'task_id', 'frequency', 'times_per_day', 'interval_hours', 'days_of_week', 'month_day', 'month']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['task_id'].queryset = Task.objects.filter(tenant=tenant)

    def validate(self, data):
        frequency = data.get('frequency', getattr(self.instance, 'frequency', None))
        days = data.get('days_of_week', [])
        if frequency in ('daily', 'multiple_daily', 'interval_daily', 'monthly', 'yearly'):
            data['days_of_week'] = []
        elif frequency == 'weekly':
            if not days:
                raise serializers.ValidationError(
                    {'days_of_week': 'Haftalık tekrar için gün seçilmeli.'}
                )
            invalid = [d for d in days if d not in VALID_DAYS]
            if invalid:
                raise serializers.ValidationError(
                    {'days_of_week': f'Geçersiz gün değerleri: {invalid}'}
                )
        if frequency != 'multiple_daily':
            data.setdefault('times_per_day', 1)
        return data


class PermanentAssigneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'role', 'gender']


class TaskSerializer(serializers.ModelSerializer):
    zone = ZoneSerializer(read_only=True)
    zone_id = serializers.PrimaryKeyRelatedField(
        queryset=Zone.objects.all(), source='zone', write_only=True
    )
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )
    created_by = serializers.StringRelatedField(read_only=True)
    allowed_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=VALID_ROLES), default=list
    )
    schedule = TaskScheduleSerializer(read_only=True)
    permanent_assignees = PermanentAssigneeSerializer(many=True, read_only=True)
    permanent_assignee_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='permanent_assignees',
        many=True, write_only=True, required=False
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'zone', 'zone_id', 'unit', 'unit_id',
            'requires_photo', 'coefficient', 'allowed_roles',
            'allowed_genders', 'created_by', 'schedule',
            'permanent_assignees', 'permanent_assignee_ids',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['zone_id'].queryset = Zone.objects.filter(tenant=tenant)
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)
            self.fields['permanent_assignee_ids'].queryset = User.objects.filter(tenant=tenant)

    def validate_coefficient(self, value):
        if value < 1:
            raise serializers.ValidationError('Coefficient must be at least 1.')
        return value

    def create(self, validated_data):
        permanent = validated_data.pop('permanent_assignees', [])
        instance = super().create(validated_data)
        if permanent:
            instance.permanent_assignees.set(permanent)
        return instance

    def update(self, instance, validated_data):
        permanent = validated_data.pop('permanent_assignees', None)
        instance = super().update(instance, validated_data)
        if permanent is not None:
            instance.permanent_assignees.set(permanent)
        return instance


class WorkScheduleSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user'  # read+write: GET'te integer ID, POST'ta user set eder
    )
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = WorkSchedule
        fields = ['id', 'user_id', 'user_name', 'user_role', 'date', 'is_off', 'start_time', 'end_time']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['user_id'].queryset = User.objects.filter(tenant=tenant)
