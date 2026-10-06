import { Router } from 'express';
import { bibleStudyGroupsController } from '../controllers/bible-study-groups.controller';
import { authenticate, loadPermissions, requireAnyPermission } from '../../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, loadPermissions);

// Read routes
router.get(
  '/candidates',
  requireAnyPermission('discipleship.view', 'leadership.view', 'membership.view_all'),
  bibleStudyGroupsController.getCandidates
);

router.get(
  '/export/excel',
  requireAnyPermission('discipleship.view', 'leadership.view', 'reports.view'),
  bibleStudyGroupsController.exportExcel
);

router.get(
  '/',
  requireAnyPermission('discipleship.view', 'leadership.view', 'membership.view_all'),
  bibleStudyGroupsController.list
);

router.get(
  '/:id',
  requireAnyPermission('discipleship.view', 'leadership.view', 'membership.view_all'),
  bibleStudyGroupsController.getById
);

// Creation & balancing routes
router.post(
  '/auto-balance',
  requireAnyPermission(
    'discipleship.create',
    'discipleship.edit',
    'leadership.assign',
    'system.manage_roles'
  ),
  bibleStudyGroupsController.autoBalance
);

router.post(
  '/batch-save',
  requireAnyPermission(
    'discipleship.create',
    'discipleship.edit',
    'leadership.assign',
    'system.manage_roles'
  ),
  bibleStudyGroupsController.batchSave
);

router.put(
  '/:id',
  requireAnyPermission(
    'discipleship.edit',
    'leadership.assign',
    'system.manage_roles'
  ),
  bibleStudyGroupsController.update
);

router.delete(
  '/:id',
  requireAnyPermission(
    'discipleship.delete',
    'leadership.assign',
    'system.manage_roles'
  ),
  bibleStudyGroupsController.remove
);

export default router;
