import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('tasks', '0006_add_permanent_assignees'),
    ]

    operations = [
        migrations.AddField(
            model_name='zone',
            name='tenant',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='zones', to='tenants.tenant'),
        ),
        migrations.AddField(
            model_name='shift',
            name='tenant',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='shifts', to='tenants.tenant'),
        ),
        migrations.AddField(
            model_name='task',
            name='tenant',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='tenants.tenant'),
        ),
    ]
