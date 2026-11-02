import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import { query } from '../../../config/database';
import { BadRequestError, BusinessRuleError, NotFoundError } from '../../../utils/errors';
import { EventsService } from '../../events/services/events.service';

type ExtractedEvent = {
  title: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  speaker?: string | null;
  description?: string | null;
  confidence?: number;
};
type ImportRow = {
  id: string;
  source_filename: string;
  extracted_events: ExtractedEvent[] | string;
  review_status: 'pending' | 'approved' | 'rejected';
  uploaded_by: string;
  reviewed_by: string | null;
  linked_event_ids: string[] | string | null;
  review_note: string | null;
  created_at: string;
};
const eventsService = new EventsService();
const validDate = (v: unknown) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const parsed = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
};
const validTime = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
function parseJson<T>(value: T | string): T {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value) as T; } catch { return [] as unknown as T; }
}

export class CalendarImportService {
  async extractAndSave(input: { imageData: string; mimeType: string; filename: string; userId: string }) {
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(input.imageData);
    if (!match) throw new BadRequestError('Choose a valid JPG, PNG, WEBP or GIF image.');
    const mimeType = match[1];
    const base64 = match[2].replace(/\s/g, '');
    if (Buffer.byteLength(base64, 'base64') > 8 * 1024 * 1024) throw new BadRequestError('Calendar image must be 8 MB or smaller.');
    if (input.mimeType !== mimeType) throw new BadRequestError('Image file type did not match its data.');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new BusinessRuleError('Calendar image extraction is not configured. Set GEMINI_API_KEY in Railway variables.');

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Read this TUMCU / TECUMP calendar poster. Extract each distinct dated event.
Return ONLY JSON: {"events":[{"title":"...","date":"YYYY-MM-DD","start_time":"HH:mm or null","end_time":"HH:mm or null","venue":"... or null","speaker":"... or null","description":"... or null","confidence":0.0}]}.
Use ISO dates and 24-hour times. Do not invent details. If the year is absent, infer ${new Date().getFullYear()} only when the poster clearly refers to that year; otherwise omit ambiguous events. Include only events with a recognizable title and date. confidence is 0..1.`;
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
    let lastProviderError: unknown;
    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ] }],
          config: { responseMimeType: 'application/json', temperature: 0.1 },
        });
        if (response?.text) break;
      } catch (error) {
        lastProviderError = error;
      }
    }
    if (!response?.text) {
      const providerMessage = lastProviderError instanceof Error ? lastProviderError.message : '';
      if (/quota|rate.?limit|resource.?exhausted/i.test(providerMessage)) {
        throw new BusinessRuleError('Calendar image extraction is temporarily unavailable because the Gemini API quota/rate limit was reached. Check the Google AI project quota and try again later.');
      }
      if (/api key|permission|unauthorized|forbidden|not found|model/i.test(providerMessage)) {
        throw new BusinessRuleError('Gemini could not access an enabled image-capable model. Verify GEMINI_API_KEY, project API access, and model availability in Railway.');
      }
      throw new BusinessRuleError('Calendar image extraction is temporarily unavailable. Check the Gemini API configuration and try again.');
    }
    const raw = response.text || '';
    let parsed: { events?: ExtractedEvent[] };
    try { parsed = JSON.parse(raw); } catch { throw new BusinessRuleError('The calendar image could not be read reliably. Try a clearer, straight-on image.'); }
    if (!Array.isArray(parsed.events) || parsed.events.length === 0) throw new BusinessRuleError('No dated events could be extracted. Try a clearer image with readable dates.');
    const extracted = parsed.events.slice(0, 100).filter((e) => e && typeof e.title === 'string' && e.title.trim() && validDate(e.date)).map((e) => ({
      title: e.title.trim().slice(0, 255), date: e.date,
      start_time: validTime(e.start_time) ? e.start_time : null,
      end_time: validTime(e.end_time) ? e.end_time : null,
      venue: typeof e.venue === 'string' ? e.venue.trim().slice(0, 255) : null,
      speaker: typeof e.speaker === 'string' ? e.speaker.trim().slice(0, 255) : null,
      description: typeof e.description === 'string' ? e.description.trim().slice(0, 2000) : null,
      confidence: typeof e.confidence === 'number' ? Math.max(0, Math.min(1, e.confidence)) : 0.5,
    }));
    const uniqueExtracted = extracted.filter((event, index, all) =>
      all.findIndex((candidate) => candidate.title.toLowerCase() === event.title.toLowerCase() && candidate.date === event.date && candidate.start_time === event.start_time) === index
    );
    if (!uniqueExtracted.length) throw new BusinessRuleError('No events with valid dates were found. Check the image and try again.');
    const id = uuidv4();
    await query(`INSERT INTO calendar_event_imports (id, source_filename, extracted_events, review_status, uploaded_by)
      VALUES (:id, :filename, :events, 'pending', :userId)`, {
      id, filename: (input.filename || 'calendar-image').slice(0, 255), events: JSON.stringify(uniqueExtracted), userId: input.userId,
    });
    return { id, source_filename: (input.filename || 'calendar-image').slice(0, 255), extracted_events: uniqueExtracted, review_status: 'pending', created_at: new Date().toISOString() };
  }

  async listPending() {
    const rows = await query<ImportRow[]>(`SELECT id, source_filename, extracted_events, review_status, uploaded_by, reviewed_by, linked_event_ids, review_note, created_at
      FROM calendar_event_imports WHERE review_status = 'pending' ORDER BY created_at DESC LIMIT 100`);
    return rows.map((row) => ({ ...row, extracted_events: parseJson(row.extracted_events) }));
  }

  async approve(id: string, reviewerId: string) {
    const rows = await query<ImportRow[]>('SELECT * FROM calendar_event_imports WHERE id = :id LIMIT 1', { id });
    const row = rows[0];
    if (!row) throw new NotFoundError('Calendar import');
    if (row.review_status !== 'pending') throw new BusinessRuleError('This calendar import has already been reviewed.');
    const extracted = parseJson<ExtractedEvent[]>(row.extracted_events);
    const linkedIds: string[] = [];
    for (const item of extracted) {
      // Re-upload sync: match by normalized title and exact start timestamp; update only the matching event.
      const startAt = `${item.date}T${item.start_time || '17:00'}:00+03:00`;
      const matches = await query<{ id: string }[]>(`SELECT id FROM events
        WHERE LOWER(TRIM(title)) = LOWER(TRIM(:title)) AND DATE(start_at) = :eventDate AND status <> 'archived' LIMIT 1`, { title: item.title, eventDate: item.date });
      if (matches[0]) {
        await eventsService.update(matches[0].id, { title: item.title, start_at: startAt, speaker: item.speaker || null, description: item.description || null, location: item.venue || null, end_at: item.end_time ? `${item.date}T${item.end_time}:00+03:00` : null } as never);
        linkedIds.push(matches[0].id);
      } else {
        const event = await eventsService.create({
          title: item.title, event_type: 'other', description: item.description || null, speaker: item.speaker || null,
          start_at: startAt, end_at: item.end_time ? `${item.date}T${item.end_time}:00+03:00` : null,
          location: item.venue || null, status: 'approved',
        } as never, reviewerId);
        linkedIds.push(event.id);
      }
    }
    await query(`UPDATE calendar_event_imports SET review_status = 'approved', reviewed_by = :reviewerId,
      linked_event_ids = :linkedIds, review_note = 'Approved by authorized official' WHERE id = :id AND review_status = 'pending'`,
      { id, reviewerId, linkedIds: JSON.stringify(linkedIds) });
    return { id, review_status: 'approved', event_ids: linkedIds, count: linkedIds.length };
  }

  async reject(id: string, reviewerId: string, note?: string) {
    const result = await query(`UPDATE calendar_event_imports SET review_status = 'rejected', reviewed_by = :reviewerId,
      review_note = :note WHERE id = :id AND review_status = 'pending'`, { id, reviewerId, note: (note || 'Rejected by authorized official').slice(0, 1000) });
    if ((result as any).affectedRows === 0) {
      const rows = await query<{ id: string }[]>('SELECT id FROM calendar_event_imports WHERE id = :id LIMIT 1', { id });
      if (!rows.length) throw new NotFoundError('Calendar import');
      throw new BusinessRuleError('This calendar import has already been reviewed.');
    }
    return { id, review_status: 'rejected' };
  }
}
