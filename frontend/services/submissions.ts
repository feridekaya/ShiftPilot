import { TaskSubmission } from '@/types';
import api from './api';

export async function createSubmission(assignmentId: number, photoUrl: string): Promise<TaskSubmission> {
  const { data } = await api.post<TaskSubmission>('/api/assignments/submissions/', {
    assignment_id: assignmentId,
    photo_url: photoUrl,
  });
  return data;
}

export async function getSubmissions(filters?: { status?: string; assignment_id?: number; user_id?: number }): Promise<TaskSubmission[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignment_id) params.set('assignment_id', String(filters.assignment_id));
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  const q = params.toString();
  const { data } = await api.get<TaskSubmission[]>(`/api/assignments/submissions/${q ? '?' + q : ''}`);
  return data;
}

export async function approveSubmission(id: number, note?: string): Promise<TaskSubmission> {
  const { data } = await api.put<TaskSubmission>(
    `/api/assignments/submissions/${id}/approve/`,
    { note: note || '' }
  );
  return data;
}

export async function rejectSubmission(id: number, note?: string): Promise<TaskSubmission> {
  const { data } = await api.put<TaskSubmission>(
    `/api/assignments/submissions/${id}/reject/`,
    { note: note || '' }
  );
  return data;
}
