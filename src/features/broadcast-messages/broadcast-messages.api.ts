import { api, type ApiResponse } from '@/services/api';

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  message_type?: string;
  target_audience?: string;
  venue?: string;
  event_date?: string;
  created_at: string;
}

export async function fetchPublicAnnouncements(): Promise<PublicAnnouncement[]> {
  try {
    const { data } = await api.get<any>('/broadcast-messages/public');
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('Failed to fetch public announcements:', err);
    return [];
  }
}

export async function sendOfficialAnnouncement(body: string, subject = 'TUMCU Official Announcement') {
  const { data } = await api.post('/broadcast-messages/announcement', { subject, body });
  return data.data;
}
