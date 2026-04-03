from datetime import timedelta
from django.utils import timezone
from django.conf import settings


def get_business_date(dt=None):
    """
    Verilen datetime (varsayılan: şu an) için iş günü tarihini döndürür.

    Kural: Eğer yerel saat BUSINESS_DAY_CUTOFF_HOUR'dan (varsayılan 04:00)
    küçükse, bir önceki takvim günü döndürülür.

    Örnek:
        2 Nisan 23:00 → 2026-04-02  (normal)
        3 Nisan 01:30 → 2026-04-02  (gece yarısı geçti ama hâlâ 2 Nisan iş günü)
        3 Nisan 04:00 → 2026-04-03  (artık yeni iş günü)
    """
    if dt is None:
        dt = timezone.now()

    local_dt = timezone.localtime(dt)
    cutoff = getattr(settings, 'BUSINESS_DAY_CUTOFF_HOUR', 4)

    if local_dt.hour < cutoff:
        return (local_dt - timedelta(days=1)).date()

    return local_dt.date()
