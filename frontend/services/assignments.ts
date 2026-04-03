import { Assignment } from '@/types';
import api from './api';

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
