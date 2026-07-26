from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tasks.models import Unit
from users.models import User
from .models import Feedback


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

        self.fb_a = Feedback.objects.create(user=self.emp_a, category='genel', content='Mutfak yorumu')
        self.fb_b = Feedback.objects.create(user=self.emp_b, category='genel', content='Bar yorumu')

    def test_supervisor_feedback_list_scoped_to_own_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/feedback/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        contents = {f['content'] for f in resp.data}
        self.assertEqual(contents, {'Mutfak yorumu'})

    def test_supervisor_cannot_respond_to_other_unit_feedback(self):
        auth(self.client, self.sup_a)
        resp = self.client.post(f'/api/feedback/{self.fb_b.id}/respond/', {'response': 'positive'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
