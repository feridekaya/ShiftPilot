from rest_framework import serializers
from .models import Zone, Shift, Task, TaskSchedule

VALID_ROLES = ['manager', 'supervisor', 'employee']
VALID_DAYS = list(range(7))  # 0=Monday … 6=Sunday


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ['id', 'name', 'description']


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = ['id', 'name', 'start_time', 'end_time']


class TaskSerializer(serializers.ModelSerializer):
    zone = ZoneSerializer(read_only=True)
    zone_id = serializers.PrimaryKeyRelatedField(
        queryset=Zone.objects.all(), source='zone', write_only=True
    )
    created_by = serializers.StringRelatedField(read_only=True)
    allowed_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=VALID_ROLES), default=list
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'zone', 'zone_id',
            'requires_photo', 'coefficient', 'allowed_roles',
            'allowed_genders', 'created_by',
        ]

    def validate_coefficient(self, value):
        if value < 1:
            raise serializers.ValidationError('Coefficient must be at least 1.')
        return value


class TaskScheduleSerializer(serializers.ModelSerializer):
    task = TaskSerializer(read_only=True)
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(), source='task', write_only=True
    )

    class Meta:
        model = TaskSchedule
        fields = ['id', 'task', 'task_id', 'frequency', 'days_of_week']

    def validate(self, data):
        frequency = data.get('frequency', getattr(self.instance, 'frequency', None))
        days = data.get('days_of_week', [])
        if frequency == 'daily':
            data['days_of_week'] = []
        elif frequency == 'weekly':
            if not days:
                raise serializers.ValidationError(
                    {'days_of_week': 'days_of_week is required for weekly frequency.'}
                )
            invalid = [d for d in days if d not in VALID_DAYS]
            if invalid:
                raise serializers.ValidationError(
                    {'days_of_week': f'Invalid day values: {invalid}. Use 0 (Mon) to 6 (Sun).'}
                )
        return data
