import { User } from '@/types';
import api from './api';

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/api/users/');
  return data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
  gender?: string;
  is_active?: boolean;
}): Promise<User> {
  const { data } = await api.post<User>('/api/users/', payload);
  return data;
}

export async function updateUser(
  id: number,
  payload: Partial<{ name: string; email: string; password: string; role: string; gender: string; is_active: boolean }>
): Promise<User> {
  const { data } = await api.put<User>(`/api/users/${id}/`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}/`);
}
