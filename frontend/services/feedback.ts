import api from './api';
import { Feedback, FeedbackCategory, FeedbackResponse } from '@/types';

export async function getFeedbacks(params?: { category?: string; response?: string }): Promise<Feedback[]> {
  const { data } = await api.get<Feedback[]>('/api/feedback/', { params });
  return data;
}

export async function createFeedback(data: {
  category: FeedbackCategory;
  content: string;
  is_anonymous?: boolean;
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
