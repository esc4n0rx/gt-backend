import { Router } from 'express';
import { adminController } from '../controllers/admin-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { adminMiddleware } from '../middlewares/admin-middleware';
import { validate } from '../middlewares/validate-middleware';
import { toggleInviteRequirementSchema } from '../validators/admin-validators';

const router: Router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/settings', (req, res, next) => {
  adminController.getSettings(req, res, next);
});

router.get('/settings/registration', (req, res, next) => {
  adminController.getRegistrationSettings(req, res, next);
});

router.put(
  '/settings/registration',
  validate(toggleInviteRequirementSchema),
  (req, res, next) => {
    adminController.toggleInviteRequirement(req, res, next);
  }
);

export default router;