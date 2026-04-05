import api from './api';

export interface WorkScheduleEntry {
  id?: number;
  user_id: number;
  user_name?: string;
  user_role?: string;
  date: string;
  is_off: boolean;
  start_time: string | null;
  end_time: string | null;
}

export async function getWeekSchedules(weekStart: string): Promise<WorkScheduleEntry[]> {
  const { data } = await api.get<WorkScheduleEntry[]>(`/api/tasks/work-schedules/?week_start=${weekStart}`);
  return data;
}

export async function bulkSaveSchedules(items: WorkScheduleEntry[]): Promise<WorkScheduleEntry[]> {
  const { data } = await api.post<WorkScheduleEntry[]>('/api/tasks/work-schedules/bulk/', items);
  return data;
}
