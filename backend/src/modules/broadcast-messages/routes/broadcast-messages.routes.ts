import { Router } from 'express';
import { broadcastMessagesController } from '../controllers/broadcast-messages.controller';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router = Router();

// Public announcements
router.get('/public', broadcastMessagesController.list);
router.get('/', broadcastMessagesController.list);
router.get('/:id', broadcastMessagesController.getById);

// Admin actions
router.post('/announcement', authenticate, loadPermissions, requirePermission('communication.create'), broadcastMessagesController.sendOfficialAnnouncement);
router.post('/', authenticate, loadPermissions, requirePermission('communication.create'), broadcastMessagesController.create);
router.put('/:id', authenticate, loadPermissions, requirePermission('communication.edit'), broadcastMessagesController.update);
router.delete('/:id', authenticate, loadPermissions, requirePermission('communication.delete'), broadcastMessagesController.remove);

export default router;
