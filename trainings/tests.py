from django.test import skipUnlessDBFeature
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tasks.models import Unit
from users.models import User
from .models import Training


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


# visible_to__contains (JSONField) is a Postgres-only lookup — SQLite (local/dev
# test runs) can't compile it. Production runs Postgres; this is a local-test gap only.
requires_json_contains = skipUnlessDBFeature('supports_json_field_contains')


class UnitScopingTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Restoran', license_limit=100)
        self.unit_a = Unit.objects.create(name='Mutfak Ekibi', tenant=self.tenant)
        self.unit_b = Unit.objects.create(name='Bar Ekibi', tenant=self.tenant)

        self.manager = User.objects.create_user(
            email='manager@test.com', password='pass', name='Müdür', role='manager', tenant=self.tenant
        )
        self.emp_a = User.objects.create_user(
            email='emp-a@test.com', password='pass', name='Mutfak Personeli', role='employee',
            tenant=self.tenant, unit=self.unit_a,
        )
        self.sup_a = User.objects.create_user(
            email='sup-a@test.com', password='pass', name='Mutfak Şefi', role='supervisor',
            tenant=self.tenant, unit=self.unit_a,
        )

        self.general = Training.objects.create(
            title='Genel Eğitim', pdf_url='http://x/g.pdf', visible_to=['employee'],
            uploaded_by=self.manager, tenant=self.tenant,
        )
        self.unit_training_a = Training.objects.create(
            title='Mutfak Eğitimi', pdf_url='http://x/a.pdf', visible_to=['employee'],
            uploaded_by=self.manager, tenant=self.tenant, unit=self.unit_a,
        )
        self.unit_training_b = Training.objects.create(
            title='Bar Eğitimi', pdf_url='http://x/b.pdf', visible_to=['employee'],
            uploaded_by=self.manager, tenant=self.tenant, unit=self.unit_b,
        )

    @requires_json_contains
    def test_employee_sees_general_and_own_unit_not_other_unit(self):
        auth(self.client, self.emp_a)
        resp = self.client.get('/api/trainings/')
        titles = {t['title'] for t in resp.data}
        self.assertIn('Genel Eğitim', titles)
        self.assertIn('Mutfak Eğitimi', titles)
        self.assertNotIn('Bar Eğitimi', titles)

    @requires_json_contains
    def test_employee_cannot_open_other_unit_training_detail(self):
        auth(self.client, self.emp_a)
        resp = self.client.get(f'/api/trainings/{self.unit_training_b.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_sees_everything(self):
        auth(self.client, self.manager)
        resp = self.client.get('/api/trainings/')
        titles = {t['title'] for t in resp.data}
        self.assertEqual(titles, {'Genel Eğitim', 'Mutfak Eğitimi', 'Bar Eğitimi'})

    def test_supervisor_can_create_training_forced_to_own_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.post('/api/trainings/', {
            'title': 'Şef Eğitimi', 'pdf_url': 'https://example.com/s.pdf', 'visible_to': ['employee'],
            'unit_id': self.unit_b.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data['unit']['id'], self.unit_a.id)

    def test_supervisor_without_unit_cannot_create_training(self):
        no_unit_sup = User.objects.create_user(
            email='sup-nounit@test.com', password='pass', name='Birimsiz Şef', role='supervisor', tenant=self.tenant,
        )
        auth(self.client, no_unit_sup)
        resp = self.client.post('/api/trainings/', {
            'title': 'X', 'pdf_url': 'https://example.com/x.pdf', 'visible_to': ['employee'],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_cannot_create_training(self):
        auth(self.client, self.emp_a)
        resp = self.client.post('/api/trainings/', {
            'title': 'X', 'pdf_url': 'https://example.com/x.pdf', 'visible_to': ['employee'],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
