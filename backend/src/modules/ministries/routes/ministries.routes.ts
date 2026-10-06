import { Router } from 'express';
import { ministriesController, ministryDetailsController } from '../controllers/ministries.controller';
import { authenticate, loadPermissions, requireAnyPermission, requirePermission, requireSuperAdmin, enforceScope } from '../../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', ministriesController.list);
router.get('/leader-portal', authenticate, loadPermissions, requireAnyPermission('ministries.view', 'ministries.manage_members', 'system.manage_roles'), ministryDetailsController.getLeaderPortal);
router.get('/:id/details', ministryDetailsController.get);
router.get('/:id/members', authenticate, loadPermissions, requireAnyPermission('ministries.manage_members', 'ministries.manage_all_members', 'system.manage_roles'), enforceScope('ministry', 'ministries.manage_all_members', (req) => req.params.id), ministryDetailsController.getMembers);
router.get('/:id/sessions', authenticate, loadPermissions, requireAnyPermission('ministries.manage_members', 'ministries.manage_all_members', 'system.manage_roles'), enforceScope('ministry', 'ministries.manage_all_members', (req) => req.params.id), ministryDetailsController.getSessions);
router.get('/:id', ministriesController.getById);

// Ministry leader / Admin actions
router.post('/:id/sessions', authenticate, loadPermissions, requireAnyPermission('ministries.manage_members', 'ministries.manage_all_members', 'system.manage_roles'), enforceScope('ministry', 'ministries.manage_all_members', (req) => req.params.id), ministryDetailsController.createSession);
router.post('/:id/assign-leader', authenticate, loadPermissions, requireSuperAdmin, ministryDetailsController.assignLeader);
router.put('/:id/background', authenticate, loadPermissions, requireAnyPermission('media.manage_ministries', 'ministries.edit', 'system.manage_roles'), enforceScope('ministry', 'ministries.manage_all_members', (req) => req.params.id), ministryDetailsController.updateBackground);
router.post('/:id/upload-photo', authenticate, loadPermissions, requireAnyPermission('media.manage_ministries', 'ministries.edit', 'system.manage_roles'), enforceScope('ministry', 'ministries.manage_all_members', (req) => req.params.id), ministryDetailsController.uploadPhoto);

// Full CRUD for Super Admin / authorized leaders
router.post('/', authenticate, loadPermissions, requireAnyPermission('ministries.create', 'system.manage_roles'), ministriesController.create);
router.put('/:id', authenticate, loadPermissions, requireAnyPermission('ministries.edit', 'media.manage_ministries', 'system.manage_roles'), ministriesController.update);
router.delete('/:id', authenticate, loadPermissions, requireAnyPermission('ministries.delete', 'system.manage_roles'), ministriesController.remove);

export default router;
