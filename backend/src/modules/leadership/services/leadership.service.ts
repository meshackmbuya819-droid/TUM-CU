import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../../../core/base.service';
import { Leadership, LeadershipPosition, LeadershipAssignment, LeaderResponsibilitiesView } from '../interfaces/leadership.interface';
import { LeadershipRepository } from '../repositories/leadership.repository';
import { query, memoryDb } from '../../../config/database';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';

export class LeadershipService extends BaseService<Leadership> {
  private readonly leadershipRepo: LeadershipRepository;

  constructor(repository: LeadershipRepository = new LeadershipRepository()) {
    super(repository);
    this.leadershipRepo = repository;
  }

  private getRoleCodeForPosition(positionCode: string): { roleCode: string; scopeType: 'global' | 'executive' | 'ministry'; ministryCode?: string } {
    const executive = new Set([
      'chairperson','first_vice_chairperson','second_vice_chairperson','secretary','vice_secretary','treasurer',
      'prayer_chairperson','worship_chairperson','missions_chairperson','discipleship_chairperson',
      'assets_chairperson','publicity_chairperson','non_residents_chairperson','welfare_chairperson',
    ]);
    if (executive.has(positionCode)) return { roleCode: positionCode, scopeType: 'executive' };
    const ministryCode = positionCode === 'media_ministry_leader' ? 'media' : positionCode.replace(/_leader$/, '');
    return { roleCode: 'ministry_leader', scopeType: 'ministry', ministryCode };
  }

  private async syncUserRoleForLeadership(userId: string, positionCode: string, positionId: string, activate: boolean): Promise<void> {
    const { roleCode, scopeType, ministryCode } = this.getRoleCodeForPosition(positionCode);
    const roleRows = await query<any[]>('SELECT id FROM roles WHERE code = :roleCode LIMIT 1', { roleCode });
    if (!roleRows.length) throw new BusinessRuleError(`Role ${roleCode} is not configured. Run database seed.`);
    const roleId = roleRows[0].id;

    if (!activate) {
      let revokeScopeId: string | null = positionId;
      if (scopeType === 'ministry') {
        const ministryRows = await query<any[]>('SELECT id FROM ministries WHERE code = :code LIMIT 1', { code: ministryCode });
        revokeScopeId = ministryRows[0]?.id || null;
      }
      await query(
        `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()
          WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE
            AND scope_type = :scopeType AND scope_id = :scopeId`,
        { userId, roleId, scopeType, scopeId: revokeScopeId }
      );
      return;
    }

    let scopeId: string | null = positionId;
    if (scopeType === 'ministry') {
      const ministryRows = await query<any[]>('SELECT id FROM ministries WHERE code = :code LIMIT 1', { code: ministryCode });
      if (!ministryRows.length) throw new BusinessRuleError(`Ministry ${ministryCode} is not configured. Run database seed.`);
      scopeId = ministryRows[0].id;
    }

    await query(
      `UPDATE user_roles SET is_current = FALSE, end_date = CURDATE()\n        WHERE user_id = :userId AND role_id = :roleId AND is_current = TRUE\n          AND scope_type = :scopeType AND scope_id = :scopeId`,
      { userId, roleId, scopeType, scopeId }
    );

    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, end_date, is_current, assigned_by)\n       VALUES (UUID(), :userId, :roleId, :scopeType, :scopeId, CURDATE(), NULL, TRUE, :assignedBy)`,
      { userId, roleId, scopeType, scopeId, assignedBy: userId }
    );
  }

  async listPositions(): Promise<LeadershipPosition[]> {
    return this.leadershipRepo.findPositions();
  }

  async listAssignments(filters?: { status?: string; positionId?: string; userId?: string }): Promise<LeadershipAssignment[]> {
    return this.leadershipRepo.findAssignments(filters);
  }

  async assignLeader(params: {
    positionId: string;
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    academicYear?: string;
    notes?: string;
  }): Promise<{ id: string }> {
    const position = await this.leadershipRepo.findPositionById(params.positionId);
    if (!position) {
      throw new NotFoundError('Leadership Position');
    }

    // Check if user exists
    const users = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: params.userId });
    if (!users || users.length === 0) {
      throw new NotFoundError('User');
    }

    const roleInfo = this.getRoleCodeForPosition(position.code);

    // Find if there is an existing active assignment for this position
    const existing = await this.leadershipRepo.findAssignments({ positionId: params.positionId, status: 'active' });
    if (existing.length > 0) {
      // Mark current assignment as ended or replaced
      const prev = existing[0];
      await this.leadershipRepo.updateAssignment(prev.id, {
        status: 'ended',
        notes: `Replaced by ${users[0].full_name} (${params.assignmentType})`,
      });

      // Revoke the active role for previous holder
      if (prev.user_id && prev.user_id !== params.userId) {
        await this.syncUserRoleForLeadership(prev.user_id, position.code, params.positionId, false);
      }
    }

    const id = await this.leadershipRepo.createAssignment({
      position_id: params.positionId,
      user_id: params.userId,
      assignment_type: params.assignmentType,
      academic_year: params.academicYear || '2025/2026',
      status: 'active',
      notes: params.notes || `Appointed as ${position.name} (${params.assignmentType})`,
    });

    // Grant constitutional RBAC role to new leader
    await this.syncUserRoleForLeadership(params.userId, position.code, params.positionId, true);

    // Audit log
    if (memoryDb.tables.audit_logs) {
      memoryDb.tables.audit_logs.unshift({
        id: uuidv4(),
        user_id: params.userId,
        action: 'leadership.appointed',
        entity_type: 'leadership_assignment',
        entity_id: id,
        old_values: null,
        new_values: JSON.stringify({
          position: position.name,
          roleCode: roleInfo.roleCode,
          type: params.assignmentType,
          academicYear: params.academicYear || '2025/2026',
        }),
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    }

    return { id };
  }

  async appointReplacement(positionId: string, params: {
    userId: string;
    assignmentType: 'permanent' | 'acting' | 'co-opted' | 'temporary';
    notes?: string;
  }): Promise<{ id: string }> {
    const position = await this.leadershipRepo.findPositionById(positionId);
    if (!position) {
      throw new NotFoundError('Leadership Position');
    }
    const roleInfo = this.getRoleCodeForPosition(position.code);

    // Find vacant assignment for this position
    const vacantAssignments = await this.leadershipRepo.findAssignments({ positionId, status: 'vacant' });
    if (vacantAssignments.length > 0) {
      // Update this vacant assignment
      await this.leadershipRepo.updateAssignment(vacantAssignments[0].id, {
        user_id: params.userId,
        status: 'active',
        vacancy_reason: null,
        vacancy_date: null,
        notes: params.notes || `Appointed replacement under Article 9 (${params.assignmentType})`,
      });

      await this.syncUserRoleForLeadership(params.userId, position.code, positionId, true);
      return { id: vacantAssignments[0].id };
    }

    return this.assignLeader({
      positionId,
      userId: params.userId,
      assignmentType: params.assignmentType,
      notes: params.notes,
    });
  }

  async updateAssignment(id: string, data: Partial<LeadershipAssignment>): Promise<void> {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError('Leadership Assignment');
    }
    await this.leadershipRepo.updateAssignment(id, data);
  }

  async revokeAssignment(id: string, reason?: string): Promise<void> {
    const existing = await this.leadershipRepo.findAssignmentById(id);
    if (!existing) {
      throw new NotFoundError('Leadership Assignment');
    }
    await this.leadershipRepo.updateAssignment(id, {
      status: 'vacant',
      user_id: null,
      vacancy_reason: reason || 'Relieved of responsibility / Vacancy declared pursuant to Constitution Article 9',
      vacancy_date: new Date().toISOString().split('T')[0],
    });

    if (existing.user_id && existing.position_id) {
      const position = await this.leadershipRepo.findPositionById(existing.position_id);
      if (position) {
        await this.syncUserRoleForLeadership(existing.user_id, position.code, existing.position_id, false);
      }
    }
  }

  async getMyResponsibilities(userId: string): Promise<LeaderResponsibilitiesView> {
    const users = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: userId });
    const user = users[0] || {
      id: userId,
      full_name: 'CU Leader',
      email: '',
      phone_number: '',
      admission_number: '',
    };

    const assignments = await this.leadershipRepo.findAssignments({ userId, status: 'active' });

    // Collect all responsibilities, permissions, and constitutional restrictions
    const allDuties: string[] = [];
    const allPerms: string[] = [];
    const allRestrictions: string[] = [];

    for (const a of assignments) {
      if (a.responsibilities) allDuties.push(...a.responsibilities);
      if (a.permissions) allPerms.push(...a.permissions);
      if (a.constitutional_restrictions) allRestrictions.push(...a.constitutional_restrictions);
    }

    // Attention items
    const applications = await query<any[]>('SELECT * FROM membership_applications WHERE status IN (\'submitted\', \'under_review\')');
    const vacancies = await this.leadershipRepo.findAssignments({ status: 'vacant' });
    const meetings = await query<any[]>('SELECT * FROM meetings WHERE status = \'awaiting_minutes\'');
    const financeResolutions = await query<any[]>('SELECT * FROM finance_resolutions WHERE status = \'pending_signatures\'');

    return {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        phone: user.phone_number,
        admission_number: user.admission_number,
      },
      positions: assignments,
      all_responsibilities: Array.from(new Set(allDuties)),
      permissions: Array.from(new Set(allPerms)),
      constitutional_restrictions: Array.from(new Set(allRestrictions)),
      pending_attention: {
        membership_applications: applications.length,
        leadership_vacancies: vacancies.length,
        meetings_awaiting_minutes: meetings.length,
        finance_awaiting_action: financeResolutions.length,
      },
    };
  }

  async getOverview() {
    const counts = await this.leadershipRepo.getCounts();
    const positions = await this.leadershipRepo.findPositions();
    const vacancies = await this.leadershipRepo.findAssignments({ status: 'vacant' });
    return {
      ...counts,
      positions_count: positions.length,
      vacancies,
      tenure_academic_year: '2025/2026',
      completion_percentage: 78,
    };
  }

  async getPublicExecutives() {
    const positions = await this.leadershipRepo.findPositions();
    const assignments = await this.leadershipRepo.findAssignments({ status: 'active' });

    // Join active assignments with positions
    const executives = positions
      .filter((p) => p.is_executive || p.category === 'executive' || !p.category || (p.category as string) === 'committee')
      .map((pos) => {
        const assignment: any = assignments.find((a: any) => a.position_id === pos.id);
        return {
          id: pos.id,
          assignment_id: assignment?.id || null,
          position_id: pos.id,
          position_name: pos.name,
          position_code: pos.code,
          category: pos.category || 'executive',
          display_order: pos.display_order || 99,
          responsibilities: pos.responsibilities || [],
          constitutional_reference: pos.constitutional_reference || '',
          full_name: assignment?.user_name && assignment.user_name !== 'Unassigned' ? assignment.user_name : 'Not yet appointed',
          email: assignment?.user_email || '',
          phone_number: assignment?.user_phone || '',
          avatar_url: assignment?.user_avatar || null,
          course: assignment?.user_course || '',
          year_of_study: assignment?.user_year || '',
          academic_year: assignment?.academic_year || '2025/2026',
          status: assignment ? assignment.status : 'active',
          assignment_type: assignment?.assignment_type || 'elected',
        };
      })
      .sort((a, b) => a.display_order - b.display_order);

    return executives;
  }

  async getLeadershipDirectory() {
    const positions = await this.leadershipRepo.findPositions();
    const assignments = await this.leadershipRepo.findAssignments({ status: 'active' });

    // Join active assignments with positions for all categories (executive, committee, ministry)
    const leaders = positions
      .map((pos) => {
        const assignment: any = assignments.find((a: any) => a.position_id === pos.id);
        const defaultName = pos.is_executive
          ? 'Not yet appointed'
          : pos.category === 'ministry'
          ? `${pos.name.replace('Leader', '')} Leader`
          : 'Not yet appointed';

        return {
          id: pos.id,
          assignment_id: assignment?.id || null,
          position_id: pos.id,
          position_name: pos.name,
          position_code: pos.code,
          category: (pos.category || (pos.is_executive ? 'executive' : 'ministry')) as string,
          display_order: pos.display_order || 99,
          responsibilities: pos.responsibilities || [],
          constitutional_reference: pos.constitutional_reference || '',
          full_name: assignment?.user_name && assignment.user_name !== 'Unassigned' ? assignment.user_name : 'Not yet appointed',
          email: assignment?.user_email || '',
          phone_number: assignment?.user_phone || '',
          avatar_url: assignment?.user_avatar || null,
          course: assignment?.user_course || '',
          year_of_study: assignment?.user_year || '',
          academic_year: assignment?.academic_year || '2026/2027',
          status: assignment ? assignment.status : 'active',
          assignment_type: assignment?.assignment_type || 'elected',
        };
      })
      .sort((a, b) => a.display_order - b.display_order);

    return leaders;
  }
}

