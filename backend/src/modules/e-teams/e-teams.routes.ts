import { Router } from 'express';
import { eteamsController } from './e-teams.controller';
import {
authenticate,
loadPermissions,
requireSuperAdmin,
requirePermission,
} from '../../middleware/auth.middleware';

const router = Router();

// Public / Member Views
router.get('/', eteamsController.listTeams);
router.get('/:id', eteamsController.getTeam);

// Protected actions (Chairperson Portal & Admin)
router.use(authenticate, loadPermissions);

// Technical Admin Center only: create/edit complete E-Team metadata.
// Chairpersons cannot use these endpoints.
router.post('/', requireSuperAdmin, eteamsController.createTeam);
router.put('/:id', requireSuperAdmin, eteamsController.updateTeam);

// Chairperson management routes (scoped within the service)
router.post('/:id/programmes', requirePermission('eteams.manage_programmes'), eteamsController.addProgramme);
router.put('/:id/programmes/:progId', requirePermission('eteams.manage_programmes'), eteamsController.updateProgramme);
router.delete('/:id/programmes/:progId', requirePermission('eteams.manage_programmes'), eteamsController.deleteProgramme);

router.post('/:id/announcements', requirePermission('eteams.manage_announcements'), eteamsController.addAnnouncement);
router.delete('/:id/announcements/:annId', requirePermission('eteams.manage_announcements'), eteamsController.deleteAnnouncement);

router.post('/:id/gallery', requirePermission('eteams.manage_gallery'), eteamsController.addPhoto);
router.delete('/:id/gallery/:photoId', requirePermission('eteams.manage_gallery'), eteamsController.deletePhoto);

router.post('/:id/reports', requirePermission('eteams.manage_reports'), eteamsController.addReport);

// Super Admin appointments
router.post('/:id/upload-image', requireSuperAdmin, eteamsController.uploadTeamImage);

router.post(
'/:id/appoint-chairperson',
requireSuperAdmin,
eteamsController.appointChairperson
);

export default router;
