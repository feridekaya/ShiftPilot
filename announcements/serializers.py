from rest_framework import serializers
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
    read_count = serializers.SerializerMethodField()
    total_users = serializers.SerializerMethodField()
    is_read_by_me = serializers.SerializerMethodField()
    readers = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority',
            'created_by', 'created_by_name', 'created_by_role',
            'created_at', 'updated_at', 'is_active',
            'read_count', 'total_users', 'is_read_by_me', 'readers',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'created_by_role',
            'read_count', 'total_users', 'is_read_by_me', 'readers',
        ]

    def get_read_count(self, obj):
        return obj.reads.count()

    def get_total_users(self, obj):
        return User.objects.filter(is_active=True).exclude(role='manager').count()

    def get_is_read_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.reads.filter(user=request.user).exists()

    def get_readers(self, obj):
        reads = obj.reads.select_related('user').all()
        return [{'id': r.user.id, 'name': r.user.name, 'role': r.user.role} for r in reads]
