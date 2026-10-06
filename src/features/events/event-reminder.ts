/**
 * Event Reminder Service
 * Handles browser device push notifications, localStorage persistence,
 * Google Calendar synchronization, .ics downloads with alarms, and in-app alerts.
 */

export interface EventReminder {
  eventId: string;
  title: string;
  startAt: string;
  endAt?: string | null;
  venue?: string | null;
  location?: string | null;
  description?: string | null;
  leadTimeMinutes: number; // e.g. 0, 15, 30, 60, 1440
  email?: string;
  notifyOnDevice: boolean;
  createdAt: string;
  notified?: boolean;
}

const STORAGE_KEY = 'tumcu_event_reminders';

export function getSavedReminders(): EventReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isEventReminderSet(eventId: string): boolean {
  const list = getSavedReminders();
  return list.some((r) => r.eventId === eventId);
}

export function getEventReminder(eventId: string): EventReminder | undefined {
  const list = getSavedReminders();
  return list.find((r) => r.eventId === eventId);
}

export function saveEventReminder(reminder: EventReminder): void {
  const list = getSavedReminders();
  const filtered = list.filter((r) => r.eventId !== reminder.eventId);
  filtered.push(reminder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('tumcu_reminder_updated', { detail: reminder }));
}

export function removeEventReminder(eventId: string): void {
  const list = getSavedReminders();
  const filtered = list.filter((r) => r.eventId !== eventId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('tumcu_reminder_updated', { detail: { eventId, removed: true } }));
}

/**
 * Requests native browser notification permission.
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Dispatches a native browser notification if granted.
 */
export function triggerNativeNotification(title: string, options?: NotificationOptions): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    const notificationPayload: NotificationOptions & { vibrate?: number[] } = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options,
    };
    const n = new Notification(title, notificationPayload as NotificationOptions);
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/**
 * Plays a pleasant 2-tone melodic chime via the Web Audio API.
 */
export function playChimeSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // AudioContext blocked or unsupported
  }
}

/**
 * Generates a direct Google Calendar URL with reminder parameters.
 */
export function getGoogleCalendarUrl(event: {
  title: string;
  description?: string | null;
  location?: string | null;
  venue?: string | null;
  start_at: string;
  end_at?: string | null;
}): string {
  try {
    const startIso = new Date(event.start_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = event.end_at
      ? new Date(event.end_at).toISOString().replace(/-|:|\.\d\d\d/g, '')
      : new Date(new Date(event.start_at).getTime() + 2 * 3600 * 1000)
          .toISOString()
          .replace(/-|:|\.\d\d\d/g, '');

    const title = encodeURIComponent(`TUMCU: ${event.title}`);
    const details = encodeURIComponent(
      `${event.description || 'TUM Christian Union Campus Assembly'}\n\nVenue: ${
        event.venue || event.location || 'Assembly Hall'
      }\nWebsite: https://tumcu.ac.ke`
    );
    const loc = encodeURIComponent(event.venue || event.location || 'TUM Main Assembly Hall');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${loc}`;
  } catch {
    return '#';
  }
}

/**
 * Downloads a single event .ics file with embedded VALARM reminder.
 */
export function downloadEventReminderIcs(
  event: {
    title: string;
    description?: string | null;
    location?: string | null;
    venue?: string | null;
    start_at: string;
    end_at?: string | null;
  },
  leadMinutes = 30
): void {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
      d.getUTCHours()
    )}${pad(d.getUTCMinutes())}00Z`;

  const startDate = new Date(event.start_at);
  const endDate = event.end_at
    ? new Date(event.end_at)
    : new Date(startDate.getTime() + 2 * 3600 * 1000);

  const dtStamp = toIcsDate(new Date());
  const dtStart = toIcsDate(startDate);
  const dtEnd = toIcsDate(endDate);

  const venue = (event.venue || event.location || 'TUM Assembly Hall')
    .replace(/[,;]/g, ' ')
    .trim();
  const summary = `TUMCU: ${event.title.replace(/[,;]/g, ' ')}`;
  const description = (event.description || 'TUM Christian Union Service')
    .replace(/\n/g, '\\n')
    .replace(/[,;]/g, ' ');

  const alarmTrigger = leadMinutes > 0 ? `-PT${leadMinutes}M` : '-PT0M';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Technical University of Mombasa Christian Union//Event Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tumcu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@tumcu.ac.ke`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${venue}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    `TRIGGER:${alarmTrigger}`,
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${summary} is starting soon at ${venue}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  link.download = `TUMCU_Reminder_${safeTitle}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Checks all saved reminders against the current time.
 * Returns reminders that are currently within their alert window and not yet acknowledged.
 */
export function checkDueReminders(): EventReminder[] {
  const list = getSavedReminders();
  const now = Date.now();
  const dueList: EventReminder[] = [];

  for (const item of list) {
    if (item.notified) continue;
    const startMs = new Date(item.startAt).getTime();
    const leadMs = (item.leadTimeMinutes || 30) * 60 * 1000;
    const alertTime = startMs - leadMs;

    // Due window: from alertTime until 2 hours after event starts
    if (now >= alertTime && now <= startMs + 2 * 3600 * 1000) {
      dueList.push(item);
    }
  }

  return dueList;
}

export function markReminderNotified(eventId: string): void {
  const list = getSavedReminders();
  const updated = list.map((r) => (r.eventId === eventId ? { ...r, notified: true } : r));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
