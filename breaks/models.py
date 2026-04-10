from django.db import models
from django.conf import settings
from django.utils import timezone


class Break(models.Model):
    BREAK_TYPES = [
        ('lunch', 'Yemek Molası'),   # 20 min
        ('short', 'Kısa Mola'),      # 10 min
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='breaks',
    )
    break_type = models.CharField(max_length=10, choices=BREAK_TYPES)
    date = models.DateField()          # business date (set on start)
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    @property
    def is_active(self):
        return self.ended_at is None

    @property
    def duration_seconds(self):
        """Returns elapsed seconds; uses now() if break is still active."""
        end = self.ended_at or timezone.now()
        return int((end - self.started_at).total_seconds())

    @property
    def duration_minutes(self):
        return round(self.duration_seconds / 60, 1)

    def __str__(self):
        return f"{self.user} | {self.break_type} | {self.date}"
