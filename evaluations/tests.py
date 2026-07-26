from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant
from tasks.models import Unit, WorkSchedule
from users.models import User
from .models import EmployeeEvaluation


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


EVAL_FIELDS = dict(
    punctuality=5, break_compliance=5, customer_comm=5, speed_agility=5, teamwork=5,
    hygiene_uniform=5, problem_solving=5, feedback_openness=5, energy_motivation=5,
)


class UnitScopingTests(APITestCase):
    def setUp(self):
        self.today = '2026-08-03'
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
        self.emp_b = User.objects.create_user(
            email='emp-b@test.com', password='pass', name='Bar Personeli', role='employee',
            tenant=self.tenant, unit=self.unit_b,
        )
        WorkSchedule.objects.create(user=self.emp_a, date=self.today, is_off=False)
        WorkSchedule.objects.create(user=self.emp_b, date=self.today, is_off=False)

    def test_daily_employee_list_scoped_to_supervisor_unit(self):
        auth(self.client, self.sup_a)
        resp = self.client.get(f'/api/evaluations/daily-employees/?date={self.today}')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {row['id'] for row in resp.data}
        self.assertEqual(ids, {self.emp_a.id})

    def test_supervisor_cannot_evaluate_other_unit_employee(self):
        auth(self.client, self.sup_a)
        resp = self.client.post('/api/evaluations/', {
            'evaluatee': self.emp_b.id, 'date': self.today, **EVAL_FIELDS,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(EmployeeEvaluation.objects.filter(evaluatee=self.emp_b).exists())

    def test_supervisor_can_evaluate_own_unit_employee(self):
        auth(self.client, self.sup_a)
        resp = self.client.post('/api/evaluations/', {
            'evaluatee': self.emp_a.id, 'date': self.today, **EVAL_FIELDS,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)

    def test_supervisor_summary_scoped_to_own_unit(self):
        EmployeeEvaluation.objects.create(evaluatee=self.emp_a, evaluator=self.manager, date=self.today, **EVAL_FIELDS)
        EmployeeEvaluation.objects.create(evaluatee=self.emp_b, evaluator=self.manager, date=self.today, **EVAL_FIELDS)

        auth(self.client, self.sup_a)
        resp = self.client.get('/api/evaluations/summary/')
        names = {row['employee_id'] for row in resp.data}
        self.assertEqual(names, {self.emp_a.id})

    def test_employee_can_only_view_own_evaluation(self):
        ev_a = EmployeeEvaluation.objects.create(evaluatee=self.emp_a, evaluator=self.manager, date=self.today, **EVAL_FIELDS)
        ev_b = EmployeeEvaluation.objects.create(evaluatee=self.emp_b, evaluator=self.manager, date='2026-08-04', **EVAL_FIELDS)

        auth(self.client, self.emp_a)
        resp = self.client.get(f'/api/evaluations/{ev_a.id}/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        resp2 = self.client.get(f'/api/evaluations/{ev_b.id}/')
        self.assertEqual(resp2.status_code, status.HTTP_404_NOT_FOUND)

    def test_manager_sees_everything(self):
        EmployeeEvaluation.objects.create(evaluatee=self.emp_a, evaluator=self.manager, date=self.today, **EVAL_FIELDS)
        EmployeeEvaluation.objects.create(evaluatee=self.emp_b, evaluator=self.manager, date=self.today, **EVAL_FIELDS)

        auth(self.client, self.manager)
        resp = self.client.get('/api/evaluations/summary/')
        ids = {row['employee_id'] for row in resp.data}
        self.assertEqual(ids, {self.emp_a.id, self.emp_b.id})
