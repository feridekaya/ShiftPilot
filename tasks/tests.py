from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from users.models import User
from .models import Zone, Unit, Task, WorkSchedule


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class UnitScopingTests(APITestCase):
    """Şef/personel sadece kendi biriminin (+ genel) birim/görev/çizelge verisini görebilmeli.
    Bölge (Zone) artık sadece fiziksel etiket — yetkilendirmede kullanılmaz, herkese açık."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name='Restoran', license_limit=100)
        self.zone_a = Zone.objects.create(name='Ön Kasa', tenant=self.tenant)
        self.zone_b = Zone.objects.create(name='Arka Mutfak', tenant=self.tenant)
        self.unit_a = Unit.objects.create(name='Mutfak Ekibi', tenant=self.tenant)
        self.unit_b = Unit.objects.create(name='Bar Ekibi', tenant=self.tenant)

        self.manager = User.objects.create_user(
            email='manager@test.com', password='pass', name='Müdür', role='manager', tenant=self.tenant
        )
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

        self.task_a = Task.objects.create(
            title='Mutfak Temizliği', coefficient=1, created_by=self.manager, tenant=self.tenant, unit=self.unit_a
        )
        self.task_b = Task.objects.create(
            title='Bar Temizliği', coefficient=1, created_by=self.manager, tenant=self.tenant, unit=self.unit_b
        )
        self.task_general = Task.objects.create(
            title='Genel Görev', coefficient=1, created_by=self.manager, tenant=self.tenant
        )

    def test_zones_are_visible_to_everyone(self):
        """Bölge artık fiziksel etiket — hiçbir role kısıtlı değil."""
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/tasks/zones/')
        names = {z['name'] for z in resp.data}
        self.assertEqual(names, {'Ön Kasa', 'Arka Mutfak'})

    def test_supervisor_sees_only_own_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/tasks/units/')
        names = {u['name'] for u in resp.data}
        self.assertEqual(names, {'Mutfak Ekibi'})

    def test_supervisor_sees_own_unit_and_general_tasks_not_other_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/tasks/')
        titles = {t['title'] for t in resp.data}
        self.assertIn('Mutfak Temizliği', titles)
        self.assertIn('Genel Görev', titles)
        self.assertNotIn('Bar Temizliği', titles)

    def test_manager_sees_all_units_and_tasks(self):
        auth(self.client, self.manager)
        resp = self.client.get('/api/tasks/')
        titles = {t['title'] for t in resp.data}
        self.assertEqual(titles, {'Mutfak Temizliği', 'Bar Temizliği', 'Genel Görev'})

    def test_supervisor_cannot_set_permanent_assignee_from_other_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.patch(f'/api/tasks/{self.task_a.id}/set-permanent-assignees/', {
            'user_ids': [self.emp_a.id, self.emp_b.id],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        assignee_ids = {a['id'] for a in resp.data['permanent_assignees']}
        self.assertEqual(assignee_ids, {self.emp_a.id})

    def test_employee_schedule_shows_only_own_row(self):
        WorkSchedule.objects.create(user=self.emp_a, date='2026-08-03', is_off=False)
        WorkSchedule.objects.create(user=self.emp_b, date='2026-08-03', is_off=False)

        auth(self.client, self.emp_a)
        resp = self.client.get('/api/tasks/work-schedules/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        user_ids = {row['user_id'] for row in resp.data}
        self.assertEqual(user_ids, {self.emp_a.id})

    def test_supervisor_schedule_shows_only_own_unit(self):
        WorkSchedule.objects.create(user=self.emp_a, date='2026-08-03', is_off=False)
        WorkSchedule.objects.create(user=self.emp_b, date='2026-08-03', is_off=False)

        auth(self.client, self.sup_a)
        resp = self.client.get('/api/tasks/work-schedules/')
        user_ids = {row['user_id'] for row in resp.data}
        self.assertEqual(user_ids, {self.emp_a.id})
