from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('announcements', '0002_announcement_priority_announcementread'),
    ]

    operations = [
        migrations.AddField(
            model_name='announcement',
            name='target_roles',
            field=models.JSONField(default=list, help_text='Boş = herkes. Örn: ["employee","supervisor"]'),
        ),
    ]
