from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tasks.models import Unit
from .models import User, Role


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class PublicRegistrationTests(APITestCase):
    def test_public_signup_creates_new_tenant_and_inactive_manager(self):
        resp = self.client.post('/api/auth/register/', {
            'business_name': 'Deniz Restoran',
            'name': 'Ada Yılmaz',
            'email': 'ada@deniz.test',
            'password': 'pass1234',
            'role': 'manager',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

        user = User.objects.get(email='ada@deniz.test')
        self.assertFalse(user.is_active)
        self.assertEqual(user.role, 'manager')
        self.assertEqual(user.tenant.name, 'Deniz Restoran')

    def test_second_public_signup_gets_isolated_tenant(self):
        r1 = self.client.post('/api/auth/register/', {
            'business_name': 'Restoran A', 'name': 'A', 'email': 'a@a.test', 'password': 'pass1234', 'role': 'manager',
        }, format='json')
        r2 = self.client.post('/api/auth/register/', {
            'business_name': 'Restoran B', 'name': 'B', 'email': 'b@b.test', 'password': 'pass1234', 'role': 'manager',
        }, format='json')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED, r1.data)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)
        user_a = User.objects.get(email='a@a.test')
        user_b = User.objects.get(email='b@b.test')
        self.assertNotEqual(user_a.tenant_id, user_b.tenant_id)


class LicenseLimitTests(APITestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Küçük İşletme', license_limit=2)
        self.manager = User.objects.create_user(
            email='manager@test.com', password='pass', name='Müdür', role='manager', tenant=self.tenant
        )
        auth(self.client, self.manager)

    def test_manager_can_create_up_to_license_limit(self):
        # 1 seat already used by the manager; limit is 2, so exactly 1 more should succeed.
        resp = self.client.post('/api/users/', {
            'name': 'Personel 1', 'email': 'p1@test.com', 'password': 'pass1234', 'role': 'employee',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    def test_manager_blocked_once_license_full(self):
        self.client.post('/api/users/', {
            'name': 'Personel 1', 'email': 'p1@test.com', 'password': 'pass1234', 'role': 'employee',
        }, format='json')
        resp = self.client.post('/api/users/', {
            'name': 'Personel 2', 'email': 'p2@test.com', 'password': 'pass1234', 'role': 'employee',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email='p2@test.com').count(), 0)

    def test_creating_inactive_user_bypasses_license_check(self):
        resp = self.client.post('/api/users/', {
            'name': 'Personel 1', 'email': 'p1@test.com', 'password': 'pass1234', 'role': 'employee',
        }, format='json')
        resp2 = self.client.post('/api/users/', {
            'name': 'Personel 2 (Pasif)', 'email': 'p2@test.com', 'password': 'pass1234',
            'role': 'employee', 'is_active': False,
        }, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED, resp2.data)

    def test_reactivating_user_blocked_when_license_full(self):
        self.client.post('/api/users/', {
            'name': 'Personel 1', 'email': 'p1@test.com', 'password': 'pass1234', 'role': 'employee',
        }, format='json')
        inactive_user = User.objects.create_user(
            email='p2@test.com', password='pass', name='Personel 2', role='employee',
            tenant=self.tenant, is_active=False,
        )
        resp = self.client.put(f'/api/users/{inactive_user.id}/', {
            'name': inactive_user.name, 'email': inactive_user.email, 'role': 'employee', 'is_active': True,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        inactive_user.refresh_from_db()
        self.assertFalse(inactive_user.is_active)

    def test_manager_cannot_see_other_tenants_users(self):
        other_tenant = Tenant.objects.create(name='Başka İşletme', license_limit=5)
        User.objects.create_user(
            email='foreign@test.com', password='pass', name='Yabancı', role='employee', tenant=other_tenant
        )
        resp = self.client.get('/api/users/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        emails = [u['email'] for u in resp.data]
        self.assertNotIn('foreign@test.com', emails)

    def test_tenant_me_reports_license_usage(self):
        resp = self.client.get('/api/tenants/me/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['license_limit'], 2)
        self.assertEqual(resp.data['active_user_count'], 1)
        self.assertEqual(resp.data['seats_remaining'], 1)


class UnitScopingTests(APITestCase):
    """Şef (supervisor) sadece kendi birimindeki personeli görebilmeli."""

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
        self.sup_no_unit = User.objects.create_user(
            email='sup-none@test.com', password='pass', name='Atanmamış Şef', role='supervisor', tenant=self.tenant
        )
        self.emp_a = User.objects.create_user(
            email='emp-a@test.com', password='pass', name='Mutfak Personeli', role='employee',
            tenant=self.tenant, unit=self.unit_a,
        )
        self.emp_b = User.objects.create_user(
            email='emp-b@test.com', password='pass', name='Bar Personeli', role='employee',
            tenant=self.tenant, unit=self.unit_b,
        )

    def test_supervisor_sees_only_own_unit_users(self):
        auth(self.client, self.sup_a)
        resp = self.client.get('/api/users/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        emails = {u['email'] for u in resp.data}
        self.assertIn('emp-a@test.com', emails)
        self.assertNotIn('emp-b@test.com', emails)
        self.assertNotIn('manager@test.com', emails)

    def test_supervisor_without_unit_sees_nothing(self):
        auth(self.client, self.sup_no_unit)
        resp = self.client.get('/api/users/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

    def test_manager_sees_every_unit(self):
        auth(self.client, self.manager)
        resp = self.client.get('/api/users/')
        emails = {u['email'] for u in resp.data}
        self.assertIn('emp-a@test.com', emails)
        self.assertIn('emp-b@test.com', emails)

    def test_manager_can_assign_unit_to_user(self):
        auth(self.client, self.manager)
        resp = self.client.put(f'/api/users/{self.emp_a.id}/', {
            'name': self.emp_a.name, 'email': self.emp_a.email, 'role': 'employee',
            'unit_id': self.unit_b.id, 'is_active': True,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.emp_a.refresh_from_db()
        self.assertEqual(self.emp_a.unit_id, self.unit_b.id)


class RoleTests(APITestCase):
    """Özelleştirilebilir Rol (iş unvanı) sistemi."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name='Restoran', license_limit=100)
        self.manager = User.objects.create_user(
            email='manager@test.com', password='pass', name='Müdür', role='manager', tenant=self.tenant
        )
        auth(self.client, self.manager)

    def test_tenant_creation_seeds_three_default_roles(self):
        names = set(Role.objects.filter(tenant=self.tenant).values_list('name', flat=True))
        self.assertEqual(names, {'Yönetici', 'Şef', 'Personel'})

    def test_creating_user_with_job_role_sets_yetki_automatically(self):
        sushi_chef = Role.objects.create(tenant=self.tenant, name='Suşi Şefi', base_role='supervisor')
        resp = self.client.post('/api/users/', {
            'name': 'Ahmet', 'email': 'ahmet@test.com', 'password': 'pass1234',
            'job_role_id': sushi_chef.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        user = User.objects.get(email='ahmet@test.com')
        self.assertEqual(user.role, 'supervisor')
        self.assertEqual(user.job_role_id, sushi_chef.id)

    def test_creating_user_without_role_or_job_role_fails(self):
        resp = self.client.post('/api/users/', {
            'name': 'Kimliksiz', 'email': 'kimliksiz@test.com', 'password': 'pass1234',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_manager_cannot_manage_roles_of_other_tenant(self):
        other_tenant = Tenant.objects.create(name='Başka İşletme', license_limit=5)
        foreign_role = Role.objects.get(tenant=other_tenant, name='Şef')
        resp = self.client.get('/api/users/roles/')
        role_ids = {r['id'] for r in resp.data}
        self.assertNotIn(foreign_role.id, role_ids)

    def test_role_can_have_a_unit_and_it_is_returned(self):
        kitchen = Unit.objects.create(tenant=self.tenant, name='Mutfak Ekibi')
        resp = self.client.post('/api/users/roles/', {
            'name': 'Suşi Şefi', 'base_role': 'supervisor', 'unit_id': kitchen.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(resp.data['unit']['id'], kitchen.id)

    def test_creating_user_with_job_role_bound_to_unit_sets_unit_automatically(self):
        kitchen = Unit.objects.create(tenant=self.tenant, name='Mutfak Ekibi')
        sushi_chef = Role.objects.create(
            tenant=self.tenant, name='Suşi Şefi', base_role='supervisor', unit=kitchen
        )
        resp = self.client.post('/api/users/', {
            'name': 'Ahmet', 'email': 'ahmet-unit@test.com', 'password': 'pass1234',
            'job_role_id': sushi_chef.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        user = User.objects.get(email='ahmet-unit@test.com')
        self.assertEqual(user.role, 'supervisor')
        self.assertEqual(user.unit_id, kitchen.id)

    def test_creating_user_with_job_role_without_unit_leaves_unit_unset(self):
        sushi_chef = Role.objects.create(tenant=self.tenant, name='Suşi Şefi', base_role='supervisor')
        resp = self.client.post('/api/users/', {
            'name': 'Ayşe', 'email': 'ayse-nounit@test.com', 'password': 'pass1234',
            'job_role_id': sushi_chef.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        user = User.objects.get(email='ayse-nounit@test.com')
        self.assertIsNone(user.unit_id)

    def test_updating_user_job_role_to_one_bound_to_unit_syncs_unit(self):
        kitchen = Unit.objects.create(tenant=self.tenant, name='Mutfak Ekibi')
        sushi_chef = Role.objects.create(
            tenant=self.tenant, name='Suşi Şefi', base_role='supervisor', unit=kitchen
        )
        employee = User.objects.create_user(
            email='mehmet@test.com', password='pass', name='Mehmet', role='employee', tenant=self.tenant
        )
        resp = self.client.put(f'/api/users/{employee.id}/', {
            'name': employee.name, 'email': employee.email, 'job_role_id': sushi_chef.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        employee.refresh_from_db()
        self.assertEqual(employee.role, 'supervisor')
        self.assertEqual(employee.unit_id, kitchen.id)
