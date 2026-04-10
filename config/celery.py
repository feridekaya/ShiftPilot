import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('shiftpilot')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'close-expired-breaks-every-minute': {
        'task': 'breaks.tasks.close_expired_breaks',
        'schedule': 60.0,  # every 60 seconds
    },
}
