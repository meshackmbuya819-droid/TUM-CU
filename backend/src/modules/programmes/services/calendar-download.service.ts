import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { logger } from '../../../utils/logger';

export interface DownloadableCalendarConfig {
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

const DEFAULT_CALENDAR_CONFIG: DownloadableCalendarConfig = {
  is_custom: false,
  title: 'TUMCU Official Semester 1 Calendar',
  semester: 'Semester 1 (September – December 2026)',
  academic_year: '2026/2027',
  filename: 'tumcu-semester-program-2026.ics',
  public_url: '/api/programmes/download-calendar',
  file_size_bytes: 18450,
  formatted_size: '18 KB',
  mime_type: 'text/calendar',
  file_format: 'ICS',
  uploaded_at: null,
  uploaded_by_name: null,
  notes: 'System synchronized calendar with all semester services, fellowships, and recurring weekly meetings.',
};

export class CalendarDownloadService {
  private configFilePath: string;
  private currentConfig: DownloadableCalendarConfig;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, 'Failed to create data directory for downloadable calendar');
      }
    }
    this.configFilePath = path.join(dataDir, 'downloadable-calendar.json');
    this.currentConfig = this.loadConfig();
  }

  private loadConfig(): DownloadableCalendarConfig {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.is_custom === 'boolean') {
          return {
            ...DEFAULT_CALENDAR_CONFIG,
            ...parsed,
          };
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Error loading downloadable calendar config from disk, using default');
    }
    return { ...DEFAULT_CALENDAR_CONFIG };
  }

  private saveConfig(config: DownloadableCalendarConfig): void {
    try {
      const dataDir = path.dirname(this.configFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
      logger.warn({ err }, 'Failed to write downloadable calendar config to disk');
    }
  }

  public getCalendarInfo(): DownloadableCalendarConfig {
    this.currentConfig = this.loadConfig();
    // If it's custom, verify that the file actually exists on disk
    if (this.currentConfig.is_custom && this.currentConfig.saved_filename) {
      const localFilePath = path.resolve(process.cwd(), 'public', 'uploads', this.currentConfig.saved_filename);
      const railwayFilePath = path.join('/app/public/uploads', this.currentConfig.saved_filename);
      if (!fs.existsSync(localFilePath) && !fs.existsSync(railwayFilePath)) {
        // File was removed or lost, fall back
        return {
          ...DEFAULT_CALENDAR_CONFIG,
          notes: 'Previously uploaded calendar file could not be found; displaying default calendar.',
        };
      }
    }
    return { ...this.currentConfig };
  }

  public uploadCalendarFile(params: {
    rawInput: string; // base64 string or data: URL
    originalFilename: string;
    title?: string;
    semester?: string;
    academic_year?: string;
    notes?: string;
    uploaded_by_id?: string;
    uploaded_by_name?: string;
  }): DownloadableCalendarConfig {
    const {
      rawInput,
      originalFilename = 'tumcu-semester-calendar.pdf',
      title = 'TUMCU Official Semester Calendar',
      semester = 'Semester 1 (September – December 2026)',
      academic_year = '2026/2027',
      notes,
      uploaded_by_id,
      uploaded_by_name = 'Executive Leadership',
    } = params;

    let base64String = rawInput;
    let extension = '.pdf';
    let mimeType = 'application/pdf';

    // Parse Data URL if provided (e.g. data:application/pdf;base64,...)
    const dataUrlMatch = rawInput.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1].toLowerCase();
      base64String = dataUrlMatch[2];
    }

    const extMatch = originalFilename.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      extension = '.' + extMatch[1].toLowerCase();
    }

    // Determine MIME and format label
    const extToMimeMap: Record<string, { mime: string; format: string }> = {
      '.pdf': { mime: 'application/pdf', format: 'PDF' },
      '.ics': { mime: 'text/calendar', format: 'ICS' },
      '.xlsx': { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', format: 'Excel' },
      '.xls': { mime: 'application/vnd.ms-excel', format: 'Excel' },
      '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', format: 'Word' },
      '.doc': { mime: 'application/msword', format: 'Word' },
      '.png': { mime: 'image/png', format: 'PNG' },
      '.jpg': { mime: 'image/jpeg', format: 'JPEG' },
      '.jpeg': { mime: 'image/jpeg', format: 'JPEG' },
      '.csv': { mime: 'text/csv', format: 'CSV' },
    };

    const detected = extToMimeMap[extension] || { mime: mimeType || 'application/octet-stream', format: extension.replace('.', '').toUpperCase() };
    mimeType = detected.mime;
    const fileFormat = detected.format;

    const buffer = Buffer.from(base64String, 'base64');
    if (buffer.length === 0) {
      throw new Error('Uploaded calendar file is empty');
    }
    if (buffer.length > 25 * 1024 * 1024) {
      throw new Error('Calendar file is too large. Maximum size is 25MB.');
    }

    const sanitizedBase = path.basename(originalFilename, path.extname(originalFilename))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 35);

    const safeFilename = `tumcu-calendar-${Date.now()}-${sanitizedBase || 'official'}${extension}`;

    // Target storage directories
    const localUploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const railwayUploadsDir = '/app/public/uploads';
    const distUploadsDir = path.resolve(process.cwd(), 'dist', 'uploads');

    if (!fs.existsSync(localUploadsDir)) {
      try {
        fs.mkdirSync(localUploadsDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, 'Could not create local public/uploads directory');
      }
    }

    try {
      fs.writeFileSync(path.join(localUploadsDir, safeFilename), buffer);
    } catch (err) {
      logger.warn({ err }, 'Failed writing calendar to local public/uploads');
    }

    // Mirror to railway persistent folder if mounted
    if (fs.existsSync(railwayUploadsDir)) {
      try {
        fs.writeFileSync(path.join(railwayUploadsDir, safeFilename), buffer);
      } catch (rErr) {
        logger.warn({ rErr }, 'Railway /app/public/uploads write issue');
      }
    }

    // Mirror to dist/uploads if dist exists
    if (fs.existsSync(distUploadsDir)) {
      try {
        fs.writeFileSync(path.join(distUploadsDir, safeFilename), buffer);
      } catch (dErr) {
        logger.warn({ dErr }, 'Failed mirroring calendar to dist/uploads');
      }
    }

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const newConfig: DownloadableCalendarConfig = {
      is_custom: true,
      title: title.trim() || 'TUMCU Official Semester Calendar',
      semester: semester.trim() || 'Semester 1 (September – December 2026)',
      academic_year: academic_year.trim() || '2026/2027',
      filename: originalFilename.trim() || `TUMCU-Semester-Calendar${extension}`,
      saved_filename: safeFilename,
      public_url: '/api/programmes/download-calendar',
      file_size_bytes: buffer.length,
      formatted_size: formatBytes(buffer.length),
      mime_type: mimeType,
      file_format: fileFormat,
      uploaded_at: new Date().toISOString(),
      uploaded_by_id: uploaded_by_id || null,
      uploaded_by_name: uploaded_by_name || 'Administrator',
      notes: notes?.trim() || 'Official leadership-approved semester calendar document.',
    };

    this.currentConfig = newConfig;
    this.saveConfig(newConfig);
    logger.info({ safeFilename, title: newConfig.title }, 'Admin uploaded custom downloadable calendar');
    return this.currentConfig;
  }

  public resetToDefault(): DownloadableCalendarConfig {
    this.currentConfig = { ...DEFAULT_CALENDAR_CONFIG };
    this.saveConfig(this.currentConfig);
    logger.info('Reset downloadable calendar to default system generated iCalendar');
    return this.currentConfig;
  }

  public serveCalendar(
    res: Response,
    inline: boolean = false,
    generateSystemIcsFallback: () => Promise<string>
  ): void {
    const config = this.getCalendarInfo();

    if (config.is_custom && config.saved_filename) {
      const localFilePath = path.resolve(process.cwd(), 'public', 'uploads', config.saved_filename);
      const railwayFilePath = path.join('/app/public/uploads', config.saved_filename);

      let targetPath: string | null = null;
      if (fs.existsSync(localFilePath)) {
        targetPath = localFilePath;
      } else if (fs.existsSync(railwayFilePath)) {
        targetPath = railwayFilePath;
      }

      if (targetPath) {
        const disposition = inline ? 'inline' : 'attachment';
        res.setHeader('Content-Type', config.mime_type || 'application/octet-stream');
        res.setHeader(
          'Content-Disposition',
          `${disposition}; filename="${encodeURIComponent(config.filename)}"`
        );
        res.sendFile(targetPath);
        return;
      }
    }

    // Otherwise serve system generated ICS
    generateSystemIcsFallback().then((icsContent) => {
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="tumcu-semester-program-2026.ics"');
      res.status(200).send(icsContent);
    }).catch((err) => {
      logger.error({ err }, 'Error generating fallback calendar');
      res.status(500).send('Error generating calendar');
    });
  }
}

export const calendarDownloadService = new CalendarDownloadService();
