import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('tasks', '0008_backfill_tenant'),
    ]

    operations = [
        migrations.AlterField(
            model_name='zone',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='zones', to='tenants.tenant'),
        ),
        migrations.AlterField(
            model_name='shift',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shifts', to='tenants.tenant'),
        ),
        migrations.AlterField(
            model_name='task',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='tenants.tenant'),
        ),
    ]
