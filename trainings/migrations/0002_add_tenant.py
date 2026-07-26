import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('trainings', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='training',
            name='tenant',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='trainings', to='tenants.tenant'),
        ),
    ]
