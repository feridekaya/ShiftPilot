import uuid
from datetime import timedelta
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'manager')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if not extra_fields.get('tenant'):
            from tenants.models import Tenant
            extra_fields['tenant'], _ = Tenant.objects.get_or_create(
                name='ShiftPilot Admin', defaults={'license_limit': 9999}
            )
        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """Özelleştirilebilir iş unvanı (Rol) — bir Yetki seviyesine (manager/supervisor/employee) eşlenir
    ve isteğe bağlı olarak bir Birim'e bağlanır. Örn. 'Suşi Şefi' -> Yetki: supervisor, Birim: Mutfak Ekibi.
    Bir kullanıcıya bu Rol atandığında, hem Yetki hem (varsa) Birim otomatik uygulanır."""
    BASE_ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('supervisor', 'Supervisor'),
        ('employee', 'Employee'),
    ]

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=100)
    base_role = models.CharField(max_length=20, choices=BASE_ROLE_CHOICES)
    unit = models.ForeignKey(
        'tasks.Unit', on_delete=models.SET_NULL, null=True, blank=True, related_name='roles'
    )

    def __str__(self):
        return f'{self.name} ({self.base_role})'


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('supervisor', 'Supervisor'),
        ('employee', 'Employee'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='users')
    unit = models.ForeignKey(
        'tasks.Unit', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff'
    )
    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    job_role = models.ForeignKey(
        'users.Role', on_delete=models.SET_NULL, null=True, blank=True, related_name='users'
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    def __str__(self):
        return f'{self.name} ({self.role})'


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(hours=24)


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.used and timezone.now() < self.created_at + timedelta(hours=1)
