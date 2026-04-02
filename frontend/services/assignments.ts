import { Assignment } from '@/types';
import api from './api';

export async function getAssignments(userId?: number): Promise<Assignment[]> {
  const params = userId ? `?user_id=${userId}` : '';
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
