from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tasks.models import Unit
from users.models import User
from .models import Break


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class UnitScopingTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Restoran', license_limit=100)
        self.unit_a = Unit.objects.create(name='Mutfak Ekibi', tenant=self.tenant)
        self.unit_b = Unit.objects.create(name='Bar Ekibi', tenant=self.tenant)

        self.sup_a = User.objects.create_user(
            email='sup-a@test.com', password='pass', name='Mutfak Şefi', role='supervisor',
            tenant=self.tenant, unit=self.unit_a,
        )
        self.emp_a = User.objects.create_user(
            email='emp-a@test.com', password='pass', name='Mutfak Personeli', role='employee',
            tenant=self.tenant, unit=self.unit_a,
        )
        self.emp_b = User.objects.create_user(
            email='emp-b@test.com', password='pass', name='Bar Personeli', role='employee',
            tenant=self.tenant, unit=self.unit_b,
        )

        self.break_a = Break.objects.create(user=self.emp_a, break_type='short', date=timezone.now().date())
        self.break_b = Break.objects.create(user=self.emp_b, break_type='short', date=timezone.now().date())

    def test_supervisor_active_breaks_scoped_to_own_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/breaks/active/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        user_ids = {b['user'] for b in resp.data}
        self.assertEqual(user_ids, {self.emp_a.id})

    def test_supervisor_break_list_scoped_to_own_unit(self):
        self.break_a.ended_at = timezone.now()
        self.break_a.save()
        self.break_b.ended_at = timezone.now()
        self.break_b.save()

        auth(self.client, self.sup_a)
        resp = self.client.get('/api/breaks/')
        user_ids = {b['user'] for b in resp.data}
        self.assertEqual(user_ids, {self.emp_a.id})
