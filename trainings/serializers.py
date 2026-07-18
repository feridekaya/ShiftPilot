from rest_framework import serializers
from .models import Training


class TrainingSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)

    class Meta:
        model = Training
        fields = [
            'id', 'title', 'description', 'pdf_url',
            'visible_to', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'is_active',
        ]
        read_only_fields = ['id', 'created_at', 'uploaded_by', 'uploaded_by_name']

    def validate_visible_to(self, value):
        allowed = {'employee', 'supervisor'}
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('En az bir hedef rol seçin.')
        for r in value:
            if r not in allowed:
                raise serializers.ValidationError(f'Geçersiz rol: {r}')
        return value
