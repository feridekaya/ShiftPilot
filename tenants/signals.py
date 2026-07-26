from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Tenant

DEFAULT_ROLES = [
    ('Yönetici', 'manager'),
    ('Şef', 'supervisor'),
    ('Personel', 'employee'),
]


@receiver(post_save, sender=Tenant)
def seed_default_roles(sender, instance, created, **kwargs):
    if not created:
        return
    from users.models import Role
    Role.objects.bulk_create([
        Role(tenant=instance, name=name, base_role=base_role)
        for name, base_role in DEFAULT_ROLES
    ])
