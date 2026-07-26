from django.db import migrations


def backfill_tenant(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    Announcement = apps.get_model('announcements', 'Announcement')

    if not Announcement.objects.filter(tenant__isnull=True).exists():
        return

    default_tenant, _ = Tenant.objects.get_or_create(
        name='ShiftPilot Demo', defaults={'license_limit': 30}
    )
    for a in Announcement.objects.filter(tenant__isnull=True).select_related('created_by'):
        a.tenant = a.created_by.tenant if a.created_by_id and a.created_by.tenant_id else default_tenant
        a.save(update_fields=['tenant'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('announcements', '0004_add_tenant'),
        ('users', '0006_backfill_tenant'),
    ]

    operations = [
        migrations.RunPython(backfill_tenant, noop_reverse),
    ]
