import { Request, Response } from 'express';
import { MembershipService } from '../services/membership.service';
import { sendSuccess } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { AuthenticationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

const membershipService = new MembershipService();

export const membershipController = {
  listApplications: asyncHandler(async (req: Request, res: Response) => {
    const { status, page, pageSize, search } = req.query as Record<string, string>;
    const userId = req.user?.sub;
    const permissions = Array.from(req.permissions ?? []);

    logger.info(
      {
        endpoint: req.originalUrl,
        userId,
        permissionsCount: permissions.length,
        statusFilter: status,
        page,
        pageSize,
      },
      '[MembershipController] listApplications called'
    );

    const result = await membershipService.listApplications(
      status,
      Number(page) || 1,
      Number(pageSize) || 50
    );

    let rows: any[] = (result.rows as any[]) || [];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r: any) =>
        String(r.full_name || '').toLowerCase().includes(q) ||
        String(r.email || '').toLowerCase().includes(q) ||
        String(r.admission_number || '').toLowerCase().includes(q)
      );
    }

    logger.info(
      { total: result.total, returned: rows.length },
      '[MembershipController] Returning membership applications'
    );

    return sendSuccess(res, rows, 'Membership applications retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    logger.info(
      { applicationId: req.params.id, reviewerId: req.user.sub },
      '[MembershipController] Approving application'
    );
    const membership = await membershipService.approveApplication(req.params.id, req.user.sub);
    return sendSuccess(res, membership, 'Membership application approved');
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    logger.info(
      { applicationId: req.params.id, reviewerId: req.user.sub, reason: req.body.rejectionReason },
      '[MembershipController] Rejecting application'
    );
    const application = await membershipService.rejectApplication(
      req.params.id,
      req.user.sub,
      req.body.rejectionReason
    );
    return sendSuccess(res, application, 'Membership application rejected');
  }),

  renew: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const membership = await membershipService.renew(
      req.user.sub,
      req.body.spiritualYearId,
      req.body.declarationId
    );
    return sendSuccess(res, membership, 'Membership renewed successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const membership = await membershipService.getMembership(req.params.id);
    return sendSuccess(res, membership, 'Membership retrieved');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AuthenticationError();
    const status = await membershipService.getMyStatus(req.user.sub);
    return sendSuccess(res, status, 'Your membership status');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { status, membership_type_id, page, pageSize } = req.query as Record<string, string>;
    const result = await membershipService.listMemberships(
      { status, membership_type_id },
      Number(page) || 1,
      Number(pageSize) || 20
    );
    return sendSuccess(res, result.rows, 'Memberships retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  listAllMembers: asyncHandler(async (req: Request, res: Response) => {
    const { search, year_of_study, department, status, page, pageSize } =
      req.query as Record<string, string>;
    const result = await membershipService.listAllMembersWithDetails(
      search,
      year_of_study,
      department,
      status,
      Number(page) || 1,
      Number(pageSize) || 50
    );
    return sendSuccess(res, result.rows, 'Members retrieved', 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }),

  deleteMember: asyncHandler(async (req: Request, res: Response) => {
    const result = await membershipService.deleteMember(req.params.id);
    return sendSuccess(res, result, 'Member removed from register successfully');
  }),

  exportCsv: asyncHandler(async (_req: Request, res: Response) => {
    const filename = `TUMCU_Membership_Register_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200);

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

    const headers = [
      'Membership No', 'Full Name', 'Admission No', 'Year of Study',
      'Department / Faculty', 'Email', 'Phone Number', 'Role', 'Ministries',
      'Services Attended', 'Status', 'Registered Date',
    ];
    res.write(headers.map(escapeCsv).join(',') + '\n');

    let page = 1;
    const pageSize = 200;
    while (true) {
      const result = await membershipService.listAllMembersWithDetails(
        undefined, undefined, undefined, undefined, page, pageSize
      );

      for (const m of result.rows) {
        const line = [
          m.membership_number, m.full_name, m.admission_number, m.year_of_study,
          m.department, m.email, m.phone_number, m.role_name, m.ministries,
          m.services_attended, m.status, m.registration_date,
        ].map(escapeCsv).join(',') + '\n';

        if (!res.write(line)) {
          await new Promise<void>((resolve) => res.once('drain', resolve));
        }
      }

      if (page >= result.totalPages) break;
      page += 1;
    }

    return res.end();
  }),
};
