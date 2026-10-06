import { BaseService } from '../../../core/base.service';
import { query } from '../../../config/database';
import { Ministries } from '../interfaces/ministries.interface';
import { MinistriesRepository } from '../repositories/ministries.repository';

export class MinistriesService extends BaseService<Ministries> {
  constructor(
    protected readonly repository: MinistriesRepository = new MinistriesRepository()
  ) {
    super(repository);
  }

  async getDetails(id: string) {
    const ministry = await this.repository.findByIdOrCode(id);
    const ministryId = ministry.id;

    const [memberRows, trainingRows] = await Promise.all([
      query<{ total: string | number }[]>(
        `SELECT COUNT(*) AS total
           FROM ministry_members mm
           JOIN memberships m ON m.user_id = mm.user_id
          WHERE mm.ministry_id = :ministryId
            AND (mm.end_date IS NULL OR mm.end_date >= CURRENT_DATE)
            AND m.status = 'active'`,
        { ministryId }
      ),

      query<{
        id: string;
        title: string;
        training_date: string;
        facilitator: string | null;
        notes: string | null;
      }[]>(
        `SELECT
            id,
            title,
            training_date,
            facilitator,
            notes
           FROM ministry_trainings
          WHERE ministry_id = :ministryId
          ORDER BY training_date DESC
          LIMIT 6`,
        { ministryId }
      ),
    ]);

    return {
      ministry,
      stats: {
        activeMembers: Number(memberRows[0]?.total ?? 0),
      },
      trainings: trainingRows,
    };
  }

  async findByIdSafe(id: string) {
    return this.repository.findById(id);
  }
}