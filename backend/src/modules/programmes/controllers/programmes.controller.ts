import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { NotFoundError, BadRequestError } from '../../../utils/errors';
import { calendarDownloadService } from '../services/calendar-download.service';

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
  interval_type?: string;
  alternate_a_title?: string;
  alternate_b_title?: string;
  anchor_monday?: string;
  anchor_programme?: string;
  is_configurable?: number;
  created_at?: string;
  updated_at?: string;
  active_this_week_title?: string;
  alternating_info?: Record<string, any>;
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

// Calculate Monday activity based on anchor: 2026-09-21 = E-Teams Fellowship
export function calculateMondaySchedule(targetDate: Date = new Date()) {
  const d = new Date(targetDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  // Get Monday of that week
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const currentMonday = new Date(d.getFullYear(), d.getMonth(), diffToMon);
  currentMonday.setHours(0, 0, 0, 0);

  // Anchor Monday: 2026-09-21 was E-Teams Fellowship
  const anchorMonday = new Date(2026, 8, 21); // Month is 0-indexed, so 8 is September
  anchorMonday.setHours(0, 0, 0, 0);

  const diffMs = currentMonday.getTime() - anchorMonday.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  const isETeams = Math.abs(diffWeeks) % 2 === 0;

  const currentTitle = isETeams ? 'E-Teams Fellowship' : 'Door to Door Evangelism';
  const nextTitle = isETeams ? 'Door to Door Evangelism' : 'E-Teams Fellowship';

  // Generate next 12 Mondays forecast
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

  return {
    thisMondayDate: currentMonday.toISOString().split('T')[0],
    isETeams,
    currentTitle,
    nextTitle,
    upcomingMondays,
  };
}

function programmeTypeTitle(type?: string): string {
  const labels: Record<string, string> = {
    sunday_service: 'Sunday Main Sanctuary Service',
    midweek_fellowship: 'Tuesday Fellowship',
    bible_study: 'Thursday Bible Study / BEST',
    prayer_meeting: 'Prayer Meeting',
    overnight_kesha: 'Monthly Kesha',
    evangelism: 'Door to Door Evangelism',
    ministry_practice: 'Friday Ministry Practices',
    worship_practice: 'Worship Practice',
    instrument_practice: 'Instrument Practice',
    discipleship_class: 'Discipleship Class',
  };
  return labels[type || ''] || 'TUMCU Weekly Programme';
}

function parseProgrammeDate(day: string, time: string): string {
  const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const now = new Date();
  const target = dayMap[day.toLowerCase()] ?? 0;
  const result = new Date(now);
  const delta = (target - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + delta);
  const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  let hour = match ? Number(match[1]) : 17;
  const minute = match ? Number(match[2] || 0) : 0;
  const meridiem = (match?.[3] || '').toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  result.setHours(hour, minute, 0, 0);
  return result.toISOString().slice(0, 19).replace('T', ' ');
}

class ProgrammesController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const rows = await query<any[]>('SELECT * FROM weekly_programmes ORDER BY scheduled_at ASC');
    const monSchedule = calculateMondaySchedule();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const mapped = rows.map((p) => {
      const scheduled = p.scheduled_at ? new Date(p.scheduled_at) : new Date();
      const day = dayNames[scheduled.getDay()];
      const time = scheduled.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true });
      const title = p.title || p.theme || programmeTypeTitle(p.programme_type);
      const item: WeeklyProgramme = {
        id: p.id,
        day,
        title,
        programme_type: p.programme_type,
        time,
        venue: p.venue || 'Main Sanctuary',
        leader: p.leader || '',
        description: p.description || '',
        alternating_enabled: p.alternating_enabled ? 1 : 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
      if (day.toLowerCase() === 'monday') {
        item.active_this_week_title = monSchedule.currentTitle;
        item.alternating_info = {
          current_week_activity: monSchedule.currentTitle,
          next_week_activity: monSchedule.nextTitle,
          this_monday_date: monSchedule.thisMondayDate,
          rule: 'Alternating every Monday between E-Teams Fellowship and Door to Door Evangelism',
          upcoming_mondays: monSchedule.upcomingMondays,
        };
      }
      return item;
    });

    return sendSuccess(res, mapped, 'Weekly programmes retrieved', 200, {
      total: mapped.length,
      monday_schedule: monSchedule,
    });
  });

  getMondayForecast = asyncHandler(async (_req: Request, res: Response) => {
    const schedule = calculateMondaySchedule();
    return sendSuccess(res, schedule, 'Monday alternating schedule forecast retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const rows = await query<any[]>('SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1', { id: req.params.id });
    if (!rows.length) throw new NotFoundError('Programme');
    const p = rows[0];
    const scheduled = p.scheduled_at ? new Date(p.scheduled_at) : new Date();
    const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][scheduled.getDay()];
    const item: WeeklyProgramme = {
      id: p.id,
      day,
      title: p.title || p.theme || programmeTypeTitle(p.programme_type),
      programme_type: p.programme_type,
      time: scheduled.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true }),
      venue: p.venue || 'Main Sanctuary',
      leader: p.leader || '',
      description: p.description || '',
      alternating_enabled: p.alternating_enabled ? 1 : 0,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
    if (day.toLowerCase() === 'monday') {
      const monSchedule = calculateMondaySchedule();
      item.active_this_week_title = monSchedule.currentTitle;
      item.alternating_info = monSchedule;
    }
    return sendSuccess(res, item, 'Programme retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const id = req.body.id || uuidv4();
    const day = String(req.body.day || 'Sunday');
    const title = req.body.title || 'Fellowship Program';
    const time = req.body.time || '5:00 PM';
    const venue = req.body.venue || 'Main Sanctuary';
    const scheduledAt = parseProgrammeDate(day, time);
    const newProg = {
      id,
      programme_type: req.body.programme_type || req.body.type || 'midweek_fellowship',
      theme: title,
      scripture_reference: req.body.scripture_reference || null,
      scheduled_at: scheduledAt,
      venue,
      created_by: req.user?.sub || null,
      title,
      leader: req.body.leader || '',
      description: req.body.description || '',
      alternating_enabled: req.body.alternating_enabled ? 1 : 0,
    };

    await query(
      `INSERT INTO weekly_programmes
       (id, programme_type, theme, scripture_reference, scheduled_at, venue, created_by)
       VALUES (:id, :programme_type, :theme, :scripture_reference, :scheduled_at, :venue, :created_by)`,
      newProg as Record<string, unknown>
    );

    return sendSuccess(res, { ...newProg, day, time }, 'Weekly programme created successfully', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const existing = await query<any[]>('SELECT * FROM weekly_programmes WHERE id = :id LIMIT 1', { id });
    if (!existing.length) throw new NotFoundError('Programme');
    const current = existing[0];
    const currentDate = current.scheduled_at ? new Date(current.scheduled_at) : new Date();
    const day = req.body.day || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
    const currentTime = currentDate.toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit', hour12: true });
    const time = req.body.time || currentTime;
    const title = req.body.title ?? current.theme ?? programmeTypeTitle(current.programme_type);
    const scheduledAt = parseProgrammeDate(day, time);

    await query(
      `UPDATE weekly_programmes
          SET programme_type = :programme_type,
              theme = :theme,
              scripture_reference = :scripture_reference,
              scheduled_at = :scheduled_at,
              venue = :venue
        WHERE id = :id`,
      {
        id,
        programme_type: req.body.programme_type ?? current.programme_type,
        theme: title,
        scripture_reference: req.body.scripture_reference ?? current.scripture_reference,
        scheduled_at: scheduledAt,
        venue: req.body.venue ?? current.venue,
      }
    );

    return sendSuccess(res, { id, day, title, time, venue: req.body.venue ?? current.venue }, 'Weekly programme updated successfully');
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    await query('DELETE FROM weekly_programmes WHERE id = :id', { id });
    return sendSuccess(res, null, 'Weekly programme removed successfully');
  });

  // Helper to generate system iCalendar content as fallback
  private generateSystemIcs = async (): Promise<string> => {
    const events = await query<any[]>('SELECT * FROM events');
    const programmes = await query<WeeklyProgramme[]>('SELECT * FROM weekly_programmes');

    function formatIcsDate(dateStr: string): string {
      const d = new Date(dateStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    function cleanString(str: string): string {
      return (str || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    }

    const now = formatIcsDate(new Date().toISOString());

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Technical University of Mombasa Christian Union//TUMCU Semester Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:TUMCU Semester & Weekly Programmes',
      'X-WR-TIMEZONE:Africa/Nairobi',
      'X-WR-CALDESC:Technical University of Mombasa Christian Union official semester schedule, Friday services, Sunday services, and weekly fellowships.',
    ];

    // Add semester events
    for (const evt of events) {
      const dtStart = evt.start_at ? formatIcsDate(evt.start_at) : now;
      const dtEnd = evt.end_at ? formatIcsDate(evt.end_at) : formatIcsDate(new Date(new Date(evt.start_at).getTime() + 2 * 3600000).toISOString());
      ics.push(
        'BEGIN:VEVENT',
        `UID:${evt.id || uuidv4()}@tumcu.ac.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${cleanString(evt.title)}`,
        `DESCRIPTION:${cleanString((evt.description || '') + (evt.preacher ? `\\nMinister: ${evt.preacher}` : ''))}`,
        `LOCATION:${cleanString(evt.venue || evt.location || 'Main Assembly Hall')}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: TUMCU Fellowship',
        'TRIGGER:-PT30M',
        'END:VALARM',
        'END:VEVENT'
      );
    }

    // Add recurring weekly programmes starting September 2026 to December 2026
    const dayToIcsMap: Record<string, string> = {
      monday: 'MO',
      tuesday: 'TU',
      wednesday: 'WE',
      thursday: 'TH',
      friday: 'FR',
      sunday: 'SU',
    };

    for (const prog of programmes) {
      const dayKey = prog.day?.toLowerCase();
      const byDay = dayToIcsMap[dayKey];
      if (!byDay) continue;

      if (dayKey === 'friday' || dayKey === 'sunday') continue;

      let startHour = 17;
      let startMinute = 0;
      let endHour = 19;
      let endMinute = 0;

      if (prog.time.includes('6:00 PM')) {
        startHour = 18;
        endHour = 20;
        endMinute = 30;
      } else if (prog.time.includes('8:00 AM')) {
        startHour = 8;
        endHour = 12;
        endMinute = 30;
      }

      const dayOffsetMap: Record<string, number> = {
        monday: 21,
        tuesday: 22,
        wednesday: 23,
        thursday: 24,
      };

      const startDay = dayOffsetMap[dayKey] || 21;
      const startDate = new Date(Date.UTC(2026, 8, startDay, startHour, startMinute, 0));
      const endDate = new Date(Date.UTC(2026, 8, startDay, endHour, endMinute, 0));

      const dtStart = formatIcsDate(startDate.toISOString());
      const dtEnd = formatIcsDate(endDate.toISOString());

      ics.push(
        'BEGIN:VEVENT',
        `UID:${prog.id || uuidv4()}@tumcu.ac.ke`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;UNTIL=20261220T235959Z;BYDAY=${byDay}`,
        `SUMMARY:${cleanString(prog.title)}`,
        `DESCRIPTION:${cleanString(prog.description || 'TUMCU Weekly Fellowship')}`,
        `LOCATION:${cleanString(prog.venue || 'TUM Campus')}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  };

  // Get current downloadable calendar metadata (custom uploaded vs system fallback)
  getCalendarInfo = asyncHandler(async (_req: Request, res: Response) => {
    const info = calendarDownloadService.getCalendarInfo();
    return sendSuccess(res, info, 'Downloadable calendar info retrieved');
  });

  // Admin upload custom downloadable calendar file (PDF, ICS, Excel, etc.)
  uploadCalendar = asyncHandler(async (req: Request, res: Response) => {
    const { fileData, filename, title, semester, academic_year, notes } = req.body;
    if (!fileData) {
      throw new BadRequestError('Calendar fileData is required (base64 string or data URL)');
    }
    if (!filename) {
      throw new BadRequestError('Calendar filename is required');
    }

    const user = (req as any).user;
    const uploaderName = user?.full_name || user?.name || user?.email || 'Executive Leadership';

    const result = calendarDownloadService.uploadCalendarFile({
      rawInput: fileData,
      originalFilename: filename,
      title,
      semester,
      academic_year,
      notes,
      uploaded_by_id: user?.id,
      uploaded_by_name: uploaderName,
    });

    return sendSuccess(res, result, 'Official downloadable calendar uploaded successfully', 201);
  });

  // Admin reset downloadable calendar to system-generated ICS
  resetCalendar = asyncHandler(async (_req: Request, res: Response) => {
    const result = calendarDownloadService.resetToDefault();
    return sendSuccess(res, result, 'Downloadable calendar reset to system default');
  });

  // Download official calendar (admin-uploaded file if present, else generated .ics)
  downloadCalendar = asyncHandler(async (req: Request, res: Response) => {
    const inline = req.query.inline === 'true';
    calendarDownloadService.serveCalendar(res, inline, this.generateSystemIcs);
  });

  // Backward compatibility alias for /calendar.ics and /download-ics
  downloadIcs = asyncHandler(async (req: Request, res: Response) => {
    const inline = req.query.inline === 'true';
    calendarDownloadService.serveCalendar(res, inline, this.generateSystemIcs);
  });
}

export const programmesController = new ProgrammesController();

