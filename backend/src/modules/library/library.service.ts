import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface LibraryResourceRecord {
  id: string;
  title: string;
  author: string;
  category: string;
  is_digital: number | boolean;
  cover_image_url?: string | null;
  file_url?: string | null;
  description?: string | null;
  status?: 'available' | 'maintenance' | 'archived';
  created_at: string;
  updated_at?: string | null;
}

export interface LibraryBorrowingRecord {
  id: string;
  book_title: string;
  user_id: string;
  borrower_name: string;
  borrower_email: string;
  borrower_phone?: string | null;
  user_admission_number?: string | null;
  borrowed_at: string;
  due_at: string;
  returned_at?: string | null;
  status: 'active' | 'overdue' | 'returned';
  notes?: string | null;
  issued_by?: string | null;
  returned_to?: string | null;
  created_at?: string;
  updated_at?: string | null;
  // Computed fields
  days_overdue?: number;
  days_remaining?: number;
  is_overdue?: boolean;
  is_due_soon?: boolean;
}

export class LibraryService {
  // =========================================================================
  // 1. E-LIBRARY (Digital Books & Documents Catalogue)
  // =========================================================================
  async getResources(params: { category?: string; search?: string }): Promise<LibraryResourceRecord[]> {
    let sql = 'SELECT * FROM library_resources WHERE 1=1';
    const queryParams: Record<string, any> = {};

    if (params.category && params.category !== 'all') {
      sql += ' AND category = :category';
      queryParams.category = params.category;
    }

    if (params.search && params.search.trim()) {
      sql += ' AND (title LIKE :search OR author LIKE :search OR description LIKE :search OR category LIKE :search)';
      queryParams.search = `%${params.search.trim()}%`;
    }

    sql += ' ORDER BY title ASC';
    const rows = await query<LibraryResourceRecord[]>(sql, queryParams);
    return rows || [];
  }

  async getResourceById(id: string): Promise<LibraryResourceRecord> {
    const rows = await query<LibraryResourceRecord[]>('SELECT * FROM library_resources WHERE id = :id LIMIT 1', { id });
    if (!rows || rows.length === 0) {
      throw new NotFoundError('E-Library Resource');
    }
    return rows[0];
  }

  async createResource(data: Partial<LibraryResourceRecord>): Promise<LibraryResourceRecord> {
    if (!data.title?.trim()) {
      throw new BadRequestError('Book title is required');
    }
    const id = `lib-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    await query(
      `INSERT INTO library_resources (
        id, title, author, category, is_digital,
        cover_image_url, file_url, description, status, created_at
      ) VALUES (
        :id, :title, :author, :category, 1,
        :cover_image_url, :file_url, :description, :status, :created_at
      )`,
      {
        id,
        title: data.title.trim(),
        author: data.author?.trim() || 'TUMCU Ministry',
        category: data.category || 'General',
        cover_image_url: data.cover_image_url || null,
        file_url: data.file_url || null,
        description: data.description || null,
        status: data.status || 'available',
        created_at: now,
      }
    );

    return this.getResourceById(id);
  }

  async updateResource(id: string, data: Partial<LibraryResourceRecord>): Promise<LibraryResourceRecord> {
    const existing = await this.getResourceById(id);

    await query(
      `UPDATE library_resources SET
        title = :title,
        author = :author,
        category = :category,
        cover_image_url = :cover_image_url,
        file_url = :file_url,
        description = :description,
        status = :status,
        updated_at = :now
      WHERE id = :id`,
      {
        id,
        title: data.title !== undefined ? data.title.trim() : existing.title,
        author: data.author !== undefined ? data.author.trim() : existing.author,
        category: data.category !== undefined ? data.category : existing.category,
        cover_image_url: data.cover_image_url !== undefined ? data.cover_image_url : existing.cover_image_url,
        file_url: data.file_url !== undefined ? data.file_url : existing.file_url,
        description: data.description !== undefined ? data.description : existing.description,
        status: data.status !== undefined ? data.status : existing.status,
        now: new Date().toISOString(),
      }
    );

    return this.getResourceById(id);
  }

  async deleteResource(id: string): Promise<void> {
    await this.getResourceById(id);
    await query('DELETE FROM library_resources WHERE id = :id', { id });
  }

  // =========================================================================
  // 2. PHYSICAL BOOK LENDING REGISTER
  // =========================================================================
  async checkoutBook(params: {
    book_title?: string;
    resource_id?: string;
    user_id: string;
    due_at?: string;
    due_days?: number;
    notes?: string;
    librarian_id?: string;
  }) {
    let bookTitle = params.book_title?.trim();
    if (!bookTitle && params.resource_id) {
      try {
        const res = await this.getResourceById(params.resource_id);
        bookTitle = res.title;
      } catch {
        bookTitle = 'General Book';
      }
    }

    if (!bookTitle) {
      throw new BadRequestError('Physical book title is required to record a loan');
    }
    if (!params.user_id) {
      throw new BadRequestError('Borrower selection is required');
    }

    // Look up registered borrower strictly from database
    const userRows = await query<any[]>('SELECT * FROM users WHERE id = :id LIMIT 1', { id: params.user_id });
    if (!userRows || userRows.length === 0) {
      throw new NotFoundError('Registered Member');
    }
    const borrower = userRows[0];

    const borrowingId = `bor-${uuidv4().substring(0, 8)}`;
    const now = new Date();

    let dueDate: Date;
    if (params.due_at) {
      dueDate = new Date(params.due_at);
      if (isNaN(dueDate.getTime())) {
        dueDate = new Date(now.getTime() + 14 * 86400000);
      }
    } else {
      const days = Number(params.due_days) || 14;
      dueDate = new Date(now.getTime() + days * 86400000);
    }

    await query(
      `INSERT INTO library_borrowings (
        id, book_title, user_id, borrower_name, borrower_email, borrower_phone, user_admission_number,
        borrowed_at, due_at, status, notes, issued_by, created_at
      ) VALUES (
        :id, :book_title, :user_id, :borrower_name, :borrower_email, :borrower_phone, :user_admission_number,
        :borrowed_at, :due_at, 'active', :notes, :issued_by, :created_at
      )`,
      {
        id: borrowingId,
        book_title: bookTitle,
        user_id: borrower.id,
        borrower_name: borrower.full_name || 'Member',
        borrower_email: borrower.email || '',
        borrower_phone: borrower.phone_number || '',
        user_admission_number: borrower.admission_number || null,
        borrowed_at: now.toISOString(),
        due_at: dueDate.toISOString(),
        notes: params.notes || null,
        issued_by: params.librarian_id || null,
        created_at: now.toISOString(),
      }
    );

    return {
      id: borrowingId,
      book_title: bookTitle,
      borrower_name: borrower.full_name,
      due_at: dueDate.toISOString(),
      status: 'active',
      message: `Loan recorded: "${bookTitle}" issued to ${borrower.full_name}. Due on ${dueDate.toLocaleDateString()}.`,
    };
  }

  async returnBook(borrowingId: string, returnedToId?: string) {
    const rows = await query<any[]>('SELECT * FROM library_borrowings WHERE id = :id LIMIT 1', { id: borrowingId });
    if (!rows || rows.length === 0) {
      throw new NotFoundError('Borrowing record');
    }
    const borrowing = rows[0];

    if (borrowing.status === 'returned' || borrowing.returned_at) {
      throw new BadRequestError('This book loan has already been marked as returned.');
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE library_borrowings SET status = 'returned', returned_at = :now, returned_to = :returnedToId, updated_at = :now WHERE id = :id`,
      { id: borrowingId, now, returnedToId: returnedToId || null }
    );

    return {
      id: borrowingId,
      book_title: borrowing.book_title || 'Book',
      borrower_name: borrowing.borrower_name || 'Member',
      status: 'returned',
      returned_at: now,
      message: `"${borrowing.book_title || 'Book'}" has been marked as returned.`,
    };
  }

  async extendDueDate(borrowingId: string, additionalDays: number = 7) {
    const rows = await query<any[]>('SELECT * FROM library_borrowings WHERE id = :id LIMIT 1', { id: borrowingId });
    if (!rows || rows.length === 0) throw new NotFoundError('Borrowing record');
    const borrowing = rows[0];

    if (borrowing.returned_at) {
      throw new BadRequestError('Cannot extend loan for a book that has already been returned.');
    }

    const currentDue = new Date(borrowing.due_at || Date.now());
    const newDue = new Date(currentDue.getTime() + additionalDays * 86400000);

    await query(
      `UPDATE library_borrowings SET due_at = :newDue, notes = CONCAT(COALESCE(notes, ''), ' [Extended by ${additionalDays} days]'), updated_at = :now WHERE id = :id`,
      { id: borrowingId, newDue: newDue.toISOString(), now: new Date().toISOString() }
    );

    return {
      id: borrowingId,
      due_at: newDue.toISOString(),
      message: `Due date extended to ${newDue.toLocaleDateString()}.`,
    };
  }

  async getBorrowings(statusFilter?: string, search?: string): Promise<LibraryBorrowingRecord[]> {
    let sql = 'SELECT * FROM library_borrowings WHERE 1=1';
    const params: Record<string, any> = {};

    if (search && search.trim()) {
      sql += ' AND (book_title LIKE :search OR borrower_name LIKE :search OR borrower_email LIKE :search OR borrower_phone LIKE :search)';
      params.search = `%${search.trim()}%`;
    }

    sql += ' ORDER BY borrowed_at DESC';
    const rows = await query<any[]>(sql, params);
    const now = Date.now();

    const enriched = (rows || []).map((row) => {
      const isReturned = Boolean(row.returned_at || row.status === 'returned');
      const dueTime = row.due_at ? new Date(row.due_at).getTime() : now;
      const diffMs = dueTime - now;
      const diffDays = Math.round(diffMs / 86400000);

      let computedStatus: 'active' | 'overdue' | 'returned' = 'active';
      let isOverdue = false;
      let daysOverdue = 0;
      let daysRemaining = 0;
      let isDueSoon = false;

      if (isReturned) {
        computedStatus = 'returned';
      } else if (diffMs < 0) {
        computedStatus = 'overdue';
        isOverdue = true;
        daysOverdue = Math.abs(diffDays) === 0 ? 1 : Math.abs(diffDays);
      } else {
        computedStatus = 'active';
        daysRemaining = diffDays;
        isDueSoon = diffDays <= 3;
      }

      return {
        ...row,
        book_title: row.book_title || 'Christian Literature',
        borrower_name: row.borrower_name || row.user_name || 'Member',
        borrower_email: row.borrower_email || row.user_email || '',
        borrower_phone: row.borrower_phone || row.user_phone || '',
        status: computedStatus,
        is_overdue: isOverdue,
        days_overdue: daysOverdue,
        days_remaining: daysRemaining,
        is_due_soon: isDueSoon,
      };
    });

    if (statusFilter && statusFilter !== 'all') {
      return enriched.filter((b) => b.status === statusFilter);
    }

    return enriched;
  }

  async getMyBorrowings(userId: string): Promise<LibraryBorrowingRecord[]> {
    const rows = await query<any[]>(
      'SELECT * FROM library_borrowings WHERE user_id = :userId ORDER BY borrowed_at DESC',
      { userId }
    );
    const now = Date.now();

    return (rows || []).map((row) => {
      const isReturned = Boolean(row.returned_at || row.status === 'returned');
      const dueTime = row.due_at ? new Date(row.due_at).getTime() : now;
      const diffMs = dueTime - now;
      const diffDays = Math.round(diffMs / 86400000);

      let computedStatus: 'active' | 'overdue' | 'returned' = 'active';
      let isOverdue = false;
      let daysOverdue = 0;
      let daysRemaining = 0;
      let isDueSoon = false;

      if (isReturned) {
        computedStatus = 'returned';
      } else if (diffMs < 0) {
        computedStatus = 'overdue';
        isOverdue = true;
        daysOverdue = Math.abs(diffDays) === 0 ? 1 : Math.abs(diffDays);
      } else {
        computedStatus = 'active';
        daysRemaining = diffDays;
        isDueSoon = diffDays <= 3;
      }

      return {
        ...row,
        book_title: row.book_title || 'Christian Literature',
        borrower_name: row.borrower_name || row.user_name || 'Me',
        borrower_email: row.borrower_email || row.user_email || '',
        borrower_phone: row.borrower_phone || row.user_phone || '',
        status: computedStatus,
        is_overdue: isOverdue,
        days_overdue: daysOverdue,
        days_remaining: daysRemaining,
        is_due_soon: isDueSoon,
      };
    });
  }

  async getLibraryStats() {
    const allBorrowings = await this.getBorrowings('all');
    const digitalResources = await query<any[]>('SELECT COUNT(*) as total FROM library_resources');

    let booksOut = 0;
    let dueSoon = 0;
    let overdue = 0;
    let returned = 0;

    for (const b of allBorrowings) {
      if (b.status === 'returned') {
        returned++;
      } else if (b.status === 'overdue') {
        overdue++;
        booksOut++;
      } else {
        booksOut++;
        if (b.is_due_soon) {
          dueSoon++;
        }
      }
    }

    return {
      booksOut,
      dueSoon,
      overdue,
      returned,
      totalLoansRecorded: allBorrowings.length,
      totalDigitalResources: Number(digitalResources[0]?.total || 0),
    };
  }

  // =========================================================================
  // 3. SEARCH & AUTOCOMPLETE HELPERS
  // =========================================================================
  async searchBorrowers(q: string) {
    if (!q || q.trim().length < 1) {
      const rows = await query<any[]>(
        `SELECT id, full_name, email, phone_number, admission_number
         FROM users
         WHERE account_status = 'active' OR account_status IS NULL
         ORDER BY full_name ASC LIMIT 20`
      );
      return rows || [];
    }

    const term = `%${q.trim()}%`;
    const rows = await query<any[]>(
      `SELECT id, full_name, email, phone_number, admission_number
       FROM users
       WHERE (full_name LIKE :term OR email LIKE :term OR phone_number LIKE :term OR admission_number LIKE :term)
       ORDER BY full_name ASC LIMIT 20`,
      { term }
    );
    return rows || [];
  }

  async suggestBookTitles(q: string) {
    const term = q ? `%${q.trim()}%` : '%';
    const rows = await query<any[]>(
      `SELECT DISTINCT book_title
       FROM library_borrowings
       WHERE book_title LIKE :term
       ORDER BY book_title ASC LIMIT 15`,
      { term }
    );
    return (rows || []).map((r) => r.book_title).filter(Boolean);
  }
}

export const libraryService = new LibraryService();
