from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0009_add_occurrence_to_assignment'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ActivityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[
                    ('assigned', 'Görev Atandı'),
                    ('bulk_assigned', 'Toplu Atama Yapıldı'),
                    ('reassigned', 'Görev Yeniden Atandı'),
                    ('completed', 'Görev Tamamlandı'),
                    ('approved', 'Görev Onaylandı'),
                    ('rejected', 'Görev Reddedildi'),
                    ('deleted', 'Atama Silindi'),
                ], max_length=30)),
                ('actor_name', models.CharField(blank=True, max_length=150)),
                ('target_user_name', models.CharField(blank=True, max_length=150)),
                ('task_title', models.CharField(blank=True, max_length=255)),
                ('business_date', models.DateField(blank=True, null=True)),
                ('note', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activity_logs', to=settings.AUTH_USER_MODEL)),
                ('assignment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activity_logs', to='assignments.assignment')),
                ('target_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='target_activity_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
