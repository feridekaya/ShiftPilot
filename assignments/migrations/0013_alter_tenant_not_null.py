import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('assignments', '0012_backfill_tenant'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assignment',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assignments', to='tenants.tenant'),
        ),
        migrations.AlterField(
            model_name='tasksubmission',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='tenants.tenant'),
        ),
        migrations.AlterField(
            model_name='activitylog',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activity_logs', to='tenants.tenant'),
        ),
    ]
