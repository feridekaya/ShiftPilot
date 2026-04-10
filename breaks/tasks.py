from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def close_expired_breaks():
    """
    Her dakika çalışır. Süresi dolmuş ama hâlâ açık olan molaları kapatır.
    Yemek: 20 dk, Kısa: 10 dk.
    """
    from .models import Break

    LIMITS = {'lunch': 20, 'short': 10}
    now = timezone.now()
    closed = 0

    for break_type, minutes in LIMITS.items():
        cutoff = now - timedelta(minutes=minutes)
        expired = Break.objects.filter(
            break_type=break_type,
            ended_at__isnull=True,
            started_at__lte=cutoff,
        )
        for brk in expired:
            # End exactly at the limit, not "now" (avoids inflated durations)
            brk.ended_at = brk.started_at + timedelta(minutes=minutes)
            brk.save(update_fields=['ended_at'])
            closed += 1

    return f'{closed} mola otomatik kapatıldı'
