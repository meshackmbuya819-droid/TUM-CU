import { BaseController } from '../../../core/base.controller';
import { BroadcastMessages } from '../interfaces/broadcast-messages.interface';
import { BroadcastMessagesService, broadcastMessagesService } from '../services/broadcast-messages.service';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { Request, Response } from 'express';

const base = new BaseController<BroadcastMessages>(broadcastMessagesService, 'BroadcastMessages');
export const broadcastMessagesController = {
  list: base.list, getById: base.getById, create: base.create, update: base.update, remove: base.remove,
  sendOfficialAnnouncement: asyncHandler(async (req:Request,res:Response)=>{
    const result=await broadcastMessagesService.sendOfficialAnnouncement(req.user!.sub, req.body.subject || 'TUMCU Official Announcement', req.body.body);
    return sendSuccess(res,result,'Announcement delivered to active members');
  }),
};
