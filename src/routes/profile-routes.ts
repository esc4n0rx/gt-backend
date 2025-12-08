import { Router } from 'express';
import { profileController } from '../controllers/profile-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import { uploadSingle } from '../middlewares/upload-middleware';
import {
  updateProfileSchema,
  requestEmailChangeSchema,
  confirmEmailChangeSchema,
  requestPasswordChangeSchema,
  confirmPasswordChangeSchema,
} from '../validators/profile-validators';

const router: Router = Router();

/**
 * Todas as rotas de perfil requerem autenticação
 */
router.use(authMiddleware);

/**
 * GET /api/v1/profile
 * Busca perfil do usuário autenticado
 */
router.get('/', profileController.getProfile.bind(profileController));

/**
 * PATCH /api/v1/profile
 * Atualiza nome e/ou bio
 */
router.patch(
  '/',
  validate(updateProfileSchema),
  profileController.updateProfile.bind(profileController)
);

/**
 * POST /api/v1/profile/avatar
 * Upload de avatar
 */
router.post(
  '/avatar',
  uploadSingle,
  profileController.updateAvatar.bind(profileController)
);

/**
 * POST /api/v1/profile/banner
 * Upload de banner
 */
router.post(
  '/banner',
  uploadSingle,
  profileController.updateBanner.bind(profileController)
);

/**
 * POST /api/v1/profile/signature
 * Upload de assinatura
 */
router.post(
  '/signature',
  uploadSingle,
  profileController.updateSignature.bind(profileController)
);

/**
 * DELETE /api/v1/profile/signature
 * Remove assinatura
 */
router.delete(
  '/signature',
  profileController.removeSignature.bind(profileController)
);

/**
 * POST /api/v1/profile/email/request
 * Solicita alteração de email
 */
router.post(
  '/email/request',
  validate(requestEmailChangeSchema),
  profileController.requestEmailChange.bind(profileController)
);

/**
 * POST /api/v1/profile/email/confirm
 * Confirma alteração de email
 */
router.post(
  '/email/confirm',
  validate(confirmEmailChangeSchema),
  profileController.confirmEmailChange.bind(profileController)
);

/**
 * POST /api/v1/profile/password/request
 * Solicita alteração de senha
 */
router.post(
  '/password/request',
  validate(requestPasswordChangeSchema),
  profileController.requestPasswordChange.bind(profileController)
);

/**
 * POST /api/v1/profile/password/confirm
 * Confirma alteração de senha
 */
router.post(
  '/password/confirm',
  validate(confirmPasswordChangeSchema),
  profileController.confirmPasswordChange.bind(profileController)
);

export default router;
