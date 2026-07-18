import api from './api';
import { Training } from '@/types';

export async function uploadPdf(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  // Do NOT set Content-Type manually — axios must auto-generate the multipart boundary
  const { data } = await api.post<{ url: string }>('/api/trainings/upload-pdf/', form);
  return data.url;
}

export async function getTrainings(): Promise<Training[]> {
  const { data } = await api.get<Training[]>('/api/trainings/');
  return data;
}

export async function createTraining(data: {
  title: string;
  description?: string;
  pdf_url: string;
  visible_to: string[];
}): Promise<Training> {
  const { data: res } = await api.post<Training>('/api/trainings/', data);
  return res;
}

export async function deleteTraining(id: number): Promise<void> {
  await api.delete(`/api/trainings/${id}/`);
}
