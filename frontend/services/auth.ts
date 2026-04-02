import axios from 'axios';
import { AuthResponse, AuthUser } from '@/types';
import api from './api';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`,
    { email, password }
  );
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  gender?: string;
}): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, payload);
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/api/auth/me');
  return data;
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
