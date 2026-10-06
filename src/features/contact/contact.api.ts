import { api, type ApiResponse } from '@/services/api';

export interface ContactMessage {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  assigned_to: string | null;
}

export async function fetchContactMessages(status = 'all') {
  const { data } = await api.get<ApiResponse<ContactMessage[]> & { meta?: any }>('/contact', {
    params: { status, page: 1, pageSize: 50 },
  });
  return { rows: data.data || [], meta: data.meta || {} };
}

export async function updateContactMessage(
  id: string,
  payload: { status?: ContactMessage['status']; assigned_to?: string | null }
) {
  const { data } = await api.put<ApiResponse<ContactMessage>>(`/contact/${id}`, payload);
  return data.data;
}
