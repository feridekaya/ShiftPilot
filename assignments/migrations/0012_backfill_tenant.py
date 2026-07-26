from django.db import migrations


def backfill_tenant(apps, schema_editor):
    Tenant = apps.get_model('tenants', 'Tenant')
    Assignment = apps.get_model('assignments', 'Assignment')
    TaskSubmission = apps.get_model('assignments', 'TaskSubmission')
    ActivityLog = apps.get_model('assignments', 'ActivityLog')

    needs_backfill = (
        Assignment.objects.filter(tenant__isnull=True).exists()
        or TaskSubmission.objects.filter(tenant__isnull=True).exists()
        or ActivityLog.objects.filter(tenant__isnull=True).exists()
    )
    if not needs_backfill:
        return

    default_tenant, _ = Tenant.objects.get_or_create(
        name='ShiftPilot Demo', defaults={'license_limit': 30}
    )

    # Assignment always has a user -> derive tenant from the assignee.
    for a in Assignment.objects.filter(tenant__isnull=True).select_related('user'):
        a.tenant = a.user.tenant if a.user_id and a.user.tenant_id else default_tenant
        a.save(update_fields=['tenant'])

    # TaskSubmission always has an assignment -> derive from it.
    for s in TaskSubmission.objects.filter(tenant__isnull=True).select_related('assignment'):
        s.tenant = s.assignment.tenant if s.assignment_id else default_tenant
        s.save(update_fields=['tenant'])

    # ActivityLog.assignment can be null (SET_NULL) -> fall back to actor's tenant, then default.
    for log in ActivityLog.objects.filter(tenant__isnull=True).select_related('assignment', 'actor'):
        if log.assignment_id and log.assignment.tenant_id:
            log.tenant = log.assignment.tenant
        elif log.actor_id and log.actor.tenant_id:
            log.tenant = log.actor.tenant
        else:
            log.tenant = default_tenant
        log.save(update_fields=['tenant'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0011_add_tenant'),
        ('users', '0006_backfill_tenant'),
    ]

    operations = [
        migrations.RunPython(backfill_tenant, noop_reverse),
    ]
