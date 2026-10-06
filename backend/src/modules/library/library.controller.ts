import { Request, Response } from 'express';
import { libraryService } from './library.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';
import { BadRequestError } from '../../utils/errors';

export const libraryController = {
  // Public / Member: Browse E-Library Catalog
  listResources: asyncHandler(async (req: Request, res: Response) => {
    const { category, search } = req.query;
    const resources = await libraryService.getResources({
      category: category as string,
      search: search as string,
    });
    return sendSuccess(res, resources, 'E-library resources retrieved');
  }),

  getResource: asyncHandler(async (req: Request, res: Response) => {
    const resource = await libraryService.getResourceById(req.params.id);
    return sendSuccess(res, resource, 'E-library resource details');
  }),

  // Admin / Librarian: Manage E-Library
  createResource: asyncHandler(async (req: Request, res: Response) => {
    if (!req.body.title) {
      throw new BadRequestError('Book title is required');
    }
    const created = await libraryService.createResource(req.body);
    return sendSuccess(res, created, 'Book added to E-Library', 201);
  }),

  updateResource: asyncHandler(async (req: Request, res: Response) => {
    const updated = await libraryService.updateResource(req.params.id, req.body);
    return sendSuccess(res, updated, 'E-Library resource updated successfully');
  }),

  deleteResource: asyncHandler(async (req: Request, res: Response) => {
    await libraryService.deleteResource(req.params.id);
    return sendSuccess(res, null, 'Resource removed from E-Library');
  }),

  // Member: View Personal Borrowing History
  getMyBorrowings: asyncHandler(async (req: Request, res: Response) => {
    const data = await libraryService.getMyBorrowings(req.user!.sub);
    return sendSuccess(res, data, 'Personal borrowing records retrieved');
  }),

  // Backward compatibility alias for getMyBorrowings
  getMyRequests: asyncHandler(async (req: Request, res: Response) => {
    const borrowings = await libraryService.getMyBorrowings(req.user!.sub);
    return sendSuccess(res, { borrowings, reservations: [] }, 'Personal borrowing records retrieved');
  }),

  // Librarian: Record Physical Book Loan
  recordLoan: asyncHandler(async (req: Request, res: Response) => {
    const { book_title, user_id, due_at, due_days, notes, resource_id } = req.body;
    if (!book_title && !resource_id) {
      throw new BadRequestError('Physical book title is required');
    }
    if (!user_id) {
      throw new BadRequestError('Borrowing member must be selected from registered members');
    }

    const result = await libraryService.checkoutBook({
      book_title,
      resource_id,
      user_id,
      due_at,
      due_days: Number(due_days) || 14,
      notes,
      librarian_id: req.user!.sub,
    });
    return sendSuccess(res, result, result.message, 201);
  }),

  // Alias for backward compatibility
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const { book_title, user_id, due_at, due_days, notes, resource_id } = req.body;
    const result = await libraryService.checkoutBook({
      book_title,
      resource_id,
      user_id,
      due_at,
      due_days: Number(due_days) || 14,
      notes,
      librarian_id: req.user!.sub,
    });
    return sendSuccess(res, result, result.message, 201);
  }),

  // Librarian: Record Return
  returnBook: asyncHandler(async (req: Request, res: Response) => {
    const result = await libraryService.returnBook(req.params.id, req.user!.sub);
    return sendSuccess(res, result, result.message);
  }),

  // Librarian: Extend Loan Due Date
  extendDueDate: asyncHandler(async (req: Request, res: Response) => {
    const { days = 7 } = req.body;
    const result = await libraryService.extendDueDate(req.params.id, Number(days));
    return sendSuccess(res, result, result.message);
  }),

  // Librarian: View Borrowing Register
  getBorrowings: asyncHandler(async (req: Request, res: Response) => {
    const { status, search } = req.query;
    const borrowings = await libraryService.getBorrowings(status as string, search as string);
    return sendSuccess(res, borrowings, 'Borrowing register records retrieved');
  }),

  // Librarian: Summary Statistics
  getStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await libraryService.getLibraryStats();
    return sendSuccess(res, stats, 'Library statistics retrieved');
  }),

  // Librarian: Member Search for Borrowing
  searchBorrowers: asyncHandler(async (req: Request, res: Response) => {
    const { q = '' } = req.query;
    const members = await libraryService.searchBorrowers(String(q));
    return sendSuccess(res, members, 'Matching registered members');
  }),

  // Librarian: Book Title Suggestions
  suggestTitles: asyncHandler(async (req: Request, res: Response) => {
    const { q = '' } = req.query;
    const titles = await libraryService.suggestBookTitles(String(q));
    return sendSuccess(res, titles, 'Previous book title suggestions');
  }),
};
