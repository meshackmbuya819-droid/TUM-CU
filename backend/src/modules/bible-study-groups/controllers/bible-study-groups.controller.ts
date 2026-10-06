import { Request, Response } from 'express';
import { BibleStudyGroupsService } from '../services/bible-study-groups.service';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess, sendError } from '../../../utils/response';

const service = new BibleStudyGroupsService();

export const bibleStudyGroupsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const cohortName = req.query.cohortName as string | undefined;
    const groups = await service.listGroups(cohortName);
    return sendSuccess(res, groups, 'Bible study groups retrieved successfully');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const group = await service.getGroupById(req.params.id);
    if (!group) {
      return sendError(res, 'Bible study group not found', 404);
    }
    return sendSuccess(res, group, 'Bible study group details retrieved');
  }),

  getCandidates: asyncHandler(async (_req: Request, res: Response) => {
    const candidates = await service.getCandidateMembers();
    return sendSuccess(res, candidates, 'Candidate members retrieved successfully');
  }),

  autoBalance: asyncHandler(async (req: Request, res: Response) => {
    const result = await service.autoBalanceGroups(req.body);
    return sendSuccess(
      res,
      result,
      `Successfully generated ${result.groups_count} gender-balanced Bible study groups`
    );
  }),

  batchSave: asyncHandler(async (req: Request, res: Response) => {
    const { cohortName, groups } = req.body;
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return sendError(res, 'At least one group is required to save', 400);
    }
    const result = await service.batchSaveGroups({ cohortName, groups });
    return sendSuccess(
      res,
      result,
      `Successfully committed ${result.savedCount} Bible study groups with ${result.membersAssigned} members assigned`
    );
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const success = await service.updateGroup(req.params.id, req.body);
    return sendSuccess(res, { success }, 'Bible study group updated successfully');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const success = await service.deleteGroup(req.params.id);
    return sendSuccess(res, { success }, 'Bible study group deleted successfully');
  }),

  exportExcel: asyncHandler(async (req: Request, res: Response) => {
    const cohortName = req.query.cohortName as string | undefined;
    const buffer = await service.exportExcel(cohortName);

    const safeCohort = (cohortName || 'All_Cohorts').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `TUMCU_Bible_Study_Groups_${safeCohort}_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }),
};
