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
