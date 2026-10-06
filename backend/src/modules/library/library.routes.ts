import { Router } from 'express';
import { libraryController } from './library.controller';
import { authenticate, loadPermissions } from '../../middleware/auth.middleware';

const router = Router();

// Public / Member: E-Library Catalog View
router.get('/resources', libraryController.listResources);
router.get('/resources/:id', libraryController.getResource);

// Authenticated Routes
router.use(authenticate);

// Member: Personal Borrowings
router.get('/my-borrowings', libraryController.getMyBorrowings);
router.get('/my-requests', libraryController.getMyRequests);

// Librarian / Admin Routes
router.use(loadPermissions);

// E-Library Management
router.post('/resources', libraryController.createResource);
router.put('/resources/:id', libraryController.updateResource);
router.delete('/resources/:id', libraryController.deleteResource);

// Physical Lending Register
router.get('/borrowings', libraryController.getBorrowings);
router.post('/borrowings', libraryController.recordLoan);
router.post('/checkout', libraryController.checkout);
router.post('/borrowings/:id/return', libraryController.returnBook);
router.post('/borrowings/:id/extend', libraryController.extendDueDate);

// Search & Autocomplete
router.get('/members/search', libraryController.searchBorrowers);
router.get('/titles/suggest', libraryController.suggestTitles);

// Reports & Statistics
router.get('/reports/stats', libraryController.getStats);
router.get('/stats', libraryController.getStats);

export default router;
