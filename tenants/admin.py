from django.contrib import admin
from .models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'license_limit', 'active_user_count', 'is_active', 'created_at')
    search_fields = ('name',)
