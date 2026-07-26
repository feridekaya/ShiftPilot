import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
        ('announcements', '0003_announcement_target_roles'),
    ]

    operations = [
        migrations.AddField(
            model_name='announcement',
            name='tenant',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='announcements', to='tenants.tenant'),
        ),
    ]
