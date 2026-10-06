import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../config/database';
import { NotFoundError } from '../../../utils/errors';
import { ContactRepository } from '../repositories/contact.repository';

export class ContactService {
  constructor(private readonly repo = new ContactRepository()) {}

  async create(data:{name:string;email:string;phone?:string|null;subject:string;message:string}) {
    const contact = await this.repo.create({ sender_name:data.name, sender_email:data.email, sender_phone:data.phone||null, subject:data.subject, message:data.message });
    // Deliver both durable in-app notifications and queued emails to the current
    // Secretary, Chairperson and every current Super Administrator.
    const recipients = await query<{id:string;email:string}[]>(`
      SELECT DISTINCT u.id, u.email FROM users u
      JOIN user_roles ur ON ur.user_id=u.id AND ur.is_current=TRUE
      JOIN roles r ON r.id=ur.role_id
      WHERE u.account_status='active' AND r.code IN ('secretary','chairperson','super_admin') AND u.email IS NOT NULL`);
    for (const recipient of recipients) {
      const title = `New TUMCU contact message: ${data.subject}`;
      const body = `From: ${data.name} <${data.email}>${data.phone ? ` | Phone: ${data.phone}` : ''}\n\n${data.message}`;

      // Durable in-app notification: the recipient sees the message in TECUMP
      // even when SMTP is unavailable.
      await query(`INSERT INTO notifications (id,user_id,type,title,body,channel)
        VALUES (:id,:userId,'contact_message',:title,:body,'in_app')`, {
        id: uuidv4(), userId: recipient.id, title, body
      });

      // Separate durable email job: the dispatcher sends this when SMTP is configured.
      await query(`INSERT INTO notifications (id,user_id,type,title,body,channel)
        VALUES (:id,:userId,'contact_message',:title,:body,'email')`, {
        id: uuidv4(), userId: recipient.id, title, body
      });
    }
    return contact;
  }

  list(page?:number,pageSize?:number,status?:string){ return this.repo.list(page,pageSize,status); }

  async update(id:string,data:{status?:string;assigned_to?:string|null}) {
    const updated=await this.repo.update(id,data); if(!updated) throw new NotFoundError('Contact message'); return updated;
  }
}
export const contactService = new ContactService();
