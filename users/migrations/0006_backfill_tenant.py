from django.db import migrations


def backfill_tenant(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    User = apps.get_model('users', 'User')

    if not User.objects.filter(tenant__isnull=True).exists():
        return

    default_tenant = Tenant.objects.create(name='ShiftPilot Demo', license_limit=30)
    User.objects.filter(tenant__isnull=True).update(tenant=default_tenant)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_tenant'),
    ]

    operations = [
        migrations.RunPython(backfill_tenant, noop_reverse),
    ]
