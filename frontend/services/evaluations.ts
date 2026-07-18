import api from './api';
import { DailyEmployee, EmployeeEvaluation } from '@/types';

export async function getDailyEmployees(date: string): Promise<DailyEmployee[]> {
  const { data } = await api.get<DailyEmployee[]>('/api/evaluations/daily-employees/', { params: { date } });
  return data;
}

export async function createEvaluation(payload: {
  evaluatee: number;
  date: string;
  punctuality: number;
  break_compliance: number;
  customer_comm: number;
  speed_agility: number;
  teamwork: number;
  hygiene_uniform: number;
  problem_solving: number;
  feedback_openness: number;
  energy_motivation: number;
  note?: string;
}): Promise<EmployeeEvaluation> {
  const { data } = await api.post<EmployeeEvaluation>('/api/evaluations/', payload);
  return data;
}
