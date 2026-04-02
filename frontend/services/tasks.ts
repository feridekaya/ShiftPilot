import { Task, Zone, Shift, TaskSchedule } from '@/types';
import api from './api';

// Tasks
export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/api/tasks/');
  return data;
}

export async function createTask(payload: {
  title: string;
  description?: string;
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

// Shifts
export async function getShifts(): Promise<Shift[]> {
  const { data } = await api.get<Shift[]>('/api/tasks/shifts/');
  return data;
}

export async function createShift(payload: { name: string; start_time: string; end_time: string }): Promise<Shift> {
  const { data } = await api.post<Shift>('/api/tasks/shifts/', payload);
  return data;
}

// Schedules
export async function getSchedules(): Promise<TaskSchedule[]> {
  const { data } = await api.get<TaskSchedule[]>('/api/tasks/schedules/');
  return data;
}

export async function createSchedule(payload: {
  task_id: number;
  frequency: string;
  days_of_week?: number[];
}): Promise<TaskSchedule> {
  const { data } = await api.post<TaskSchedule>('/api/tasks/schedules/', payload);
  return data;
}
