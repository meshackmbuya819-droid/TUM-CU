import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { NotFoundError, BadRequestError } from '../../../utils/errors';
import { calendarDownloadService } from '../services/calendar-download.service';

/**
 * API-facing weekly programme shape. The database stores a programme as
 * programme_type + theme + scheduled_at + venue; the UI historically used
 * day/title/time. These helpers keep that UI contract without querying
 * nonexistent columns.
 */
export interface WeeklyProgramme {
  id: string;
  day: string;
  title: string;
  programme_type: string;
  time: string;
  venue: string;
  leader?: string;
  description?: string;
  alternating_enabled?: number;
  interval_type?: string;
  alternate_a_title?: string;
  alternate_b_title?: string;
  anchor_monday?: string;
  anchor_programme?: string;
  is_configurable?: number;
  scheduled_at?: string;
  created_at?: string;
  updated_at?: string;
  active_this_week_title?: string;
  alternating_info?: Record<string, unknown>;
}

interface ProgrammeRow {
  id: string;
  programme_type: string;
  theme: string | null;
  scripture_reference: string | null;
  scheduled_at: string;
  venue: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const TYPE_TITLES: Record<string, string> = {
  sunday_service: 'Sunday Main Sanctuary Service',
  midweek_fellowship: 'Tuesday Fellowship',
  bible_study: 'Bible Study / BEST',
  prayer_meeting: 'Prayer Meeting',
  overnight_kesha: 'Monthly Kesha',
  evangelism: 'E-Teams Fellowship / Door-to-Door Evangelism',
  leadership_meeting: 'Leadership Meeting',
  committee_meeting: 'Committee Meeting',
  ministry_practice: 'Ministry Practices',
  worship_practice: 'Worship Practice',
  instrument_practice: 'Instrument Practice',
  discipleship_class: 'Discipleship Class',
};

const TYPE_MAP: Record<string, string> = {
  fellowship: 'midweek_fellowship',
  midweek_fellowship: 'midweek_fellowship',
  sunday: 'sunday_service',
  sunday_service: 'sunday_service',
  bible_study: 'bible_study',
  prayer: 'prayer_meeting',
  prayer_meeting: 'prayer_meeting',
  kesha: 'overnight_kesha',
  overnight_kesha: 'overnight_kesha',
  evangelism: 'evangelism',
  ministry_practice: 'ministry_practice',
  worship_practice: 'worship_practice',
  instrument_practice: 'instrument_practice',
  leadership_meeting: 'leadership_meeting',
  committee_meeting: 'committee_meeting',
  discipleship_class: 'discipleship_class',
};

function parseMysqlDate(value: string | Date): { day: string; time: string } {
  const raw = String(value).replace('T', ' ');
  const datePart = raw.slice(0, 10);
  const timePart = raw.slice(11, 16) || '00:00';
  const [year, month, day] = datePart.split('-').map(Number);
  const jsDate = new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1));
  const weekday = jsDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const [h, m] = timePart.split(':').map(Number);
  const suffix = (h || 0) >= 12 ? 'PM' : 'AM';
  const hour12 = ((h || 0) % 12) || 12;
  return { day: weekday, time: `${hour12}:${String(m || 0).padStart(2, '0')} ${suffix}` };
}

function toProgrammeView(row: ProgrammeRow): WeeklyProgramme {
  const { day, time } = parseMysqlDate(row.scheduled_at);
  return {
    id: row.id,
    day,
    title: row.theme || TYPE_TITLES[row.programme_type] || 'TUMCU Programme',
    programme_type: row.programme_type,
    time,
    venue: row.venue || 'TUMCU Campus',
    description: row.scripture_reference ? `Scripture: ${row.scripture_reference}` : undefined,
    scheduled_at: row.scheduled_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function nextOccurrence(dayName: string, time: string): string {
  const weekday = DAY_ORDER[dayName.toLowerCase()];
  if (!weekday) throw new BadRequestError('Invalid programme day');
  const match = String(time).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) throw new BadRequestError('Invalid programme time');
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const suffix = (match[3] || '').toUpperCase();
  if (suffix === 'PM' && hour < 12) hour += 12;
  if (suffix === 'AM' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) throw new BadRequestError('Invalid programme time');

  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  const current = result.getDay() === 0 ? 7 : result.getDay();
  let delta = (weekday - current + 7) % 7;
  if (delta === 0 && result <= now) delta = 7;
  result.setDate(result.getDate() + delta);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${result.getFullYear()}-${pad(result.getMonth() + 1)}-${pad(result.getDate())} ${pad(hour)}:${pad(minute)}:00`;
}

// 2026-09-21 is the alternating E-Teams anchor Monday.
export function calculateMondaySchedule(targetDate: Date = new Date()) {
  const d = new Date(targetDate);
  const day = d.getDay();
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
  currentMonday.setHours(0, 0, 0, 0);
  const anchorMonday = new Date(2026, 8, 21);
  anchorMonday.setHours(0, 0, 0, 0);
  const diffMs = currentMonday.getTime() - anchorMonday.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  const isETeams = Math.abs(diffWeeks) % 2 === 0;
  const currentTitle = isETeams ? 'E-Teams Fellowship' : 'Door to Door Evangelism';
  const nextTitle = isETeams ? 'Door to Door Evangelism' : 'E-Teams Fellowship';
  const upcomingMondays = [];
  for (let i = 0; i < 12; i++) {
    const nextMon = new Date(currentMonday);
    nextMon.setDate(currentMonday.getDate() + i * 7);
    const wDiff = Math.round((nextMon.getTime() - anchorMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const isET = Math.abs(wDiff) % 2 === 0;
    upcomingMondays.push({
      date: nextMon.toISOString().split('T')[0],
      title: isET ? 'E-Teams Fellowship' : 'Door to Door Evangelism',
      type: isET ? 'eteams' : 'evangelism',
      description: isET
        ? 'Regional fellowship at designated team centers (NORET, SORET) focusing on prayer, mission planning, and discipleship.'
        : 'Grassroots door-to-door campus and hostel gospel outreach, personal evangelism, and tract distribution.',
    });
  }
  return { thisMondayDate: currentMonday.toISOString().split('T')[0], isETeams, currentTitle, nextTitle, upcomingMondays };
}

class ProgrammesController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const rows = await query<ProgrammeRow[]>(
      `SELECT id, programme_type, theme, scripture_reference, scheduled_at, venue, created_by, created_at, updated_at
         FROM weekly_programmes
        ORDER BY scheduled_at ASC`
    );
    const monSchedule = calculateMondaySchedule();
    const enriched = rows.map(toProgrammeView).map((p) =>
      p.day.toLowerCase() === 'monday'
        ? {
            ...p,
            title: monSchedule.currentTitle,
            active_this_week_title: monSchedule.currentTitle,
            alternating_info: {
              current_week_activity: monSchedule.currentTitle,
              next_week_activity: monSchedule.nextTitle,
              this_monday_date: monSchedule.thisMondayDate,
              rule: 'Alternating every Monday between E-Teams Fellowship and Door to Door Evangelism',
              upcoming_mondays: monSchedule.upcomingMondays,
            },
          }
        : p
    );
    enriched.sort((a, b) => (DAY_ORDER[a.day.toLowerCase()] ?? 99) - (DAY_ORDER[b.day.toLowerCase()] ?? 99));
    return sendSuccess(res, enriched, 'Weekly programmes retrieved', 200, {
      total: enriched.length,
      monday_schedule: monSchedule,
    });
  });

  getMondayForecast = asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, calculateMondaySchedule(), 'Monday alternating schedule forecast retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const rows = await query<ProgrammeRow[]>(
      `SELECT id, programme_type, theme, scripture_reference, scheduled_at, venue, created_by, created_at, updated_at
         FROM weekly_programmes WHERE id = :id LIMIT 1`,
      { id: req.params.id }
    );
    if (!rows.length) throw new NotFoundError('Programme');
    const programme = toProgrammeView(rows[0]);
    const monSchedule = calculateMondaySchedule();
    if (programme.day.toLowerCase() === 'monday') {
      programme.title = monSchedule.currentTitle;
      programme.active_this_week_title = monSchedule.currentTitle;
      programme.alternating_info = monSchedule;
    }
    return sendSuccess(res, programme, 'Programme retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const day = String(req.body.day || 'Sunday');
    const time = String(req.body.time || '8:00 AM');
    const programmeType = TYPE_MAP[String(req.body.programme_type || req.body.type || 'sunday_service').toLowerCase()] || 'sunday_service';
    const title = String(req.body.title || TYPE_TITLES[programmeType] || 'TUMCU Programme').trim();
    const id = req.body.id || uuidv4();
    const scheduledAt = nextOccurrence(day, time);
    await query(
      `INSERT INTO weekly_programmes
        (id, programme_type, theme, scripture_reference, scheduled_at, venue, created_by)
       VALUES (:id, :programmeType, :theme, :scriptureReference, :scheduledAt, :venue, :createdBy)`,
      {
        id,
        programmeType,
        theme: title,
        scriptureReference: req.body.scripture_reference || null,
        scheduledAt,
        venue: req.body.venue || 'TUMCU Campus',
        createdBy: req.user!.sub,
      }
    );
    const rows = await query<ProgrammeRow[]>(`SELECT * FROM weekly_programmes WHERE id = :id`, { id });
    return sendSuccess(res, toProgrammeView(rows[0]), 'Weekly programme created successfully', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const rows = await query<ProgrammeRow[]>(`SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1`, { id: req.params.id });
    if (!rows.length) throw new NotFoundError('Programme');
    const existing = toProgrammeView(rows[0]);
    const day = req.body.day ?? existing.day;
    const time = req.body.time ?? existing.time;
    const scheduledAt = nextOccurrence(day, time);
    const programmeType = TYPE_MAP[String(req.body.programme_type ?? existing.programme_type).toLowerCase()] || existing.programme_type;
    await query(
      `UPDATE weekly_programmes
          SET programme_type = :programmeType,
              theme = :theme,
              scripture_reference = :scriptureReference,
              scheduled_at = :scheduledAt,
              venue = :venue
        WHERE id = :id`,
      {
        id: req.params.id,
        programmeType,
        theme: req.body.title ?? existing.title,
        scriptureReference: req.body.scripture_reference ?? null,
        scheduledAt,
        venue: req.body.venue ?? existing.venue,
      }
    );
    const updatedRows = await query<ProgrammeRow[]>(`SELECT * FROM weekly_programmes WHERE id = :id`, { id: req.params.id });
    return sendSuccess(res, toProgrammeView(updatedRows[0]), 'Weekly programme updated successfully');
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await query('DELETE FROM weekly_programmes WHERE id = :id', { id: req.params.id });
    return sendSuccess(res, null, 'Weekly programme removed successfully');
  });

  private generateSystemIcs = async (): Promise<string> => {
    const events = await query<any[]>('SELECT * FROM events');
    const programmeRows = await query<ProgrammeRow[]>('SELECT * FROM weekly_programmes ORDER BY scheduled_at ASC');
    const programmes = programmeRows.map(toProgrammeView);

    const formatIcsDate = (dateStr: string): string => new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const cleanString = (str: string) => (str || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const now = formatIcsDate(new Date().toISOString());
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//Technical University of Mombasa Christian Union//TUMCU Semester Calendar//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:TUMCU Semester & Weekly Programmes',
      'X-WR-TIMEZONE:Africa/Nairobi',
    ];

    for (const evt of events) {
      const dtStart = evt.start_at ? formatIcsDate(evt.start_at) : now;
      const dtEnd = evt.end_at ? formatIcsDate(evt.end_at) : formatIcsDate(new Date(new Date(evt.start_at).getTime() + 2 * 3600000).toISOString());
      ics.push(
        'BEGIN:VEVENT', `UID:${evt.id || uuidv4()}@tumcu.ac.ke`, `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`, `DTEND:${dtEnd}`, `SUMMARY:${cleanString(evt.title)}`,
        `DESCRIPTION:${cleanString(evt.description || '')}`, `LOCATION:${cleanString(evt.location || 'Main Sanctuary')}`,
        'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT'
      );
    }

    for (const prog of programmes) {
      const day = prog.day.toLowerCase();
      const byDay: Record<string, string> = { monday: 'MO', tuesday: 'TU', wednesday: 'WE', thursday: 'TH', friday: 'FR', sunday: 'SU' };
      if (!byDay[day]) continue;
      const start = formatIcsDate(prog.scheduled_at || new Date().toISOString());
      const endDate = new Date(new Date(prog.scheduled_at || Date.now()).getTime() + 2 * 3600000);
      const end = formatIcsDate(endDate.toISOString());
      ics.push(
        'BEGIN:VEVENT', `UID:${prog.id || uuidv4()}@tumcu.ac.ke`, `DTSTAMP:${now}`,
        `DTSTART:${start}`, `DTEND:${end}`, `RRULE:FREQ=WEEKLY;BYDAY=${byDay[day]}`,
        `SUMMARY:${cleanString(prog.title)}`, `DESCRIPTION:${cleanString(prog.description || 'TUMCU Weekly Programme')}`,
        `LOCATION:${cleanString(prog.venue)}`, 'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT'
      );
    }
    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  };

  getCalendarInfo = asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, calendarDownloadService.getCalendarInfo(), 'Downloadable calendar info retrieved');
  });

  uploadCalendar = asyncHandler(async (req: Request, res: Response) => {
    const { fileData, filename, title, semester, academic_year, notes } = req.body;
    if (!fileData) throw new BadRequestError('Calendar fileData is required (base64 string or data URL)');
    if (!filename) throw new BadRequestError('Calendar filename is required');
    const user = (req as any).user;
    const result = calendarDownloadService.uploadCalendarFile({
      rawInput: fileData,
      originalFilename: filename,
      title,
      semester,
      academic_year,
      notes,
      uploaded_by_id: user?.id,
      uploaded_by_name: user?.full_name || user?.name || user?.email || 'Executive Leadership',
    });
    return sendSuccess(res, result, 'Official downloadable calendar uploaded successfully', 201);
  });

  resetCalendar = asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, calendarDownloadService.resetToDefault(), 'Downloadable calendar reset to system default');
  });

  downloadCalendar = asyncHandler(async (req: Request, res: Response) => {
    calendarDownloadService.serveCalendar(res, req.query.inline === 'true', this.generateSystemIcs);
  });

  downloadIcs = asyncHandler(async (req: Request, res: Response) => {
    calendarDownloadService.serveCalendar(res, req.query.inline === 'true', this.generateSystemIcs);
  });
}

export const programmesController = new ProgrammesController();
