import { BaseService } from '../../../core/base.service';
import { BroadcastMessages } from '../interfaces/broadcast-messages.interface';
import { BroadcastMessagesRepository } from '../repositories/broadcast-messages.repository';
import { query } from '../../../config/database';
import { v4 as uuidv4 } from 'uuid';

export class BroadcastMessagesService extends BaseService<BroadcastMessages> {
  constructor(repository: BroadcastMessagesRepository = new BroadcastMessagesRepository()) { super(repository); }

  async sendOfficialAnnouncement(senderId:string, subject:string, body:string) {
    const recipients = await query<{id:string}[]>(`SELECT id FROM users WHERE account_status='active' AND deleted_at IS NULL`);
    const groupRows = await query<any[]>(`SELECT id FROM broadcast_groups WHERE code='entire_cu' LIMIT 1`);
    let groupId = groupRows[0]?.id;
    if (!groupId) {
      groupId=uuidv4();
      await query(`INSERT INTO broadcast_groups (id,code,name) VALUES (:id,'entire_cu','Entire Christian Union')`,{id:groupId});
    }
    const messageId=uuidv4();
    await query(`INSERT INTO broadcast_messages (id,broadcast_group_id,channel,subject,body,sent_by,sent_at,recipient_count)
      VALUES (:id,:groupId,'in_app',:subject,:body,:senderId,NOW(),:count)`,{id:messageId,groupId,subject,body,senderId,count:recipients.length});
    for (const recipient of recipients) {
      await query(`INSERT INTO notifications (id,user_id,type,title,body,channel,sent_at) VALUES (:id,:userId,'broadcast',:title,:body,'in_app',NOW())`,{id:uuidv4(),userId:recipient.id,title:subject,body});
    }
    return { id:messageId, recipient_count:recipients.length };
  }
}
export const broadcastMessagesService = new BroadcastMessagesService();
