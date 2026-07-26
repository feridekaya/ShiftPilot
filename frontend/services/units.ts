import { Unit } from '@/types';
import api from './api';

export async function getUnits(): Promise<Unit[]> {
  const { data } = await api.get<Unit[]>('/api/tasks/units/');
  return data;
}

export async function createUnit(payload: { name: string; description?: string }): Promise<Unit> {
  const { data } = await api.post<Unit>('/api/tasks/units/', payload);
  return data;
}

export async function updateUnit(id: number, payload: { name: string; description?: string }): Promise<Unit> {
  const { data } = await api.put<Unit>(`/api/tasks/units/${id}/`, payload);
  return data;
}

export async function deleteUnit(id: number): Promise<void> {
  await api.delete(`/api/tasks/units/${id}/`);
}
