import { query } from '../../../config/database';
import { ContactMessage } from '../interfaces/contact.interface';
import { v4 as uuidv4 } from 'uuid';

export class ContactRepository {
  async create(data: Omit<ContactMessage, 'id'|'status'|'created_at'|'read_at'|'replied_at'|'assigned_to'>) {
    const id = uuidv4();
    await query(`INSERT INTO contact_messages (id, sender_name, sender_email, sender_phone, subject, message)
      VALUES (:id, :sender_name, :sender_email, :sender_phone, :subject, :message)`, { id, ...data });
    const rows = await query<ContactMessage[]>('SELECT * FROM contact_messages WHERE id = :id', { id });
    return rows[0];
  }

  async list(page=1, pageSize=30, status?: string) {
    const safePage=Math.max(1,Number(page)||1); const safeSize=Math.min(100,Math.max(10,Number(pageSize)||30));
    const offset=(safePage-1)*safeSize;
    const where=status && status !== 'all' ? 'WHERE status = :status' : '';
    const countRows=await query<{total:number}[]>(`SELECT COUNT(*) total FROM contact_messages ${where}`, {status:status||null});
    const rows=await query<ContactMessage[]>(`SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`, {status:status||null,limit:safeSize,offset});
    const total=Number(countRows[0]?.total||0);
    return {rows,total,page:safePage,pageSize:safeSize,totalPages:Math.max(1,Math.ceil(total/safeSize))};
  }

  async update(id:string,data:{status?:string;assigned_to?:string|null}) {
    await query(`UPDATE contact_messages SET
      status = COALESCE(:status,status), assigned_to = COALESCE(:assigned_to,assigned_to),
      read_at = CASE WHEN :status = 'read' AND read_at IS NULL THEN NOW() ELSE read_at END,
      replied_at = CASE WHEN :status = 'replied' THEN NOW() ELSE replied_at END
      WHERE id = :id`, {id,status:data.status||null,assigned_to:data.assigned_to||null});
    const rows=await query<ContactMessage[]>('SELECT * FROM contact_messages WHERE id = :id',{id});
    return rows[0];
  }
}
