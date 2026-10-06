import { api, type ApiResponse } from '@/services/api';

export interface PublicEvent {
  id: string;
  title: string;
  event_type: string;
  description: string | null;
  speaker?: string | null;
  topic?: string | null;
  banner_url?: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  venue?: string | null;
  preacher?: string | null;
  status: string;
  capacity?: number | null;
  day_of_week?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  theme?: string;
  requires_registration?: number | boolean;
}

export interface WeeklyProgramme {
  id: string;
  day: string;
  title: string;
  programme_type?: string;
  time: string;
  venue: string;
  leader?: string;
  description?: string;
  alternating_enabled?: number;
  active_this_week_title?: string;
  alternating_info?: Record<string, any>;
}

export interface DownloadableCalendarInfo {
  is_custom: boolean;
  title: string;
  semester: string;
  academic_year: string;
  filename: string;
  saved_filename?: string;
  public_url: string;
  file_size_bytes: number;
  formatted_size: string;
  mime_type: string;
  file_format: string;
  uploaded_at: string | null;
  uploaded_by_id?: string | null;
  uploaded_by_name: string | null;
  notes?: string | null;
}

/** Public endpoint — only approved/open/ongoing/completed events, fetches entire semester roster */
export async function fetchPublicEvents(pageSize: number = 100): Promise<PublicEvent[]> {
  try {
    const { data } = await api.get<any>('/events/public', {
      params: { pageSize },
    });
    const rows = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return rows.map((event: PublicEvent) => ({ ...event, preacher: event.preacher || event.speaker || null, theme: event.theme || event.topic || null }));
    return [];
  } catch (err) {
    console.error('Failed to fetch public events:', err);
    return [];
  }
}

/** Admin / Authenticated: fetch all events */
export async function fetchAllEvents(): Promise<PublicEvent[]> {
  try {
    const { data } = await api.get<any>('/events');
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.rows)) return data.data.rows;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('Failed to fetch all events:', err);
    return [];
  }
}

export async function createEvent(payload: Partial<PublicEvent>): Promise<PublicEvent> {
  const { data } = await api.post<ApiResponse<PublicEvent>>('/events', payload);
  return data.data;
}

export async function updateEvent(id: string, payload: Partial<PublicEvent>): Promise<PublicEvent> {
  const { data } = await api.put<ApiResponse<PublicEvent>>(`/events/${id}`, payload);
  return data.data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`);
}

/** Weekly programmes endpoints */
export async function fetchProgrammes(): Promise<WeeklyProgramme[]> {
  try {
    const { data } = await api.get<any>('/programmes');
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('Failed to fetch programmes:', err);
    return [];
  }
}

export async function createProgramme(payload: Partial<WeeklyProgramme>): Promise<WeeklyProgramme> {
  const { data } = await api.post<ApiResponse<WeeklyProgramme>>('/programmes', payload);
  return data.data;
}

export async function updateProgramme(id: string, payload: Partial<WeeklyProgramme>): Promise<WeeklyProgramme> {
  const { data } = await api.put<ApiResponse<WeeklyProgramme>>(`/programmes/${id}`, payload);
  return data.data;
}

export async function deleteProgramme(id: string): Promise<void> {
  await api.delete(`/programmes/${id}`);
}

export async function fetchMondayForecast(): Promise<any> {
  try {
    const { data } = await api.get<any>('/programmes/monday-forecast');
    return data?.data;
  } catch (err) {
    console.error('Failed to fetch Monday forecast:', err);
    return null;
  }
}

/** Downloadable calendar metadata info */
export async function fetchCalendarInfo(): Promise<DownloadableCalendarInfo> {
  try {
    const { data } = await api.get<ApiResponse<DownloadableCalendarInfo>>('/programmes/calendar-info');
    return data.data;
  } catch (err) {
    console.error('Failed to fetch calendar info:', err);
    throw err;
  }
}

/** Admin upload custom downloadable calendar file */
export async function uploadCustomCalendar(payload: {
  fileData: string; // Base64
  filename: string;
  title?: string;
  semester?: string;
  academic_year?: string;
  notes?: string;
}): Promise<DownloadableCalendarInfo> {
  const { data } = await api.post<ApiResponse<DownloadableCalendarInfo>>('/programmes/upload-calendar', payload);
  return data.data;
}

/** Admin reset downloadable calendar to system default */
export async function resetCustomCalendar(): Promise<DownloadableCalendarInfo> {
  const { data } = await api.post<ApiResponse<DownloadableCalendarInfo>>('/programmes/reset-calendar');
  return data.data;
}

/** Download the official calendar document */
export function downloadOfficialCalendar(info?: DownloadableCalendarInfo | null): void {
  const filename = info?.filename || 'TUMCU-Semester-Calendar-2026';
  const link = document.createElement('a');
  link.href = '/api/programmes/download-calendar';
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Backwards-compatible alias for existing callers */
export function downloadSemesterCalendarIcs(): void {
  downloadOfficialCalendar();
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  service: 'Service / Fellowship',
  sunday_service: 'Sunday Service',
  worship_night: 'Worship Night',
  missions: 'Missions',
  mission: 'Missions & Outreach',
  evangelism: 'Evangelism',
  high_school_mission: 'High School Mission',
  retreat: 'Retreat & Camp',
  conference: 'Conference / Summit',
  leadership_summit: 'Leadership Summit',
  bible_study: 'Bible Study',
  prayer_retreat: 'Prayer Retreat',
  fellowship: 'Fellowship',
  training: 'Training Workshop',
  agm: 'Annual General Meeting',
  sgm: 'Special General Meeting',
  meeting: 'Leadership Meeting',
  camp: 'Camp',
  empowerment: 'Empowerment',
  discipleship: 'Discipleship',
  graduation_thanksgiving: 'Graduation Thanksgiving',
  other: 'Event',
};
