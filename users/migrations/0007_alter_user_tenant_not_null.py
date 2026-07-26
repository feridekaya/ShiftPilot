import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('users', '0006_backfill_tenant'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='tenant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='users', to='tenants.tenant'),
        ),
    ]
