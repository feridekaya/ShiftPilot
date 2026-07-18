import api from './api';
import { Feedback, FeedbackCategory, FeedbackResponse } from '@/types';

export interface FeedbackPeriodStats {
  customer: { avg: number | null; count: number };
  personnel: { positive: number; negative: number; pending: number; total: number };
}

export interface FeedbackStats {
  today: FeedbackPeriodStats;
  week: FeedbackPeriodStats;
  month: FeedbackPeriodStats;
  overall: FeedbackPeriodStats;
}

export async function getFeedbacks(params?: { category?: string; response?: string }): Promise<Feedback[]> {
  const { data } = await api.get<Feedback[]>('/api/feedback/', { params });
  return data;
}

export async function uploadFeedbackPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await api.post<{ url: string }>('/api/assignments/upload-photo/', form);
  return data.url;
}

export async function createFeedback(data: {
  category: FeedbackCategory;
  content: string;
  is_anonymous?: boolean;
  customer_rating?: number | null;
  photo_url?: string;
}): Promise<Feedback> {
  const res = await api.post<Feedback>('/api/feedback/', data);
  return res.data;
}

export async function respondToFeedback(id: number, data: {
  response: FeedbackResponse;
  response_note?: string;
}): Promise<Feedback> {
  const res = await api.post<Feedback>(`/api/feedback/${id}/respond/`, data);
  return res.data;
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  const { data } = await api.get<FeedbackStats>('/api/feedback/stats/');
  return data;
}
