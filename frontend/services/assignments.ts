import { Assignment } from '@/types';
import api from './api';

export async function getBusinessDate(): Promise<{ business_date: string; cutoff_hour: number }> {
  const { data } = await api.get('/api/assignments/business-date/');
  return data;
}

export async function getAssignments(filters?: { user_id?: number }): Promise<Assignment[]> {
  const params = filters?.user_id ? `?user_id=${filters.user_id}` : '';
  const { data } = await api.get<Assignment[]>(`/api/assignments/${params}`);
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
