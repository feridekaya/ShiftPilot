from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    responded_by_name = serializers.CharField(source='responded_by.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'category', 'category_display', 'content', 'is_anonymous',
            'customer_rating', 'photo_url', 'created_at', 'user_name', 'user_role',
            'response', 'response_note', 'responded_by_name', 'responded_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'user_name', 'user_role',
            'category_display', 'responded_by_name', 'responded_at',
            'response', 'response_note',
        ]

    def get_user_name(self, obj):
        request = self.context.get('request')
        # Anonim feedbacklerde isim gizlenir — sadece manager/supervisor görebilir
        if obj.is_anonymous:
            if request and request.user.role in ('manager', 'supervisor'):
                return f"{obj.user.name} (Anonim)"
            return "Anonim"
        return obj.user.name
