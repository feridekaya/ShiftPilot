import { Assignment } from '@/types';
import api from './api';

export async function getBusinessDate(): Promise<{ business_date: string; cutoff_hour: number }> {
  const { data } = await api.get('/api/assignments/business-date/');
  return data;
}

export async function getAssignments(filters?: { user_id?: number; date?: string }): Promise<Assignment[]> {
  const params = new URLSearchParams();
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  if (filters?.date) params.set('date', filters.date);
  const qs = params.toString() ? `?${params}` : '';
  const { data } = await api.get<Assignment[]>(`/api/assignments/${qs}`);
  return data;
}

export async function bulkAssign(
  date: string,
  assignments: { user_id: number; task_id: number; zone_id?: number }[]
): Promise<{ created: number; errors: string[]; assignments: Assignment[] }> {
  const { data } = await api.post('/api/assignments/bulk/', { date, assignments });
  return data;
}

export async function getPreviousDayAssignments(date: string): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>(`/api/assignments/previous-day/?date=${date}`);
  return data;
}

export async function createAssignment(payload: {
  user_id: number;
  task_id: number;
  shift_id: number;
  zone_id: number;
  date: string;
}): Promise<Assignment> {
  const { data } = await api.post<Assignment>('/api/assignments/', payload);
  return data;
}

export async function updateAssignment(id: number, payload: {
  user_id: number;
  task_id: number;
  shift_id: number;
  zone_id: number;
  date: string;
}): Promise<Assignment> {
  const { data } = await api.put<Assignment>(`/api/assignments/${id}/`, payload);
  return data;
}

export async function deleteAssignment(id: number): Promise<void> {
  await api.delete(`/api/assignments/${id}/`);
}

export interface UserPerformance {
  user_id: number;
  user_name: string;
  user_role: string;
  total_assignments: number;
  completed: number;
  approved: number;
  rejected: number;
  pending: number;
  total_coefficient: number;
  completion_rate: number | null;
  approval_rate: number | null;
  redo_rate: number | null;
  redo_count: number;
  total_submissions: number;
  avg_submissions_per_task: number | null;
}

export async function getStoreAssignments(): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>('/api/assignments/store/');
  return data;
}

export interface AuditEntry {
  id: number;
  assignment_date: string;
  submitted_at: string;
  employee_id: number;
  employee_name: string;
  task_id: number;
  task_title: string;
  zone_name: string | null;
  approval_status: 'approved' | 'rejected';
  supervisor_id: number | null;
  supervisor_name: string | null;
  rating: number | null;
  note: string;
}

export async function getAuditLog(filters?: {
  supervisor_id?: number;
  task_id?: number;
  date_from?: string;
  date_to?: string;
  status?: string;
}): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (filters?.supervisor_id) params.set('supervisor_id', String(filters.supervisor_id));
  if (filters?.task_id) params.set('task_id', String(filters.task_id));
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString() ? `?${params}` : '';
  const { data } = await api.get<AuditEntry[]>(`/api/assignments/audit/${qs}`);
  return data;
}

export async function getPerformance(filters?: { date_from?: string; date_to?: string }): Promise<UserPerformance[]> {
  const params = new URLSearchParams();
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  const qs = params.toString() ? `?${params}` : '';
  const { data } = await api.get<UserPerformance[]>(`/api/assignments/performance/${qs}`);
  return data;
}
