import api from './api';
import { Announcement, AnnouncementPriority } from '@/types';

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get<Announcement[]>('/api/announcements/');
  return data;
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority: AnnouncementPriority;
}): Promise<Announcement> {
  const response = await api.post<Announcement>('/api/announcements/', data);
  return response.data;
}

export async function updateAnnouncement(
  id: number,
  data: { title?: string; content?: string; priority?: AnnouncementPriority; is_active?: boolean }
): Promise<Announcement> {
  const response = await api.put<Announcement>(`/api/announcements/${id}/`, data);
  return response.data;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await api.delete(`/api/announcements/${id}/`);
}

export async function markAsRead(id: number): Promise<Announcement> {
  const { data } = await api.post<Announcement>(`/api/announcements/${id}/read/`);
  return data;
}
