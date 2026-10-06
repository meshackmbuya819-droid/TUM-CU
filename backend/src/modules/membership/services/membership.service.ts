import { pool, query } from '../../../config/database';
import { BusinessRuleError, NotFoundError } from '../../../utils/errors';
import { toMySQLDateTime } from '../../../utils/datetime';
import {
  MembershipApplicationRepository,
  MembershipRepository,
} from '../repositories/membership.repository';

export class MembershipService {
  constructor(
    private readonly applications: MembershipApplicationRepository = new MembershipApplicationRepository(),
    private readonly memberships: MembershipRepository = new MembershipRepository()
  ) {}

  listApplications(status?: string, page = 1, pageSize = 20) {
    return this.applications.listWithApplicantInfo(status, page, pageSize);
  }

  /**
   * Approval workflow (Chapter 4):
   *   Application -> Review -> Approval -> Membership Number Generated ->
   *   Welcome Notification -> Added to Member Register
   */
  async approveApplication(applicationId: string, reviewerId: string) {
    const application = await this.applications.findById(applicationId);
    if (application.status === 'approved') {
      throw new BusinessRuleError('This application has already been approved');
    }

    const spiritualYear = await this.memberships.findCurrentSpiritualYear();
    if (!spiritualYear) throw new NotFoundError('Current spiritual year');

    const declaration = await this.memberships.findActiveDeclaration();
    if (!declaration) throw new NotFoundError('Active membership declaration');

    const year = new Date().getFullYear();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Allocate the number inside the same transaction as approval so
      // concurrent Secretarial approvals cannot generate the same number.
      const membershipNumber = await this.memberships.generateMembershipNumber(year, conn);

      const membershipId = await this.memberships.createFromApplication(
        {
          userId: application.user_id,
          membershipTypeId: application.membership_type_id,
          spiritualYearId: spiritualYear.id,
          declarationId: declaration.id,
          membershipNumber,
        },
        conn
      );

      await conn.query(
        `UPDATE membership_applications
            SET status = 'approved', reviewed_by = :reviewerId, reviewed_at = NOW(),
                resulting_membership_id = :membershipId
          WHERE id = :applicationId`,
        { reviewerId, membershipId, applicationId } as never
      );

      await conn.query(
        `UPDATE users SET account_status = 'active' WHERE id = :userId`,
        { userId: application.user_id } as never
      );

      // Every active member receives the baseline Member role. Leadership
      // roles are additive and may be assigned separately.
      await conn.query(
        `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current, assigned_by)
         SELECT UUID(), :userId, r.id, 'global', NULL, CURDATE(), TRUE, :assignedBy
           FROM roles r
          WHERE r.code = 'member'
            AND NOT EXISTS (
              SELECT 1 FROM user_roles ur
               WHERE ur.user_id = :userId
                 AND ur.role_id = r.id
                 AND ur.is_current = TRUE
            )`,
        { userId: application.user_id, assignedBy: reviewerId } as never
      );

      // Welcome notification
      await conn.query(
        `INSERT INTO notifications (id, user_id, type, title, body, channel)
         VALUES (UUID(), :userId, 'welcome', 'Membership Approved!',
                 CONCAT('Congratulations! Your TUMCU membership application has been approved. Your official membership number is ', :membershipNumber, '. Welcome to fellowship!'),
                 'in_app')`,
        { userId: application.user_id, membershipNumber } as never
      );

      await conn.commit();
      return this.memberships.findById(membershipId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async rejectApplication(applicationId: string, reviewerId: string, reason: string) {
    const application = await this.applications.findById(applicationId);
    if (application.status === 'approved') {
      throw new BusinessRuleError('An approved application cannot be rejected');
    }

    await pool.query(
      `UPDATE users SET account_status = 'rejected' WHERE id = :userId`,
      { userId: application.user_id }
    );

    return this.applications.update(applicationId, {
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: toMySQLDateTime(),
      rejection_reason: reason,
    } as never);
  }

  /** Annual renewal — a member re-signs the declaration for the new spiritual year. */
  async renew(userId: string, spiritualYearId: string, declarationId: string) {
    const existing = await query<unknown[]>(
      `SELECT id FROM memberships WHERE user_id = :userId AND spiritual_year_id = :spiritualYearId LIMIT 1`,
      { userId, spiritualYearId }
    );
    if (existing.length > 0) {
      throw new BusinessRuleError('Membership already renewed for this spiritual year');
    }

    const priorRows = await query<{ membership_type_id: string; membership_number: string }[]>(
      `SELECT membership_type_id, membership_number
         FROM memberships WHERE user_id = :userId
         ORDER BY registration_date DESC LIMIT 1`,
      { userId }
    );
    const prior = priorRows[0];
    if (!prior) throw new NotFoundError('Prior membership record');

    const year = new Date().getFullYear();
    const membershipNumber = await this.memberships.generateMembershipNumber(year);

    const membershipId = await this.memberships.createFromApplication({
      userId,
      membershipTypeId: prior.membership_type_id,
      spiritualYearId,
      declarationId,
      membershipNumber,
    });

    // Preserve the baseline Member role across annual renewals.
    await query(
      `INSERT INTO user_roles (id, user_id, role_id, scope_type, scope_id, start_date, is_current)
       SELECT UUID(), :userId, r.id, 'global', NULL, CURDATE(), TRUE
         FROM roles r
        WHERE r.code = 'member'
          AND NOT EXISTS (
            SELECT 1 FROM user_roles ur
             WHERE ur.user_id = :userId
               AND ur.role_id = r.id
               AND ur.is_current = TRUE
          )`,
      { userId }
    );

    return this.memberships.findById(membershipId);
  }

  getMembership(id: string) {
    return this.memberships.findById(id);
  }

  /** Self-service: a member's own membership + application history, no admin permission required. */
  async getMyStatus(userId: string) {
    const [memberships, applications] = await Promise.all([
      this.memberships.findAll({ user_id: userId }, { page: 1, pageSize: 10 }),
      this.applications.findAll({ user_id: userId }, { page: 1, pageSize: 10 }),
    ]);
    return { memberships: memberships.rows, applications: applications.rows };
  }

  listMemberships(filters: Record<string, unknown> = {}, page = 1, pageSize = 20) {
    return this.memberships.findAll(filters, { page, pageSize });
  }

  /**
   * Indexed, server-side member register query.
   *
   * The previous implementation loaded users, memberships, roles, ministries
   * and every attendance row into Node.js and then filtered them in memory.
   * That is O(total_database_rows) per request and becomes unsafe as the
   * membership register grows. Filtering, sorting and pagination now happen
   * in MySQL.
   */
  async listAllMembersWithDetails(
    search?: string,
    yearOfStudy?: string,
    department?: string,
    status?: string,
    page = 1,
    pageSize = 50
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(200, Math.max(10, Number(pageSize) || 50));
    const offset = (safePage - 1) * safePageSize;

    const where: string[] = [
      `u.deleted_at IS NULL`,
      `(u.account_status NOT IN ('pending_approval') OR m.id IS NOT NULL)`,
    ];
    const params: Record<string, unknown> = {
      limit: safePageSize,
      offset,
    };

    if (search?.trim()) {
      where.push(`(
        u.full_name LIKE :search OR
        u.email LIKE :search OR
        u.admission_number LIKE :search OR
        m.membership_number LIKE :search
      )`);
      params.search = `%${search.trim()}%`;
    }
    if (yearOfStudy && yearOfStudy !== 'all') {
      where.push(`CAST(u.year_of_study AS CHAR) = :yearOfStudy`);
      params.yearOfStudy = yearOfStudy;
    }
    if (department && department !== 'all') {
      where.push(`(u.department = :department OR u.school = :department OR u.course = :department)`);
      params.department = department;
    }
    if (status && status !== 'all') {
      where.push(`COALESCE(m.status, u.account_status) = :status`);
      params.status = status;
    }

    const whereSql = where.join(' AND ');

    const [countRows, rows] = await Promise.all([
      query<{ total: number }[]>(
        `SELECT COUNT(DISTINCT u.id) AS total
           FROM users u
           LEFT JOIN memberships m ON m.user_id = u.id
          WHERE ${whereSql}`,
        params
      ),
      query<any[]>(
        `SELECT
            COALESCE(m.id, u.id) AS id,
            u.id AS user_id,
            u.full_name,
            u.email,
            COALESCE(u.phone_number, 'Not provided') AS phone_number,
            COALESCE(u.admission_number, 'Not provided') AS admission_number,
            COALESCE(CONCAT('Year ', u.year_of_study), 'Year 1') AS year_of_study,
            COALESCE(u.department, u.school, u.course, 'Not specified') AS department,
            COALESCE(m.membership_number, CONCAT('TUMCU/', YEAR(CURDATE()), '/', RIGHT(COALESCE(u.admission_number, '101'), 3))) AS membership_number,
            COALESCE(mt.name, 'Full Member') AS membership_type,
            COALESCE(m.status, u.account_status, 'active') AS status,
            COALESCE(m.registration_date, DATE(u.created_at)) AS registration_date,
            COALESCE(GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', '), 'Member') AS role_name,
            COALESCE(
              GROUP_CONCAT(DISTINCT min.name ORDER BY min.name SEPARATOR ', '),
              'Not yet joined'
            ) AS ministries,
            (
              SELECT COUNT(*)
                FROM attendance_records ar
               WHERE ar.user_id = u.id
            ) AS services_attended
           FROM users u
           LEFT JOIN memberships m ON m.id = (
             SELECT m2.id
               FROM memberships m2
              WHERE m2.user_id = u.id
              ORDER BY m2.registration_date DESC, m2.created_at DESC
              LIMIT 1
           )
           LEFT JOIN membership_types mt ON mt.id = m.membership_type_id
           LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_current = TRUE
           LEFT JOIN roles r ON r.id = ur.role_id
           LEFT JOIN ministry_members mm ON mm.user_id = u.id
           LEFT JOIN ministries min ON min.id = mm.ministry_id
          WHERE ${whereSql}
          GROUP BY
            m.id, u.id, u.full_name, u.email, u.phone_number, u.admission_number,
            u.year_of_study, u.department, u.school, u.course, u.created_at,
            m.membership_number, mt.name, m.status, m.registration_date
          ORDER BY u.year_of_study ASC, u.full_name ASC, u.id ASC
          LIMIT :limit OFFSET :offset`,
        params
      ),
    ]);

    const total = Number(countRows?.[0]?.total || 0);
    return {
      rows: rows || [],
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }

  async deleteMember(memberIdOrUserId: string) {
    const membershipRows = await query<any[]>(
      `SELECT id, user_id FROM memberships WHERE id = :id OR user_id = :id LIMIT 1`,
      { id: memberIdOrUserId }
    );
    const member = membershipRows[0];
    const userId = member?.user_id || memberIdOrUserId;

    await pool.query('DELETE FROM memberships WHERE id = :id OR user_id = :userId', {
      id: member?.id || memberIdOrUserId,
      userId,
    });
    await pool.query('DELETE FROM user_roles WHERE user_id = :userId', { userId });
    await pool.query('DELETE FROM ministry_members WHERE user_id = :userId', { userId });
    await pool.query('DELETE FROM users WHERE id = :userId', { userId });

    return { id: memberIdOrUserId, userId, deleted: true };
  }

}
