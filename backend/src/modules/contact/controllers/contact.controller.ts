import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { contactService } from '../services/contact.service';

export const contactController = {
  create: asyncHandler(async (req:Request,res:Response)=>sendSuccess(res,await contactService.create(req.body),'Message received. TUMCU leadership has been notified.',201)),
  list: asyncHandler(async (req:Request,res:Response)=>{ const q=req.query as Record<string,string>; const result=await contactService.list(Number(q.page)||1,Number(q.pageSize)||30,q.status); return sendSuccess(res,result.rows,'Contact messages retrieved',200,{page:result.page,pageSize:result.pageSize,total:result.total,totalPages:result.totalPages}); }),
  update: asyncHandler(async (req:Request,res:Response)=>sendSuccess(res,await contactService.update(req.params.id,req.body),'Contact message updated')),
};
