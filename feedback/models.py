from django.db import models
from django.conf import settings


class Feedback(models.Model):
    CATEGORY_CHOICES = [
        ('temizlik', 'Temizlik'),
        ('yemekler', 'Yemekler'),
        ('iecekler', 'İçecekler'),
        ('duzen',    'Düzen'),
        ('ses',      'Ses'),
        ('personel', 'Personel'),
        ('genel',    'Genel'),
        ('diger',    'Diğer'),
    ]

    RESPONSE_CHOICES = [
        ('positive', 'Olumlu'),
        ('negative', 'Olumsuz'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    content = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    customer_rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5 yıldız

    response = models.CharField(max_length=10, choices=RESPONSE_CHOICES, null=True, blank=True)
    response_note = models.TextField(blank=True, default='')
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='feedback_responses'
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    photo_url = models.URLField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} – {self.category}"
