from django.db import models
from django.conf import settings


class Zone(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Shift(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return self.name


class Task(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, related_name='tasks')
    requires_photo = models.BooleanField(default=True)
    coefficient = models.PositiveIntegerField(default=1)
    allowed_roles = models.JSONField(default=list)
    allowed_genders = models.CharField(max_length=10, blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_tasks'
    )

    def __str__(self):
        return self.title


class TaskSchedule(models.Model):
    FREQUENCY_CHOICES = [
        ('multiple_daily', 'Multiple times per day'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    task = models.OneToOneField(Task, on_delete=models.CASCADE, related_name='schedule')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    times_per_day = models.PositiveIntegerField(default=1)
    days_of_week = models.JSONField(default=list, blank=True)
    month_day = models.PositiveIntegerField(null=True, blank=True)
    month = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f'{self.task.title} - {self.frequency}'
