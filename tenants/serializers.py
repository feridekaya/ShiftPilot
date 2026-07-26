from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    active_user_count = serializers.ReadOnlyField()
    seats_remaining = serializers.ReadOnlyField()

    class Meta:
        model = Tenant
        fields = ['id', 'name', 'license_limit', 'active_user_count', 'seats_remaining']
        read_only_fields = fields
