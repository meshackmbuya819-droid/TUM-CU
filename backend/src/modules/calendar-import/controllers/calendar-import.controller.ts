import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { CalendarImportService } from '../services/calendar-import.service';
const service = new CalendarImportService();
export const calendarImportController = {
  extract: asyncHandler(async (req: Request, res: Response) => {
    const { imageData, mimeType, filename } = req.body || {};
    const result = await service.extractAndSave({ imageData, mimeType, filename, userId: req.user!.sub });
    return sendSuccess(res, result, 'Events extracted and saved for official review', 201);
  }),
  listPending: asyncHandler(async (_req: Request, res: Response) => sendSuccess(res, await service.listPending(), 'Pending calendar imports retrieved')),
  approve: asyncHandler(async (req: Request, res: Response) => sendSuccess(res, await service.approve(req.params.id, req.user!.sub), 'Calendar events approved and synchronized')),
  reject: asyncHandler(async (req: Request, res: Response) => sendSuccess(res, await service.reject(req.params.id, req.user!.sub, req.body?.note), 'Calendar import rejected')),
};
