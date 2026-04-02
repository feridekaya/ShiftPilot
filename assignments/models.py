from django.db import models
from django.conf import settings
from tasks.models import Task, Shift, Zone


class Assignment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assignments'
    )
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignments')
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, related_name='assignments')
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, related_name='assignments')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks'
    )

    class Meta:
        unique_together = ('user', 'task', 'date', 'shift')

    def __str__(self):
        return f'{self.user} - {self.task} ({self.date})'


class TaskSubmission(models.Model):
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    assignment = models.OneToOneField(Assignment, on_delete=models.CASCADE, related_name='submission')
    photo_url = models.URLField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_submissions'
    )
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True)

    def __str__(self):
        return f'Submission for {self.assignment} - {self.approval_status}'
