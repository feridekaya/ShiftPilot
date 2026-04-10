from rest_framework import serializers
from .models import Break


class BreakSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    duration_seconds = serializers.IntegerField(read_only=True)
    duration_minutes = serializers.FloatField(read_only=True)
    break_type_label = serializers.SerializerMethodField()

    class Meta:
        model = Break
        fields = [
            'id', 'user', 'user_name', 'user_role',
            'break_type', 'break_type_label',
            'date', 'started_at', 'ended_at',
            'is_active', 'duration_seconds', 'duration_minutes',
        ]
        read_only_fields = ['id', 'user', 'date', 'started_at', 'ended_at']

    def get_break_type_label(self, obj):
        return dict(Break.BREAK_TYPES).get(obj.break_type, obj.break_type)
