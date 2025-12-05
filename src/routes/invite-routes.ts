import { Router } from 'express';
import { inviteController } from '../controllers/invite-controller';
import { authMiddleware } from '../middlewares/auth-middleware';

const router: Router = Router();

// GET /api/v1/invites/status - Status do registro (público)
router.get('/status', (req, res, next) => {
  inviteController.getRegistrationStatus(req, res, next);
});

// GET /api/v1/invites/validate/:code - Validar código (público)
router.get('/validate/:code', (req, res, next) => {
  inviteController.validateInviteCode(req, res, next);
});

// GET /api/v1/invites/my - Listar meus códigos (autenticado)
router.get('/my', authMiddleware, (req, res, next) => {
  inviteController.getMyInviteCodes(req, res, next);
});

export default router;