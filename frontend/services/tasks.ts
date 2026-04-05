import { Task, Zone, Shift, TaskSchedule, TaskCategory } from '@/types';
import api from './api';

// Tasks
export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/api/tasks/');
  return data;
}

export async function createTask(payload: {
  title: string;
  description?: string;
  category?: TaskCategory;
  zone_id: number;
  requires_photo?: boolean;
  coefficient: number;
  allowed_roles: string[];
  allowed_genders?: string;
}): Promise<Task> {
  const { data } = await api.post<Task>('/api/tasks/', payload);
  return data;
}

export async function updateTask(id: number, payload: Partial<Parameters<typeof createTask>[0]>): Promise<Task> {
  const { data } = await api.put<Task>(`/api/tasks/${id}/`, payload);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/api/tasks/${id}/`);
}

// Zones
export async function getZones(): Promise<Zone[]> {
  const { data } = await api.get<Zone[]>('/api/tasks/zones/');
  return data;
}

export async function createZone(payload: { name: string; description?: string }): Promise<Zone> {
  const { data } = await api.post<Zone>('/api/tasks/zones/', payload);
  return data;
}

export async function updateZone(id: number, payload: { name: string; description?: string }): Promise<Zone> {
  const { data } = await api.put<Zone>(`/api/tasks/zones/${id}/`, payload);
  return data;
}

export async function deleteZone(id: number): Promise<void> {
  await api.delete(`/api/tasks/zones/${id}/`);
}

// Shifts
export async function getShifts(): Promise<Shift[]> {
  const { data } = await api.get<Shift[]>('/api/tasks/shifts/');
  return data;
}

export async function createShift(payload: { name: string; start_time: string; end_time: string }): Promise<Shift> {
  const { data } = await api.post<Shift>('/api/tasks/shifts/', payload);
  return data;
}

export async function updateShift(id: number, payload: { name: string; start_time: string; end_time: string }): Promise<Shift> {
  const { data } = await api.put<Shift>(`/api/tasks/shifts/${id}/`, payload);
  return data;
}

export async function deleteShift(id: number): Promise<void> {
  await api.delete(`/api/tasks/shifts/${id}/`);
}

// Schedules
export interface SchedulePayload {
  task_id: number;
  frequency: string;
  times_per_day?: number;
  interval_hours?: number | null;
  days_of_week?: number[];
  month_day?: number | null;
  month?: number | null;
}

export async function createSchedule(payload: SchedulePayload): Promise<TaskSchedule> {
  const { data } = await api.post<TaskSchedule>('/api/tasks/schedules/', payload);
  return data;
}

export async function updateSchedule(id: number, payload: Partial<SchedulePayload>): Promise<TaskSchedule> {
  const { data } = await api.put<TaskSchedule>(`/api/tasks/schedules/${id}/`, payload);
  return data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/api/tasks/schedules/${id}/`);
}
