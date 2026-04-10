import api from './api';

export interface Break {
  id: number;
  user: number;
  user_name: string;
  user_role: string;
  break_type: 'lunch' | 'short';
  break_type_label: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  duration_seconds: number;
  duration_minutes: number;
}

export interface BreakSummary {
  user_id: number;
  user_name: string;
  user_role: string;
  date: string;
  break_count: number;
  total_minutes: number;
  lunch_used: boolean;
  short_count: number;
}

export async function startBreak(break_type: 'lunch' | 'short'): Promise<Break> {
  const { data } = await api.post<Break>('/api/breaks/start/', { break_type });
  return data;
}

export async function endBreak(): Promise<Break> {
  const { data } = await api.post<Break>('/api/breaks/end/');
  return data;
}

export async function getMyActiveBreak(): Promise<Break | null> {
  const { data } = await api.get<Break | null>('/api/breaks/my-active/');
  return data;
}

export async function getActiveBreaks(): Promise<Break[]> {
  const { data } = await api.get<Break[]>('/api/breaks/active/');
  return data;
}

export async function getBreakSummary(date?: string): Promise<BreakSummary[]> {
  const qs = date ? `?summary=1&date=${date}` : '?summary=1';
  const { data } = await api.get<BreakSummary[]>(`/api/breaks/${qs}`);
  return data;
}

export async function getBreaks(filters?: { date?: string; date_from?: string; date_to?: string; user_id?: number }): Promise<Break[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.set('date', filters.date);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  const qs = params.toString() ? `?${params}` : '';
  const { data } = await api.get<Break[]>(`/api/breaks/${qs}`);
  return data;
}
