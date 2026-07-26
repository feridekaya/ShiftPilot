from django.db import migrations


def backfill_tenant(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    Zone = apps.get_model('tasks', 'Zone')
    Shift = apps.get_model('tasks', 'Shift')
    Task = apps.get_model('tasks', 'Task')

    needs_backfill = (
        Zone.objects.filter(tenant__isnull=True).exists()
        or Shift.objects.filter(tenant__isnull=True).exists()
        or Task.objects.filter(tenant__isnull=True).exists()
    )
    if not needs_backfill:
        return

    default_tenant, _ = Tenant.objects.get_or_create(
        name='ShiftPilot Demo', defaults={'license_limit': 30}
    )
    Zone.objects.filter(tenant__isnull=True).update(tenant=default_tenant)
    Shift.objects.filter(tenant__isnull=True).update(tenant=default_tenant)
    Task.objects.filter(tenant__isnull=True).update(tenant=default_tenant)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0007_add_tenant'),
    ]

    operations = [
        migrations.RunPython(backfill_tenant, noop_reverse),
    ]
