from django.db import connection
from django.test import skipUnlessDBFeature
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tasks.models import Unit
from users.models import User
from .models import Announcement

# target_roles__contains (JSONField) is a Postgres-only lookup — SQLite (used for
# local/dev test runs) can't compile it. Production runs Postgres, so this is only
# a local-test gap, not a real bug. Skip these two on sqlite; they pass on Postgres.
requires_json_contains = skipUnlessDBFeature('supports_json_field_contains')


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class UnitScopingTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Restoran', license_limit=100)
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

        self.general = Announcement.objects.create(
            title='Genel Duyuru', content='...', created_by=self.manager, tenant=self.tenant,
        )
        self.unit_announcement_a = Announcement.objects.create(
            title='Mutfak Duyurusu', content='...', created_by=self.manager, tenant=self.tenant, unit=self.unit_a,
        )
        self.unit_announcement_b = Announcement.objects.create(
            title='Bar Duyurusu', content='...', created_by=self.manager, tenant=self.tenant, unit=self.unit_b,
        )

    @requires_json_contains
    def test_supervisor_sees_general_and_own_unit_not_other_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/announcements/')
        titles = {a['title'] for a in resp.data}
        self.assertIn('Genel Duyuru', titles)
        self.assertIn('Mutfak Duyurusu', titles)
        self.assertNotIn('Bar Duyurusu', titles)

    @requires_json_contains
    def test_employee_sees_general_and_own_unit_not_other_unit(self):
        auth(self.client, self.emp_a)
        resp = self.client.get('/api/announcements/')
        titles = {a['title'] for a in resp.data}
        self.assertIn('Genel Duyuru', titles)
        self.assertIn('Mutfak Duyurusu', titles)
        self.assertNotIn('Bar Duyurusu', titles)

    def test_manager_sees_everything(self):
        auth(self.client, self.manager)
        resp = self.client.get('/api/announcements/')
        titles = {a['title'] for a in resp.data}
        self.assertEqual(titles, {'Genel Duyuru', 'Mutfak Duyurusu', 'Bar Duyurusu'})

    def test_employee_cannot_mark_other_unit_announcement_read(self):
        auth(self.client, self.emp_a)
        resp = self.client.post(f'/api/announcements/{self.unit_announcement_b.id}/read/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_supervisor_can_create_announcement_forced_to_own_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.post('/api/announcements/', {
            'title': 'Şef Duyurusu', 'content': '...', 'unit_id': self.unit_b.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data['unit']['id'], self.unit_a.id)

    def test_supervisor_without_unit_cannot_create_announcement(self):
        no_unit_sup = User.objects.create_user(
            email='sup-nounit@test.com', password='pass', name='Birimsiz Şef', role='supervisor', tenant=self.tenant,
        )
        auth(self.client, no_unit_sup)
        resp = self.client.post('/api/announcements/', {'title': 'X', 'content': '...'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_supervisor_cannot_edit_other_unit_announcement(self):
        auth(self.client, self.sup_a)
        resp = self.client.patch(f'/api/announcements/{self.unit_announcement_b.id}/', {'title': 'X'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_employee_cannot_create_announcement(self):
        auth(self.client, self.emp_a)
        resp = self.client.post('/api/announcements/', {'title': 'X', 'content': '...'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
