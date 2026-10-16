import { BaseRepository, PaginatedResult, PaginationParams } from '../../../core/base.repository';
import { query } from '../../../config/database';
import { BroadcastMessages } from '../interfaces/broadcast-messages.interface';

/**
 * broadcast_messages uses sent_at (not created_at). Override the generic list
 * query so public announcements do not fail with Unknown column 'created_at'.
 */
export class BroadcastMessagesRepository extends BaseRepository<BroadcastMessages> {
  constructor() {
    super('broadcast_messages');
  }

  override async findAll(
    filters: Record<string, unknown> = {},
    { page = 1, pageSize = 20 }: PaginationParams = {}
  ): Promise<PaginatedResult<BroadcastMessages>> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(Math.floor(pageSize), 100)
      : 20;
    const whereParts: string[] = [];
    const params: Record<string, unknown> = {};

    // Only fields used by the broadcast API are accepted as filters.
    for (const key of ['channel', 'broadcast_group_id', 'sent_by'] as const) {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        whereParts.push(`\`${key}\` = :${key}`);
        params[key] = value;
      }
    }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM broadcast_messages ${where}`,
      params
    );
    const rows = await query<BroadcastMessages[]>(
      `SELECT * FROM broadcast_messages ${where}
       ORDER BY sent_at DESC, id DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit: safePageSize, offset: (safePage - 1) * safePageSize }
    );
    const total = Number(countRows[0]?.total ?? 0);
    return {
      rows,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    };
  }
}
