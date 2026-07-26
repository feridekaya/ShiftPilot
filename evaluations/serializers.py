from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmployeeEvaluation

User = get_user_model()


class EmployeeEvaluationSerializer(serializers.ModelSerializer):
    evaluatee_name = serializers.CharField(source='evaluatee.name', read_only=True)
    evaluator_name = serializers.CharField(source='evaluator.name', read_only=True)

    class Meta:
        model = EmployeeEvaluation
        fields = [
            'id', 'evaluatee', 'evaluatee_name',
            'evaluator', 'evaluator_name',
            'date',
            'punctuality', 'break_compliance', 'customer_comm',
            'speed_agility', 'teamwork', 'hygiene_uniform',
            'problem_solving', 'feedback_openness', 'energy_motivation',
            'note', 'created_at',
        ]
        read_only_fields = ['id', 'evaluator', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get('request'), 'user', None)
        tenant = getattr(user, 'tenant', None)
        if tenant:
            qs = User.objects.filter(tenant=tenant)
            if getattr(user, 'role', None) == 'supervisor':
                qs = qs.filter(unit_id=user.unit_id) if user.unit_id else qs.none()
            self.fields['evaluatee'].queryset = qs
