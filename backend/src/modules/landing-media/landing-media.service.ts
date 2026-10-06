import fs from 'fs';
import path from 'path';
import { LandingMediaConfig, HeroSlide, GalleryPhoto, LandingBackgroundConfig } from './landing-media.interface';
import { logger } from '../../utils/logger';
import { query } from '../../config/database';
import { env } from '../../config/env';

export const DEFAULT_LANDING_MEDIA: LandingMediaConfig = {
  heroCarousel: [
    { id: 'slide-1', src: '/community/community-1.jpg', caption: 'Prayer & Reflection', eyebrow: 'A people who seek God', active: true, order: 1 },
    { id: 'slide-2', src: '/community/community-2.jpg', caption: 'Worship in Unity', eyebrow: 'One family. One faith.', active: true, order: 2 },
    { id: 'slide-3', src: '/community/community-3.jpg', caption: 'Fellowship & Community', eyebrow: 'Growing together', active: true, order: 3 },
    { id: 'slide-4', src: '/community/community-4.jpg', caption: 'Worship through Music', eyebrow: 'Gifts offered to God', active: true, order: 4 },
    { id: 'slide-5', src: '/community/community-5.jpg', caption: 'A Community that Serves', eyebrow: 'Faith becoming action', active: true, order: 5 },
  ],
  rotateIntervalMs: 4000,
  backgroundImage: {
    src: '/tum-gate-monument.jpg',
    opacity: 0.8,
    blurPx: 1,
    title: 'TUM Main Entrance Gate Monument',
  },
  backdropSlides: [
    { id: 'backdrop-1', src: '/tum-gate-monument.jpg', title: 'TUM Main Entrance Monument & Heritage', active: true, order: 1 },
    { id: 'backdrop-2', src: '/community/community-1.jpg', title: 'Student Intercession & Prayer Gathering', active: true, order: 2 },
    { id: 'backdrop-3', src: '/community/community-2.jpg', title: 'Joyful Praise & Worship in Unity', active: true, order: 3 },
    { id: 'backdrop-4', src: '/community/community-3.jpg', title: 'Christian Fellowship & Discipleship', active: true, order: 4 },
    { id: 'backdrop-5', src: '/community/community-5.jpg', title: 'Campus Evangelism & Servant Leadership', active: true, order: 5 },
  ],
  galleryPhotos: [
    { id: 'gal-1', src: '/community/community-3.jpg', alt: 'TUMCU students sharing fellowship', caption: 'Fellowship & belonging', span: 'featured', order: 1 },
    { id: 'gal-2', src: '/community/community-2.jpg', alt: 'TUMCU worship team', order: 2 },
    { id: 'gal-3', src: '/community/community-5.jpg', alt: 'TUMCU students in fellowship', order: 3 },
    { id: 'gal-4', src: '/community/community-1.jpg', alt: 'TUMCU prayer moment', order: 4 },
    { id: 'gal-5', src: '/community/community-4.jpg', alt: 'TUMCU music ministry', order: 5 },
  ],
  lastUpdatedBy: 'System Default',
  lastUpdatedAt: new Date().toISOString(),
};

export class LandingMediaService {
  private dataFilePath: string;
  private currentConfig: LandingMediaConfig;
  private dbInitialized = false;
  private readonly readyPromise: Promise<void>;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, 'Failed to create data directory');
      }
    }
    this.dataFilePath = path.join(dataDir, 'landing-media.json');
    this.currentConfig = this.loadFromFileFallback();
    // Asynchronously synchronize with MySQL
    this.readyPromise = this.initFromDatabase().catch((err) => {
      logger.error({ err }, 'Could not initialize landing media from MySQL at startup');
      if (env.NODE_ENV === 'production') throw err;
    });
  }

  private loadFromFileFallback(): LandingMediaConfig {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.heroCarousel)) {
          return {
            ...DEFAULT_LANDING_MEDIA,
            ...parsed,
            heroCarousel: parsed.heroCarousel.length > 0 ? parsed.heroCarousel : DEFAULT_LANDING_MEDIA.heroCarousel,
            backdropSlides: Array.isArray(parsed.backdropSlides) && parsed.backdropSlides.length > 0 ? parsed.backdropSlides : DEFAULT_LANDING_MEDIA.backdropSlides,
            galleryPhotos: Array.isArray(parsed.galleryPhotos) && parsed.galleryPhotos.length > 0 ? parsed.galleryPhotos : DEFAULT_LANDING_MEDIA.galleryPhotos,
          };
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Error loading landing media config from file, using defaults');
    }
    return JSON.parse(JSON.stringify(DEFAULT_LANDING_MEDIA));
  }

  public async initFromDatabase(): Promise<void> {
    try {
      const configRows = await query<any[]>('SELECT * FROM landing_media_config WHERE id = :id LIMIT 1', { id: 'main' });
      const slidesRows = await query<any[]>('SELECT * FROM landing_media_slides ORDER BY display_order ASC', {});
      const galleryRows = await query<any[]>('SELECT * FROM landing_media_gallery ORDER BY display_order ASC', {});
      const backdropRows = await query<any[]>('SELECT * FROM landing_media_backdrops ORDER BY display_order ASC', {});

      if (configRows && configRows.length > 0) {
        const conf = configRows[0];
        const heroCarousel: HeroSlide[] = Array.isArray(slidesRows) && slidesRows.length > 0
          ? slidesRows.map((s) => ({
              id: s.id,
              src: s.src,
              caption: s.caption,
              eyebrow: s.eyebrow,
              active: Boolean(s.is_active),
              order: s.display_order,
            }))
          : this.currentConfig.heroCarousel;

        const backdropSlides = Array.isArray(backdropRows) && backdropRows.length > 0
          ? backdropRows.map((b) => ({
              id: b.id,
              src: b.src,
              title: b.title,
              active: Boolean(b.is_active),
              order: b.display_order,
            }))
          : this.currentConfig.backdropSlides;

        const galleryPhotos: GalleryPhoto[] = Array.isArray(galleryRows) && galleryRows.length > 0
          ? galleryRows.map((g) => ({
              id: g.id,
              src: g.src,
              alt: g.alt,
              caption: g.caption,
              span: (g.span as 'standard' | 'featured') || 'standard',
              order: g.display_order,
            }))
          : this.currentConfig.galleryPhotos;

        this.currentConfig = {
          heroCarousel,
          rotateIntervalMs: Number(conf.rotate_interval_ms) || 4000,
          backgroundImage: {
            src: conf.background_src || '/tum-gate-monument.jpg',
            opacity: Number(conf.background_opacity) || 0.8,
            blurPx: Number(conf.background_blur_px) || 1,
            title: conf.background_title || 'TUM Main Entrance Gate Monument',
          },
          backdropSlides,
          galleryPhotos,
          lastUpdatedBy: conf.last_updated_by || 'Administrator',
          lastUpdatedAt: conf.updated_at ? new Date(conf.updated_at).toISOString() : new Date().toISOString(),
        };
        this.dbInitialized = true;
        this.saveToFileFallback();
        return;
      }

      // If database is brand new and empty, seed it once with the initial config
      await this.persistToDatabase(this.currentConfig);
      this.dbInitialized = true;
    } catch (err) {
      logger.error({ err }, 'Failed to initialize landing media from MySQL');
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      logger.warn('Development mode: retaining the in-process landing media defaults until MySQL is available.');
    }
  }

  private async persistToDatabase(config: LandingMediaConfig): Promise<void> {
    try {
      await query(
        `INSERT INTO landing_media_config (
           id, rotate_interval_ms, background_src, background_opacity, background_blur_px, background_title, last_updated_by, updated_at
         ) VALUES (
           :id, :rotate_interval_ms, :background_src, :background_opacity, :background_blur_px, :background_title, :last_updated_by, :updated_at
         ) ON DUPLICATE KEY UPDATE
           rotate_interval_ms = VALUES(rotate_interval_ms),
           background_src = VALUES(background_src),
           background_opacity = VALUES(background_opacity),
           background_blur_px = VALUES(background_blur_px),
           background_title = VALUES(background_title),
           last_updated_by = VALUES(last_updated_by),
           updated_at = VALUES(updated_at)`,
        {
          id: 'main',
          rotate_interval_ms: config.rotateIntervalMs || 4000,
          background_src: config.backgroundImage?.src || '/tum-gate-monument.jpg',
          background_opacity: config.backgroundImage?.opacity ?? 0.8,
          background_blur_px: config.backgroundImage?.blurPx ?? 1,
          background_title: config.backgroundImage?.title || 'TUM Main Entrance Gate Monument',
          last_updated_by: config.lastUpdatedBy || 'Administrator',
          updated_at: new Date().toISOString(),
        }
      );

      // Persist slides
      await query('DELETE FROM landing_media_slides', {});
      for (const slide of config.heroCarousel) {
        await query(
          `INSERT INTO landing_media_slides (id, src, caption, eyebrow, is_active, display_order)
           VALUES (:id, :src, :caption, :eyebrow, :is_active, :display_order)`,
          {
            id: slide.id,
            src: slide.src,
            caption: slide.caption,
            eyebrow: slide.eyebrow,
            is_active: slide.active !== false ? 1 : 0,
            display_order: slide.order || 1,
          }
        );
      }

      // Persist backdrop slides in MySQL. Do not swallow this error: a successful
      // admin save must mean every landing-page image is durable.
      await query('DELETE FROM landing_media_backdrops', {});
      for (const backdrop of config.backdropSlides || []) {
        await query(
          `INSERT INTO landing_media_backdrops (id, src, title, is_active, display_order)
           VALUES (:id, :src, :title, :is_active, :display_order)`,
          {
            id: backdrop.id,
            src: backdrop.src,
            title: backdrop.title || 'TUMCU Heritage',
            is_active: backdrop.active !== false ? 1 : 0,
            display_order: backdrop.order || 1,
          }
        );
      }

      // Persist gallery photos
      await query('DELETE FROM landing_media_gallery', {});
      for (const photo of config.galleryPhotos) {
        await query(
          `INSERT INTO landing_media_gallery (id, src, alt, caption, span, display_order)
           VALUES (:id, :src, :alt, :caption, :span, :display_order)`,
          {
            id: photo.id,
            src: photo.src,
            alt: photo.alt || 'TUMCU Community',
            caption: photo.caption || null,
            span: photo.span || 'standard',
            display_order: photo.order || 1,
          }
        );
      }
    } catch (err) {
      logger.error({ err }, 'Failed writing landing media to MySQL');
      throw err;
    }
  }

  private saveToFileFallback(): void {
    try {
      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.currentConfig, null, 2), 'utf-8');
      logger.info('Landing media configuration saved successfully');
    } catch (err) {
      logger.error({ err }, 'Failed to save landing media configuration to disk');
    }
  }

  public async getMedia(): Promise<LandingMediaConfig> {
    await this.readyPromise;
    return this.currentConfig;
  }

  public async updateMedia(
    updates: Partial<LandingMediaConfig>,
    actorName?: string
  ): Promise<LandingMediaConfig> {
    await this.readyPromise;
    const previousConfig = JSON.parse(JSON.stringify(this.currentConfig)) as LandingMediaConfig;
    const now = new Date().toISOString();

    let heroCarousel = this.currentConfig.heroCarousel;
    if (Array.isArray(updates.heroCarousel)) {
      heroCarousel = updates.heroCarousel.map((slide, idx) => ({
        id: slide.id || `slide-${idx + 1}`,
        src: slide.src || '',
        caption: slide.caption || 'Community Moment',
        eyebrow: slide.eyebrow || 'TUMCU Ministry',
        active: slide.active !== false,
        order: typeof slide.order === 'number' ? slide.order : idx + 1,
      }));
    }

    let backdropSlides = this.currentConfig.backdropSlides || DEFAULT_LANDING_MEDIA.backdropSlides;
    if (Array.isArray(updates.backdropSlides)) {
      backdropSlides = updates.backdropSlides.map((slide, idx) => ({
        id: slide.id || `backdrop-${idx + 1}`,
        src: slide.src || '',
        title: slide.title || `Backdrop Photo ${idx + 1}`,
        active: slide.active !== false,
        order: typeof slide.order === 'number' ? slide.order : idx + 1,
      }));
    }

    let galleryPhotos = this.currentConfig.galleryPhotos;
    if (Array.isArray(updates.galleryPhotos)) {
      galleryPhotos = updates.galleryPhotos.map((photo, idx) => ({
        id: photo.id || `gal-${idx + 1}`,
        src: photo.src || '',
        alt: photo.alt || 'TUMCU Community',
        caption: photo.caption,
        span: photo.span || (idx === 0 ? 'featured' : 'standard'),
        order: typeof photo.order === 'number' ? photo.order : idx + 1,
      }));
    }

    const backgroundImage: LandingBackgroundConfig = {
      ...this.currentConfig.backgroundImage,
      ...(updates.backgroundImage || {}),
    };

    const rotateIntervalMs =
      typeof updates.rotateIntervalMs === 'number' && updates.rotateIntervalMs >= 1500
        ? updates.rotateIntervalMs
        : this.currentConfig.rotateIntervalMs || 4000;

    this.currentConfig = {
      heroCarousel,
      rotateIntervalMs,
      backgroundImage,
      backdropSlides,
      galleryPhotos,
      lastUpdatedBy: actorName || this.currentConfig.lastUpdatedBy || 'Administrator',
      lastUpdatedAt: now,
    };

    try {
      await this.persistToDatabase(this.currentConfig);
      this.saveToFileFallback();
      return this.currentConfig;
    } catch (err) {
      this.currentConfig = previousConfig;
      throw err;
    }
  }

  public uploadImage(
    rawInput: string,
    originalFilename: string = 'media-photo.jpg'
  ): { url: string; filename: string } {
    let base64String = rawInput;
    let extension = '.jpg';

    // Handle data URL formats e.g. data:image/png;base64,....
    const match = rawInput.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      const format = match[1].toLowerCase();
      extension = format === 'jpeg' || format === 'jpg' ? '.jpg' : `.${format}`;
      base64String = match[2];
    } else {
      const extMatch = originalFilename.match(/\.[a-zA-Z0-9]+$/);
      if (extMatch) {
        extension = extMatch[0].toLowerCase();
      }
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(extension)) {
      extension = '.jpg';
    }

    const sanitizedBase = path.basename(originalFilename, path.extname(originalFilename))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 32);

    const safeFilename = `tumcu-${Date.now()}-${sanitizedBase || 'image'}${extension}`;
    const buffer = Buffer.from(base64String, 'base64');

    if (buffer.length > 15 * 1024 * 1024) {
      throw new Error('Image file is too large. Maximum size is 15MB.');
    }

    // Determine target directories: local workspace public/uploads and Railway persistent /app/public/uploads
    const localUploadsDir = path.resolve(env.UPLOAD_DIR);
    const railwayUploadsDir = localUploadsDir;

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
      throw new Error('Image storage is unavailable. Configure a persistent UPLOAD_DIR volume.');
    }

    const publicUrl = `/uploads/${safeFilename}`;
    logger.info({ publicUrl }, 'Image successfully uploaded and persisted');
    return { url: publicUrl, filename: safeFilename };
  }

  public async resetToDefault(actorName?: string): Promise<LandingMediaConfig> {
    await this.readyPromise;
    const previousConfig = this.currentConfig;
    this.currentConfig = {
      ...JSON.parse(JSON.stringify(DEFAULT_LANDING_MEDIA)),
      lastUpdatedBy: actorName || 'Administrator',
      lastUpdatedAt: new Date().toISOString(),
    };
    try {
      await this.persistToDatabase(this.currentConfig);
      this.saveToFileFallback();
      return this.currentConfig;
    } catch (err) {
      this.currentConfig = previousConfig;
      throw err;
    }
  }
}

export const landingMediaService = new LandingMediaService();
