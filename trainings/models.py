from django.db import models
from django.conf import settings


class Training(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    pdf_url = models.URLField()
    visible_to = models.JSONField(
        default=list,
        help_text='Roller: ["employee"], ["supervisor"], ["employee","supervisor"]'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True,
        related_name='uploaded_trainings'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
