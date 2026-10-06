import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { BaseController } from '../../../core/base.controller';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../../utils/errors';
import { query } from '../../../config/database';
import { Ministries } from '../interfaces/ministries.interface';
import { MinistriesService } from '../services/ministries.service';

const service = new MinistriesService();

export const ministriesController = new BaseController<Ministries>(service, 'Ministries');

export const ministryDetailsController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const details = await service.getDetails(req.params.id);
    return sendSuccess(res, details, 'Ministry details retrieved');
  }),

  // Get members belonging to this ministry
  getMembers: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const members = await query<any[]>(
      `SELECT mm.*, u.full_name, u.email, u.phone_number, u.admission_number, u.course, u.year_of_study
       FROM ministry_members mm
       JOIN users u ON u.id = mm.user_id
       WHERE mm.ministry_id = :id
       ORDER BY mm.join_date DESC`,
      { id }
    );
    return sendSuccess(res, members, 'Ministry members retrieved');
  }),

  // Get practice / meeting sessions for this ministry
  getSessions: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessions = await query<any[]>(
      `SELECT * FROM attendance_sessions
       WHERE (venue LIKE :minTag OR theme LIKE :minTag OR title LIKE :minTag OR session_type LIKE '%ministry%')
       ORDER BY session_date DESC, start_time DESC`,
      { minTag: `%${id}%` }
    );
    return sendSuccess(res, sessions, 'Ministry practice/meeting sessions');
  }),

  // Ministry Leader / Super Admin: Schedule Practice or Meeting & Generate QR Code
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, session_date, start_time, end_time, venue, theme, session_type = 'ministry_practice' } = req.body;

    if (!title || !session_date || !start_time || !venue) {
      throw new BadRequestError('Title, session date, start time, and venue are required');
    }

    const sessionId = `sess-${uuidv4().substring(0, 8)}`;
    const datePart = session_date.replace(/-/g, '').substring(0, 8);
    const randPart = Math.floor(100 + Math.random() * 900);
    const code = `MIN-${datePart}-${randPart}`;

    const newSession = {
      id: sessionId,
      code,
      title: `${title}`,
      session_type,
      session_date,
      start_time,
      end_time: end_time || null,
      venue: `${venue} (${id})`,
      theme: theme || `Ministry Practice & Fellowship - ${id}`,
      preacher: req.user?.username || 'Ministry Leader',
      is_active: 1,
      created_by: req.user?.sub || 'leader',
      created_at: new Date().toISOString(),
    };

    await query(
      `INSERT INTO attendance_sessions (id, code, title, session_type, session_date, start_time, end_time, venue, theme, preacher, is_active, created_by, created_at)
       VALUES (:id, :code, :title, :session_type, :session_date, :start_time, :end_time, :venue, :theme, :preacher, :is_active, :created_by, :created_at)`,
      newSession as any
    );

    return sendSuccess(res, newSession, 'Practice session and QR attendance code generated successfully', 201);
  }),

  // Super Admin: Assign or change Ministry Leader
  assignLeader: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { leader_id } = req.body;

    if (!leader_id) {
      throw new BadRequestError('Leader user ID is required');
    }

    const users = await query<any[]>('SELECT * FROM users WHERE id = :leader_id LIMIT 1', { leader_id });
    if (!users || users.length === 0) {
      throw new NotFoundError('User not found');
    }

    const eligibility = await query<any[]>(
      `SELECT m.status, u.year_of_study, mt.code AS membership_type
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         JOIN membership_types mt ON mt.id = m.membership_type_id
        WHERE m.user_id = :leader_id
          AND m.status = 'active'
        ORDER BY m.registration_date DESC
        LIMIT 1`,
      { leader_id }
    );
    const yearMatch = String(eligibility[0]?.year_of_study ?? '').match(/\d+/);
    const studyYear = yearMatch ? Number(yearMatch[0]) : 0;
    if (!eligibility.length || eligibility[0].membership_type !== 'full' || studyYear < 2) {
      throw new BadRequestError('Only active Full Members who are at least in Year 2 may be appointed as ministry leaders.');
    }

    const previous = await query<any[]>(
      'SELECT leader_id FROM ministries WHERE id = :id LIMIT 1',
      { id }
    );
    const previousLeaderId = previous[0]?.leader_id;

    await query('UPDATE ministries SET leader_id = :leader_id, updated_at = NOW() WHERE id = :id', { id, leader_id });

    const roleRows = await query<any[]>(`SELECT id FROM roles WHERE code = 'ministry_leader' LIMIT 1`);
    if (!roleRows.length) throw new BadRequestError('ministry_leader role is not configured');

    // End the previous scoped role before granting the new leader's scope.
    if (previousLeaderId && previousLeaderId !== leader_id) {
      await query(
        `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
           WHERE user_id = :previousLeaderId AND role_id = :roleId
             AND scope_type = 'ministry' AND scope_id = :id AND is_current = TRUE`,
        { previousLeaderId, roleId: roleRows[0].id, id }
      );
    }

    await query(
      `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
         WHERE user_id = :leader_id AND role_id = :roleId
           AND scope_type = 'ministry' AND scope_id = :id AND is_current = TRUE`,
      { leader_id, roleId: roleRows[0].id, id }
    );

    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current)
       VALUES (:urId, :leader_id, :roleId, 'ministry', :id, CURDATE(), TRUE)`,
      { urId: uuidv4(), leader_id, roleId: roleRows[0].id, id }
    );

    return sendSuccess(res, { ministry_id: id, leader_id }, 'Ministry leader assigned successfully');
  }),

  // Leader Portal helper: Returns ministry of current leader
  getLeaderPortal: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const isSuperAdmin = req.permissions?.has('*');

    let ministries: any[] = [];
    if (isSuperAdmin) {
      ministries = await query<any[]>('SELECT * FROM ministries ORDER BY name ASC');
    } else {
      // Find ministries where user is leader or has ministry scope
      ministries = await query<any[]>(
        `SELECT DISTINCT m.* FROM ministries m
         LEFT JOIN user_roles ur ON ur.scope_type = 'ministry' AND ur.scope_id = m.id AND ur.user_id = :userId
         WHERE m.leader_id = :userId OR ur.user_id = :userId`,
        { userId }
      );
    }

    return sendSuccess(res, ministries, 'Leader ministries retrieved');
  }),

  // Super Admin / Ministry Leader: Update Ministry Background Image (Authoritative MySQL Storage)
  updateBackground: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { background_image_url } = req.body;
    if (!background_image_url) {
      throw new BadRequestError('background_image_url is required');
    }

    await query(
      'UPDATE ministries SET background_image_url = :background_image_url, landing_image_url = :background_image_url, updated_at = :now WHERE id = :id OR code = :id',
      { id, background_image_url, now: new Date().toISOString() }
    );

    const updated = await service.getDetails(id);
    return sendSuccess(res, updated, 'Ministry background image updated successfully in database');
  }),

  // Upload ministry photo (persists to /public/uploads & /app/public/uploads, updates MySQL)
  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { image, base64, filename, caption } = req.body || {};
    const rawData = image || base64;
    if (!rawData || typeof rawData !== 'string') {
      throw new BadRequestError('Image data (base64/dataUrl) is required');
    }

    const { landingMediaService } = await import('../../landing-media/landing-media.service');
    const { url } = landingMediaService.uploadImage(rawData, filename || `ministry-${id}.jpg`);

    await query(
      `UPDATE ministries 
       SET landing_image_url = :url,
           background_image_url = :url,
           landing_caption = COALESCE(:caption, landing_caption),
           updated_at = :now 
       WHERE id = :id OR code = :id`,
      { id, url, caption: caption || null, now: new Date().toISOString() }
    );

    const updated = await service.getDetails(id);
    return sendSuccess(res, { url, ministry: updated.ministry }, 'Ministry photo uploaded and persisted successfully', 201);
  }),
};
