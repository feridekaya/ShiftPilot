from django.db import models
from django.conf import settings
from tasks.models import Task, Shift, Zone
from .utils import get_business_date


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
    coefficient_share = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
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

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submission_set')
    # Legacy single photo field — kept for backwards compat, new code uses SubmissionPhoto
    photo_url = models.URLField(blank=True, default='')
    staff_note = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField(auto_now_add=True)
    business_date = models.DateField(editable=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_submissions'
    )
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            self.business_date = get_business_date()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Submission for {self.assignment} ({self.business_date}) - {self.approval_status}'


class SubmissionPhoto(models.Model):
    submission = models.ForeignKey(TaskSubmission, on_delete=models.CASCADE, related_name='photos')
    photo_url = models.URLField()
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f'Photo #{self.order} for submission {self.submission_id}'
