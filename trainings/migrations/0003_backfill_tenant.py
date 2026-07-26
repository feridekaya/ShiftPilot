from django.db import migrations


def backfill_tenant(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    Training = apps.get_model('trainings', 'Training')

    if not Training.objects.filter(tenant__isnull=True).exists():
        return

    default_tenant, _ = Tenant.objects.get_or_create(
        name='ShiftPilot Demo', defaults={'license_limit': 30}
    )
    for t in Training.objects.filter(tenant__isnull=True).select_related('uploaded_by'):
        t.tenant = t.uploaded_by.tenant if t.uploaded_by_id and t.uploaded_by.tenant_id else default_tenant
        t.save(update_fields=['tenant'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('trainings', '0002_add_tenant'),
        ('users', '0006_backfill_tenant'),
    ]

    operations = [
        migrations.RunPython(backfill_tenant, noop_reverse),
    ]
