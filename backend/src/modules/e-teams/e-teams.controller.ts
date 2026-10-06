import { Request, Response } from 'express';
import { eteamsService } from './e-teams.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/errors';

export const eteamsController = {
  // Public / Member: List E-Teams
  listTeams: asyncHandler(async (_req: Request, res: Response) => {
    const teams = await eteamsService.getTeams();
    return sendSuccess(res, teams, 'Evangelism teams retrieved');
  }),

  // Public / Member: Get single team details
  getTeam: asyncHandler(async (req: Request, res: Response) => {
    const team = await eteamsService.getTeamById(req.params.id);
    return sendSuccess(res, team, 'Evangelism team details');
  }),

  // Super Admin: Create/Edit complete E-Team metadata
  createTeam: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.createTeam(req.body, req.user?.sub as string);
    return sendSuccess(res, result, 'Evangelism team created successfully', 201);
  }),

  updateTeam: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.updateTeam(req.params.id, req.body, req.user?.sub as string);
    return sendSuccess(res, result, 'Evangelism team updated successfully');
  }),

  // Chairperson: Add Programme
  addProgramme: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.addProgramme(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),

  // Chairperson: Update Programme
  updateProgramme: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.updateProgramme(req.params.id, req.params.progId, req.body, req.user);
    return sendSuccess(res, result, result.message);
  }),

  // Chairperson: Delete Programme
  deleteProgramme: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.deleteProgramme(req.params.id, req.params.progId, req.user);
    return sendSuccess(res, result, result.message);
  }),

  // Chairperson: Post Announcement
  addAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.addAnnouncement(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),

  // Chairperson: Delete Announcement
  deleteAnnouncement: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.deleteAnnouncement(req.params.id, req.params.annId, req.user);
    return sendSuccess(res, result, result.message);
  }),

  // Chairperson: Add Photo
  addPhoto: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.addPhoto(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),

  // Chairperson: Delete Photo
  deletePhoto: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.deletePhoto(req.params.id, req.params.photoId, req.user);
    return sendSuccess(res, result, result.message);
  }),

  // Chairperson: Submit Report
  addReport: asyncHandler(async (req: Request, res: Response) => {
    const result = await eteamsService.addReport(req.params.id, req.body, req.user);
    return sendSuccess(res, result, result.message, 201);
  }),

  // Super Admin: Upload durable E-Team imagery
  uploadTeamImage: asyncHandler(async (req: Request, res: Response) => {
    const { base64, image, filename, field = 'cover' } = req.body || {};
    if (!['cover','banner','logo'].includes(field)) throw new BadRequestError('field must be cover, banner or logo');
    const rawData = image || base64;
    if (!rawData || typeof rawData !== 'string') throw new BadRequestError('Image data is required');
    const result = await eteamsService.uploadTeamImage(req.params.id, rawData, filename || `${req.params.id}-${field}.jpg`, field, req.user!.sub);
    return sendSuccess(res, result, 'E-Team image uploaded and persisted', 201);
  }),

  // Super Admin: Appoint Chairperson
  appointChairperson: asyncHandler(async (req: Request, res: Response) => {
    const { user_id, phone } = req.body;
    if (!user_id) throw new BadRequestError('user_id is required');
    const result = await eteamsService.appointChairperson(req.params.id, user_id, phone, req.user!.sub);
    return sendSuccess(res, result, result.message);
  }),
};
