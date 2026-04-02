import { TaskSubmission } from '@/types';
import api from './api';

export async function createSubmission(assignmentId: number, photoUrl: string): Promise<TaskSubmission> {
  const { data } = await api.post<TaskSubmission>('/api/assignments/submissions/', {
    assignment_id: assignmentId,
    photo_url: photoUrl,
  });
  return data;
}

export async function getSubmissions(status?: string): Promise<TaskSubmission[]> {
  const params = status ? `?status=${status}` : '';
  const { data } = await api.get<TaskSubmission[]>(`/api/assignments/submissions/${params}`);
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
