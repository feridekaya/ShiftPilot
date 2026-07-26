from rest_framework import serializers
from tasks.models import Unit
from tasks.serializers import UnitSerializer
from .models import Announcement, AnnouncementRead
from django.contrib.auth import get_user_model

User = get_user_model()


class AnnouncementReadUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'role']


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    created_by_role = serializers.CharField(source='created_by.role', read_only=True)
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )
    read_count = serializers.SerializerMethodField()
    total_users = serializers.SerializerMethodField()
    is_read_by_me = serializers.SerializerMethodField()
    readers = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'target_roles', 'unit', 'unit_id',
            'created_by', 'created_by_name', 'created_by_role',
            'created_at', 'updated_at', 'is_active',
            'read_count', 'total_users', 'is_read_by_me', 'readers',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'created_by_role',
            'read_count', 'total_users', 'is_read_by_me', 'readers',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)

    def get_read_count(self, obj):
        return obj.reads.count()

    def get_total_users(self, obj):
        roles = obj.target_roles or []
        qs = User.objects.filter(tenant=obj.tenant, is_active=True)
        if obj.unit_id:
            qs = qs.filter(unit_id=obj.unit_id)
        if not roles:
            return qs.exclude(role='manager').count()
        return qs.filter(role__in=roles).count()

    def get_is_read_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.reads.filter(user=request.user).exists()

    def get_readers(self, obj):
        reads = obj.reads.select_related('user').all()
        return [{'id': r.user.id, 'name': r.user.name, 'role': r.user.role} for r in reads]
