import { JobRole, Role } from '@/types';
import api from './api';

export async function getRoles(): Promise<JobRole[]> {
  const { data } = await api.get<JobRole[]>('/api/users/roles/');
  return data;
}

export async function createRole(payload: { name: string; base_role: Role; unit_id?: number | null }): Promise<JobRole> {
  const { data } = await api.post<JobRole>('/api/users/roles/', payload);
  return data;
}

export async function updateRole(id: number, payload: { name: string; base_role: Role; unit_id?: number | null }): Promise<JobRole> {
  const { data } = await api.put<JobRole>(`/api/users/roles/${id}/`, payload);
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/api/users/roles/${id}/`);
}
