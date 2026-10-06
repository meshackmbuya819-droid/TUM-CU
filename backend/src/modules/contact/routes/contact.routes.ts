import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contactController } from '../controllers/contact.controller';
import { validate } from '../../../middleware/validate.middleware';
import { contactValidators } from '../validators/contact.validator';
import { authenticate, loadPermissions, requirePermission } from '../../../middleware/auth.middleware';

const router=Router();
const publicLimiter=rateLimit({windowMs:15*60*1000,max:20,standardHeaders:true,legacyHeaders:false});
router.post('/',publicLimiter,validate({ body: contactValidators.create }),contactController.create);
router.use(authenticate,loadPermissions,requirePermission('communication.view'));
router.get('/',contactController.list);
router.put('/:id',requirePermission('communication.edit'),validate({ body: contactValidators.update }),contactController.update);
export default router;
