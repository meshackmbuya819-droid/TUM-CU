import { v4 as uuidv4 } from 'uuid';
import { query, pool } from '../../config/database';
import { BadRequestError, NotFoundError, AuthorizationError } from '../../utils/errors';

export interface ETeamRecord {
  id: string;
  code: string;
  name: string;
  short_name?: string;
  region: string;
  description: string;
  motto?: string;
  mission_purpose?: string;
  vision?: string;
  scripture_verse?: string;
  scripture_theme?: string;
  chairperson_id?: string | null;
  chairperson_name?: string | null;
  chairperson_phone?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  meeting_venue?: string | null;
  target_mission_area?: string | null;
  banner_image_url?: string | null;
  active_members_count?: number;
  is_active: number | boolean;
}

function publicTeam(row: any): ETeamRecord {
  return {
    ...row,
    code: row.code || row.short_name || String(row.name || '').toUpperCase().replace(/\s+/g, '_'),
    scripture_verse: row.scripture_verse || row.scripture_theme || null,
    banner_image_url: row.banner_image_url || row.cover_image_url || null,
    target_mission_area: row.target_mission_area || row.mission_purpose || null,
    meeting_day: row.meeting_day || null,
    meeting_time: row.meeting_time || null,
  };
}

export class ETeamsService {
  async getTeams(): Promise<ETeamRecord[]> {
    const rows = await query<any[]>(
      `SELECT et.*,
              u.full_name AS chairperson_name,
              u.phone_number AS chairperson_phone,
              COALESCE((SELECT COUNT(*) FROM evangelism_team_members etm
                        WHERE etm.team_id = et.id), 0) AS active_members_count
         FROM evangelism_teams et
         LEFT JOIN users u ON u.id = et.leader_id
        WHERE et.is_active = TRUE
        ORDER BY et.name ASC`
    );
    return (rows || []).map(publicTeam);
  }

  async getTeamById(idOrCode: string): Promise<any> {
    const rows = await query<any[]>(
      `SELECT et.*,
              u.full_name AS chairperson_name,
              u.phone_number AS chairperson_phone,
              COALESCE((SELECT COUNT(*) FROM evangelism_team_members etm
                        WHERE etm.team_id = et.id), 0) AS active_members_count
         FROM evangelism_teams et
         LEFT JOIN users u ON u.id = et.leader_id
        WHERE et.id = :idOrCode OR et.code = :idOrCode
        LIMIT 1`,
      { idOrCode }
    );
    if (!rows?.length) throw new NotFoundError('Evangelism Team');
    const team = publicTeam(rows[0]);

    const [programmes, announcements, gallery, reports] = await Promise.all([
      query<any[]>(
        `SELECT id, team_id AS eteam_id, title,
                scheduled_date AS date, time_slot AS time, venue,
                description AS focus, leader_name AS leader
           FROM eteam_programmes
          WHERE team_id = :teamId
          ORDER BY scheduled_date ASC, id DESC`,
        { teamId: team.id }
      ),
      query<any[]>(
        `SELECT id, team_id, title, content,
                published_at AS posted_at
           FROM eteam_announcements
          WHERE team_id = :teamId
            AND (expires_at IS NULL OR expires_at >= NOW())
          ORDER BY published_at DESC, id DESC`,
        { teamId: team.id }
      ),
      query<any[]>(
        `SELECT id, team_id AS eteam_id, title, image_url,
                google_photos_url, caption, event_date
           FROM eteam_gallery
          WHERE team_id = :teamId
          ORDER BY event_date DESC, id DESC`,
        { teamId: team.id }
      ),
      query<any[]>(
        `SELECT er.id, er.team_id, er.title,
                COALESCE(u.full_name, 'E-Team Leadership') AS author,
                er.activity_date AS report_date,
                er.summary,
                CONCAT_WS('\\n\\n', er.outcomes, er.follow_up_notes) AS content
           FROM eteam_reports er
           LEFT JOIN users u ON u.id = er.submitted_by
          WHERE er.team_id = :teamId
          ORDER BY er.activity_date DESC, er.id DESC`,
        { teamId: team.id }
      ),
    ]);

    return {
      ...team,
      programmes: programmes || [],
      announcements: announcements || [],
      gallery: gallery || [],
      reports: reports || [],
    };
  }

  private async verifyChairpersonScope(user: any, teamIdOrCode: string): Promise<ETeamRecord> {
    if (!user?.sub) throw new AuthorizationError('Authentication required');
    const team = await this.getTeamById(teamIdOrCode);

    const roles = await query<any[]>(
      `SELECT r.code, ur.scope_type, ur.scope_id
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = :userId
          AND ur.is_current = TRUE
          AND (
            (ur.scope_type = 'e_team' AND ur.scope_id = :teamId)
            OR r.code = 'super_admin'
          )
        LIMIT 10`,
      { userId: user.sub, teamId: team.id }
    );

    if (roles.some((r) => r.code === 'super_admin')) return team;
    if (team.chairperson_id === user.sub) return team;
    if (roles.some((r) => r.scope_type === 'e_team' && r.scope_id === team.id)) return team;

    throw new AuthorizationError(
      `You are not authorized to manage ${team.name}. Only its appointed leader may manage it.`
    );
  }

  async createTeam(data: any, userId: string) {
    const name = String(data.name || '').trim();
    const code = String(data.code || '').trim().toUpperCase();
    if (!name || !code) throw new BadRequestError('E-Team name and code are required');

    const existing = await query<any[]>(
      `SELECT id FROM evangelism_teams WHERE code = :code OR name = :name LIMIT 1`,
      { code, name }
    );
    if (existing.length) throw new BadRequestError('An E-Team with this name or code already exists');

    const id = uuidv4();
    await query(
      `INSERT INTO evangelism_teams
        (id, name, short_name, code, outreach_type, leader_id, region, description,
         mission_purpose, vision, scripture_theme, cover_image_url, banner_image_url,
         logo_url, meeting_schedule, meeting_venue, meeting_day, meeting_time,
         motto, target_mission_area, is_active, created_at, updated_by, updated_at)
       VALUES
        (:id, :name, :short_name, :code, :outreach_type, :leader_id, :region, :description,
         :mission_purpose, :vision, :scripture_theme, :cover_image_url, :banner_image_url,
         :logo_url, :meeting_schedule, :meeting_venue, :meeting_day, :meeting_time,
         :motto, :target_mission_area, TRUE, NOW(), :updated_by, NOW())`,
      {
        id, name, short_name: data.short_name || code,
        code, outreach_type: data.outreach_type || 'campus',
        leader_id: data.leader_id || null,
        region: data.region || null,
        description: data.description || null,
        mission_purpose: data.mission_purpose || null,
        vision: data.vision || null,
        scripture_theme: data.scripture_theme || null,
        cover_image_url: data.cover_image_url || null,
        banner_image_url: data.banner_image_url || data.cover_image_url || null,
        logo_url: data.logo_url || null,
        meeting_schedule: data.meeting_schedule || null,
        meeting_venue: data.meeting_venue || null,
        meeting_day: data.meeting_day || null,
        meeting_time: data.meeting_time || null,
        motto: data.motto || null,
        target_mission_area: data.target_mission_area || null,
        updated_by: userId,
      }
    );
    return this.getTeamById(id);
  }

  async updateTeam(teamId: string, data: any, userId: string) {
    const existing = await this.getTeamById(teamId);
    const name = String(data.name ?? existing.name).trim();
    const code = String(data.code ?? existing.code).trim().toUpperCase();
    if (!name || !code) throw new BadRequestError('E-Team name and code are required');

    await query(
      `UPDATE evangelism_teams
          SET name = :name,
              short_name = :short_name,
              code = :code,
              outreach_type = :outreach_type,
              leader_id = :leader_id,
              region = :region,
              description = :description,
              mission_purpose = :mission_purpose,
              vision = :vision,
              scripture_theme = :scripture_theme,
              cover_image_url = :cover_image_url,
              banner_image_url = :banner_image_url,
              logo_url = :logo_url,
              meeting_schedule = :meeting_schedule,
              meeting_venue = :meeting_venue,
              meeting_day = :meeting_day,
              meeting_time = :meeting_time,
              motto = :motto,
              target_mission_area = :target_mission_area,
              is_active = :is_active,
              updated_by = :updated_by,
              updated_at = NOW()
        WHERE id = :id`,
      {
        id: existing.id, name, code,
        short_name: data.short_name ?? existing.short_name ?? code,
        outreach_type: data.outreach_type ?? existing.outreach_type ?? 'campus',
        leader_id: data.leader_id ?? existing.chairperson_id ?? null,
        region: data.region ?? existing.region ?? null,
        description: data.description ?? existing.description ?? null,
        mission_purpose: data.mission_purpose ?? existing.mission_purpose ?? null,
        vision: data.vision ?? existing.vision ?? null,
        scripture_theme: data.scripture_theme ?? existing.scripture_theme ?? existing.scripture_verse ?? null,
        cover_image_url: data.cover_image_url ?? existing.cover_image_url ?? null,
        banner_image_url: data.banner_image_url ?? existing.banner_image_url ?? existing.cover_image_url ?? null,
        logo_url: data.logo_url ?? existing.logo_url ?? null,
        meeting_schedule: data.meeting_schedule ?? existing.meeting_schedule ?? null,
        meeting_venue: data.meeting_venue ?? existing.meeting_venue ?? null,
        meeting_day: data.meeting_day ?? existing.meeting_day ?? null,
        meeting_time: data.meeting_time ?? existing.meeting_time ?? null,
        motto: data.motto ?? existing.motto ?? null,
        target_mission_area: data.target_mission_area ?? existing.target_mission_area ?? null,
        is_active: data.is_active ?? existing.is_active ?? true,
        updated_by: userId,
      }
    );
    return this.getTeamById(existing.id);
  }

  async addProgramme(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    const id = uuidv4();
    await query(
      `INSERT INTO eteam_programmes
        (id, team_id, title, activity_type, scheduled_date, time_slot, venue,
         description, leader_name, status, created_by)
       VALUES (:id, :teamId, :title, :activity_type, :scheduled_date, :time_slot,
               :venue, :description, :leader_name, 'scheduled', :created_by)`,
      {
        id, teamId: team.id, title: data.title,
        activity_type: data.activity_type || 'fellowship',
        scheduled_date: data.date || new Date().toISOString().slice(0, 10),
        time_slot: data.time || '5:00 PM – 7:00 PM',
        venue: data.venue || team.meeting_venue || 'Hall 4',
        description: data.focus || data.description || 'Weekly Fellowship',
        leader_name: data.leader || team.chairperson_name || 'E-Team Leadership',
        created_by: user.sub,
      }
    );
    return { id, message: 'Programme added successfully' };
  }

  async updateProgramme(teamId: string, progId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query(
      `UPDATE eteam_programmes SET
        title = :title, scheduled_date = :scheduled_date, time_slot = :time_slot,
        venue = :venue, description = :description, leader_name = :leader_name,
        updated_at = NOW()
       WHERE id = :progId AND team_id = :teamId`,
      {
        progId, teamId: team.id, title: data.title,
        scheduled_date: data.date, time_slot: data.time, venue: data.venue,
        description: data.focus || data.description,
        leader_name: data.leader || null,
      }
    );
    return { progId, message: 'Programme updated successfully' };
  }

  async deleteProgramme(teamId: string, progId: string, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query('DELETE FROM eteam_programmes WHERE id = :progId AND team_id = :teamId', { progId, teamId: team.id });
    return { message: 'Programme deleted' };
  }

  async addAnnouncement(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    const id = uuidv4();
    await query(
      `INSERT INTO eteam_announcements
        (id, team_id, title, content, priority, published_at, expires_at, created_by)
       VALUES (:id, :teamId, :title, :content, :priority, NOW(), :expires_at, :created_by)`,
      {
        id, teamId: team.id, title: data.title, content: data.content,
        priority: data.priority || 'normal', expires_at: data.expires_at || null,
        created_by: user.sub,
      }
    );
    return { id, message: 'Announcement posted successfully' };
  }

  async deleteAnnouncement(teamId: string, annId: string, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query('DELETE FROM eteam_announcements WHERE id = :annId AND team_id = :teamId', { annId, teamId: team.id });
    return { message: 'Announcement removed' };
  }

  async addPhoto(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    if (!data.image_url) throw new BadRequestError('image_url is required');
    const id = uuidv4();
    await query(
      `INSERT INTO eteam_gallery
        (id, team_id, title, event_date, caption, image_url, google_photos_url, created_by)
       VALUES (:id, :teamId, :title, :event_date, :caption, :image_url, :google_photos_url, :created_by)`,
      {
        id, teamId: team.id, title: data.title || 'E-Team Moment',
        event_date: data.event_date || new Date().toISOString().slice(0, 10),
        caption: data.caption || null, image_url: data.image_url,
        google_photos_url: data.google_photos_url || null, created_by: user.sub,
      }
    );
    return { id, message: 'Photo added to team gallery' };
  }

  async deletePhoto(teamId: string, photoId: string, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    await query('DELETE FROM eteam_gallery WHERE id = :photoId AND team_id = :teamId', { photoId, teamId: team.id });
    return { message: 'Photo removed from gallery' };
  }

  async addReport(teamId: string, data: any, user: any) {
    const team = await this.verifyChairpersonScope(user, teamId);
    const id = uuidv4();
    await query(
      `INSERT INTO eteam_reports
        (id, team_id, title, activity_date, location, participants_count,
         souls_reached, outreach_type, summary, outcomes, follow_up_notes, submitted_by)
       VALUES (:id, :teamId, :title, :activity_date, :location, :participants_count,
               :souls_reached, :outreach_type, :summary, :outcomes, :follow_up_notes, :submitted_by)`,
      {
        id, teamId: team.id, title: data.title,
        activity_date: data.report_date || new Date().toISOString().slice(0, 10),
        location: data.location || team.region || 'Campus',
        participants_count: Number(data.participants_count || 0),
        souls_reached: Number(data.souls_reached || 0),
        outreach_type: data.outreach_type || 'outreach',
        summary: data.summary || '',
        outcomes: data.content || null,
        follow_up_notes: data.follow_up_notes || null,
        submitted_by: user.sub,
      }
    );
    return { id, message: 'Activity report submitted successfully' };
  }

  async uploadTeamImage(teamId: string, rawData: string, filename: string, field: 'cover' | 'banner' | 'logo', userId: string) {
    const team = await this.getTeamById(teamId);
    const { landingMediaService } = await import('../landing-media/landing-media.service').catch(() => ({ landingMediaService: null as any }));
    if (!landingMediaService) throw new BadRequestError('Media service unavailable');
    const { url } = landingMediaService.uploadImage(rawData, filename || `${team.code}-${field}.jpg`);
    const column = field === 'cover' ? 'cover_image_url' : field === 'banner' ? 'banner_image_url' : 'logo_url';
    await query(`UPDATE evangelism_teams SET ${column} = :url, updated_by = :userId, updated_at = NOW() WHERE id = :id`, { url, userId, id: team.id });
    return { url, team: await this.getTeamById(team.id) };
  }

  async appointChairperson(teamId: string, userId: string, phone?: string, assignedBy?: string) {
    const team = await this.getTeamById(teamId);
    const userRows = await query<any[]>(
      'SELECT id, full_name, phone_number FROM users WHERE id = :userId LIMIT 1',
      { userId }
    );
    if (!userRows?.length) throw new NotFoundError('User');

    await query(
      `UPDATE evangelism_teams
          SET leader_id = :userId, updated_by = :assignedBy, updated_at = NOW()
        WHERE id = :teamId`,
      { userId, assignedBy: assignedBy || null, teamId: team.id }
    );

    const roleRows = await query<any[]>(
      `SELECT id FROM roles WHERE code = :roleCode LIMIT 1`,
      { roleCode: team.code.toLowerCase() === 'noret' ? 'noret_chairperson' : 'soret_chairperson' }
    );
    if (!roleRows.length) throw new NotFoundError('E-Team leadership role');

    const roleId = roleRows[0].id;

    // Only one current chairperson may hold this team's scoped role. Revoke
    // the previous holder before granting the new appointment.
    await query(
      `UPDATE user_roles
          SET is_current = FALSE, end_date = CURDATE()
        WHERE role_id = :roleId
          AND scope_type = 'e_team'
          AND scope_id = :teamId
          AND is_current = TRUE`,
      { roleId, teamId: team.id }
    );

    await query(
      `INSERT INTO user_roles
        (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
       VALUES (UUID(), :userId, :roleId, 'e_team', :teamId, CURDATE(), TRUE, :assignedBy)`,
      { userId, roleId, teamId: team.id, assignedBy: assignedBy || null }
    );

    return {
      message: `${userRows[0].full_name} appointed as Chairperson for ${team.name}`,
      teamId: team.id,
      chairperson: userRows[0].full_name,
    };
  }
}

export const eteamsService = new ETeamsService();
