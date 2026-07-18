from rest_framework import serializers
from .models import EmployeeEvaluation


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
