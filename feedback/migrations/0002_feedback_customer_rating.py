from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedback',
            name='customer_rating',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
