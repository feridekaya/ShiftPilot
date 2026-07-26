from django.db import models


class Tenant(models.Model):
    """A single restaurant/business using ShiftPilot."""
    name = models.CharField(max_length=200)
    license_limit = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def active_user_count(self):
        return self.users.filter(is_active=True).count()

    @property
    def seats_remaining(self):
        return max(self.license_limit - self.active_user_count, 0)

    def has_seat_available(self):
        return self.active_user_count < self.license_limit
