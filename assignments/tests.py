"""
Görev Süreci Testleri
=====================
Tam yaşam döngüsü: atama → gönderim → onay/red → yeniden gönderim → denetim
"""
from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from tasks.models import Task, Zone, Shift
from .models import Assignment, TaskSubmission, RejectionLog


# ── Helpers ───────────────────────────────────────────────────────────────────

def auth(client, user):
    """JWT ile client'ı authenticate eder."""
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')


class TaskFlowTestCase(APITestCase):
    """Tüm süreci kapsayan temel fixture."""

    def setUp(self):
        self.today = date.today().isoformat()

        # Kullanıcılar
        self.manager = User.objects.create_user(
            email='manager@test.com', password='pass', name='Müdür', role='manager'
        )
        self.supervisor = User.objects.create_user(
            email='supervisor@test.com', password='pass', name='Şef', role='supervisor'
        )
        self.employee = User.objects.create_user(
            email='employee@test.com', password='pass', name='Personel', role='employee'
        )

        # Görev, bölge, vardiya
        self.zone = Zone.objects.create(name='Ön Kasa')
        self.shift = Shift.objects.create(name='Sabah', start_time='09:00', end_time='18:00')
        self.task = Task.objects.create(
            title='Kasa Temizliği',
            requires_photo=False,
            coefficient=2,
            created_by=self.manager,
        )

    # ── Convenience ───────────────────────────────────────────────────────────

    def _assign(self):
        """Manager toplu atama yapar, Assignment döner."""
        auth(self.client, self.manager)
        resp = self.client.post('/api/assignments/bulk/', {
            'date': self.today,
            'assignments': [{'user_id': self.employee.id, 'task_id': self.task.id}],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        return Assignment.objects.get(user=self.employee, task=self.task, date=self.today)

    def _submit(self, assignment):
        """Personel görevi gönderir, Submission döner."""
        auth(self.client, self.employee)
        resp = self.client.post('/api/assignments/submissions/', {
            'assignment_id': assignment.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        return TaskSubmission.objects.get(pk=resp.data['id'])

    def _approve(self, submission, rating=None, note=''):
        auth(self.client, self.supervisor)
        payload = {'note': note}
        if rating:
            payload['rating'] = rating
        resp = self.client.put(f'/api/assignments/submissions/{submission.id}/approve/', payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        return resp

    def _reject(self, submission, note='Red notu'):
        auth(self.client, self.supervisor)
        resp = self.client.put(f'/api/assignments/submissions/{submission.id}/reject/', {'note': note}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        return resp


# ── 1. Atama Testleri ─────────────────────────────────────────────────────────

class AssignmentCreationTests(TaskFlowTestCase):

    def test_manager_bulk_assign_creates_assignment(self):
        assignment = self._assign()
        self.assertEqual(assignment.status, 'pending')
        self.assertEqual(assignment.task, self.task)
        self.assertEqual(assignment.user, self.employee)

    def test_employee_cannot_bulk_assign(self):
        auth(self.client, self.employee)
        resp = self.client.post('/api/assignments/bulk/', {
            'date': self.today,
            'assignments': [{'user_id': self.employee.id, 'task_id': self.task.id}],
        }, format='json')
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_bulk_assign_replaces_pending(self):
        """Aynı tarih için ikinci toplu atama önceki pending'leri siler."""
        self._assign()
        self.assertEqual(Assignment.objects.filter(date=self.today, status='pending').count(), 1)

        auth(self.client, self.manager)
        self.client.post('/api/assignments/bulk/', {
            'date': self.today,
            'assignments': [{'user_id': self.employee.id, 'task_id': self.task.id}],
        }, format='json')
        # Hâlâ 1 tane olmalı (eski silindi, yeni eklendi)
        self.assertEqual(Assignment.objects.filter(date=self.today, status='pending').count(), 1)

    def test_gender_restricted_task_blocks_wrong_gender(self):
        male_task = Task.objects.create(
            title='Ağır Kaldırma', coefficient=1,
            allowed_genders='male', created_by=self.manager
        )
        female_emp = User.objects.create_user(
            email='female@test.com', password='pass', name='Kadın', role='employee', gender='female'
        )
        auth(self.client, self.manager)
        resp = self.client.post('/api/assignments/bulk/', {
            'date': self.today,
            'assignments': [{'user_id': female_emp.id, 'task_id': male_task.id}],
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Hata listesi dolu, assignment oluşmamış olmalı
        self.assertEqual(resp.data['created'], 0)
        self.assertTrue(len(resp.data['errors']) > 0)

    def test_employee_sees_own_assignments_only(self):
        """Employee kendi atamaları dışındakileri görmemeli."""
        other_emp = User.objects.create_user(
            email='other@test.com', password='pass', name='Diğer', role='employee'
        )
        task2 = Task.objects.create(title='Diğer Görev', coefficient=1, created_by=self.manager)
        Assignment.objects.create(user=other_emp, task=task2, date=self.today)

        assignment = self._assign()

        auth(self.client, self.employee)
        resp = self.client.get('/api/assignments/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [a['id'] for a in resp.data]
        self.assertIn(assignment.id, ids)
        for item in resp.data:
            self.assertEqual(item['user']['id'], self.employee.id)


# ── 2. Gönderim Testleri ──────────────────────────────────────────────────────

class SubmissionTests(TaskFlowTestCase):

    def test_employee_submit_marks_assignment_completed(self):
        assignment = self._assign()
        self._submit(assignment)
        assignment.refresh_from_db()
        self.assertEqual(assignment.status, 'completed')

    def test_photo_required_task_rejects_without_photo(self):
        photo_task = Task.objects.create(
            title='Fotoğraflı Görev', requires_photo=True,
            coefficient=1, created_by=self.manager
        )
        auth(self.client, self.manager)
        self.client.post('/api/assignments/bulk/', {
            'date': self.today,
            'assignments': [{'user_id': self.employee.id, 'task_id': photo_task.id}],
        }, format='json')
        photo_assignment = Assignment.objects.get(user=self.employee, task=photo_task, date=self.today)

        auth(self.client, self.employee)
        resp = self.client.post('/api/assignments/submissions/', {
            'assignment_id': photo_assignment.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_employee_cannot_submit_for_others_assignment(self):
        assignment = self._assign()
        other_emp = User.objects.create_user(
            email='other@test.com', password='pass', name='Diğer', role='employee'
        )
        auth(self.client, other_emp)
        resp = self.client.post('/api/assignments/submissions/', {
            'assignment_id': assignment.id,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# ── 3. Onay / Red Testleri ───────────────────────────────────────────────────

class ApprovalTests(TaskFlowTestCase):

    def test_approve_sets_status_and_rating(self):
        assignment = self._assign()
        submission = self._submit(assignment)

        self._approve(submission, rating=4, note='Güzel iş')

        submission.refresh_from_db()
        assignment.refresh_from_db()
        self.assertEqual(submission.approval_status, 'approved')
        self.assertEqual(submission.rating, 4)
        self.assertEqual(submission.approved_by, self.supervisor)
        self.assertEqual(assignment.status, 'approved')

    def test_approve_without_rating_is_valid(self):
        assignment = self._assign()
        submission = self._submit(assignment)
        self._approve(submission)

        submission.refresh_from_db()
        self.assertEqual(submission.approval_status, 'approved')
        self.assertIsNone(submission.rating)

    def test_rating_out_of_range_rejected(self):
        assignment = self._assign()
        submission = self._submit(assignment)

        auth(self.client, self.supervisor)
        resp = self.client.put(f'/api/assignments/submissions/{submission.id}/approve/', {
            'rating': 6
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_sets_pending_and_creates_rejection_log(self):
        assignment = self._assign()
        submission = self._submit(assignment)

        self._reject(submission, note='Eksik temizlik')

        submission.refresh_from_db()
        assignment.refresh_from_db()
        self.assertEqual(submission.approval_status, 'rejected')
        self.assertEqual(assignment.status, 'pending')

        log = RejectionLog.objects.get(submission=submission)
        self.assertEqual(log.rejected_by, self.supervisor)
        self.assertEqual(log.note, 'Eksik temizlik')

    def test_employee_cannot_approve(self):
        assignment = self._assign()
        submission = self._submit(assignment)

        auth(self.client, self.employee)
        resp = self.client.put(f'/api/assignments/submissions/{submission.id}/approve/', {}, format='json')
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_manager_cannot_approve(self):
        """Manager rolü IsSupervisor guard'ını geçemez."""
        assignment = self._assign()
        submission = self._submit(assignment)

        auth(self.client, self.manager)
        resp = self.client.put(f'/api/assignments/submissions/{submission.id}/approve/', {}, format='json')
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


# ── 4. Yeniden Gönderim Testi ─────────────────────────────────────────────────

class ResubmissionTests(TaskFlowTestCase):

    def test_employee_can_resubmit_after_rejection(self):
        """Red → pending → personel yeniden gönderir → yeni submission oluşur."""
        assignment = self._assign()
        sub1 = self._submit(assignment)
        self._reject(sub1)

        assignment.refresh_from_db()
        self.assertEqual(assignment.status, 'pending')

        sub2 = self._submit(assignment)
        self.assertNotEqual(sub1.id, sub2.id)

        # İki submission da DB'de mevcut
        self.assertEqual(TaskSubmission.objects.filter(assignment=assignment).count(), 2)

    def test_rejection_log_grows_with_each_rejection(self):
        assignment = self._assign()
        sub1 = self._submit(assignment)
        self._reject(sub1)

        sub2 = self._submit(assignment)
        self._reject(sub2)

        self.assertEqual(RejectionLog.objects.filter(assignment=assignment).count(), 2)


# ── 5. Denetim Masası Testi ───────────────────────────────────────────────────

class AuditViewTests(TaskFlowTestCase):

    def test_audit_log_returns_approved_and_rejected(self):
        assignment = self._assign()
        sub = self._submit(assignment)
        self._approve(sub, rating=5)

        auth(self.client, self.manager)
        resp = self.client.get('/api/assignments/audit/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)
        entry = resp.data[0]
        self.assertEqual(entry['approval_status'], 'approved')
        self.assertEqual(entry['rating'], 5)
        self.assertEqual(entry['employee_name'], self.employee.name)
        self.assertEqual(entry['supervisor_name'], self.supervisor.name)

    def test_audit_log_supervisor_filter(self):
        """Farklı şef için filtreleme çalışmalı."""
        sup2 = User.objects.create_user(
            email='sup2@test.com', password='pass', name='Şef2', role='supervisor'
        )
        assignment = self._assign()
        sub = self._submit(assignment)
        self._approve(sub)  # self.supervisor onayladı

        auth(self.client, self.manager)
        resp = self.client.get(f'/api/assignments/audit/?supervisor_id={sup2.id}')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 0)

        resp2 = self.client.get(f'/api/assignments/audit/?supervisor_id={self.supervisor.id}')
        self.assertEqual(len(resp2.data), 1)

    def test_audit_log_status_filter(self):
        assignment = self._assign()
        sub = self._submit(assignment)
        self._reject(sub)

        auth(self.client, self.manager)
        resp = self.client.get('/api/assignments/audit/?status=rejected')
        self.assertEqual(len(resp.data), 1)

        resp2 = self.client.get('/api/assignments/audit/?status=approved')
        self.assertEqual(len(resp2.data), 0)

    def test_audit_log_date_filter(self):
        assignment = self._assign()
        sub = self._submit(assignment)
        self._approve(sub)

        auth(self.client, self.manager)
        resp = self.client.get(f'/api/assignments/audit/?date_from={self.today}&date_to={self.today}')
        self.assertEqual(len(resp.data), 1)

        resp2 = self.client.get('/api/assignments/audit/?date_from=2000-01-01&date_to=2000-01-01')
        self.assertEqual(len(resp2.data), 0)

    def test_audit_log_forbidden_for_non_manager(self):
        auth(self.client, self.employee)
        resp = self.client.get('/api/assignments/audit/')
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

        auth(self.client, self.supervisor)
        resp = self.client.get('/api/assignments/audit/')
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


# ── 6. Performans Görünümü Testi ──────────────────────────────────────────────

class PerformanceViewTests(TaskFlowTestCase):

    def test_performance_reflects_approved_assignment(self):
        assignment = self._assign()
        sub = self._submit(assignment)
        self._approve(sub, rating=3)

        auth(self.client, self.manager)
        resp = self.client.get('/api/assignments/performance/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        emp_data = next((r for r in resp.data if r['user_id'] == self.employee.id), None)
        self.assertIsNotNone(emp_data)
        self.assertEqual(emp_data['approved'], 1)
        self.assertEqual(emp_data['total_assignments'], 1)
        self.assertEqual(emp_data['approval_rate'], 100.0)

    def test_employee_sees_only_own_performance(self):
        other = User.objects.create_user(
            email='other@test.com', password='pass', name='Diğer', role='employee'
        )
        task2 = Task.objects.create(title='Görev2', coefficient=1, created_by=self.manager)
        Assignment.objects.create(user=other, task=task2, date=self.today)

        auth(self.client, self.employee)
        resp = self.client.get('/api/assignments/performance/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        for row in resp.data:
            self.assertEqual(row['user_id'], self.employee.id)
