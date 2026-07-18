from django.db import models
from django.conf import settings


class EmployeeEvaluation(models.Model):
    evaluatee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations_received',
    )
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='evaluations_given',
    )
    date = models.DateField()

    # 9 criteria, each 1-5
    punctuality        = models.PositiveSmallIntegerField()  # Dakiklik
    break_compliance   = models.PositiveSmallIntegerField()  # Mola uyumu
    customer_comm      = models.PositiveSmallIntegerField()  # Müşteri iletişimi
    speed_agility      = models.PositiveSmallIntegerField()  # Hız / çeviklik
    teamwork           = models.PositiveSmallIntegerField()  # Takım çalışması
    hygiene_uniform    = models.PositiveSmallIntegerField()  # Hijyen / üniforma
    problem_solving    = models.PositiveSmallIntegerField()  # Problem çözme
    feedback_openness  = models.PositiveSmallIntegerField()  # Geri bildirime açıklık
    energy_motivation  = models.PositiveSmallIntegerField()  # Enerji / motivasyon

    note = models.CharField(max_length=300, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('evaluatee', 'date')
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.evaluatee} – {self.date} by {self.evaluator}'
