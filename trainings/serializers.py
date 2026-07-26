from rest_framework import serializers
from tasks.models import Unit
from tasks.serializers import UnitSerializer
from .models import Training


class TrainingSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = Training
        fields = [
            'id', 'title', 'description', 'pdf_url',
            'visible_to', 'unit', 'unit_id', 'uploaded_by', 'uploaded_by_name',
            'created_at', 'is_active',
        ]
        read_only_fields = ['id', 'created_at', 'uploaded_by', 'uploaded_by_name']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)

    def validate_visible_to(self, value):
        allowed = {'employee', 'supervisor'}
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError('En az bir hedef rol seçin.')
        for r in value:
            if r not in allowed:
                raise serializers.ValidationError(f'Geçersiz rol: {r}')
        return value
