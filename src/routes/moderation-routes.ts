import { Router } from 'express';
import { moderationController } from '../controllers/moderation-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import {
  requireModerator,
  canBanMiddleware,
  canManageMiddleware,
} from '../middlewares/role-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  banUserSchema,
  unbanUserSchema,
  changeRoleSchema,
  uuidParamSchema,
  paginationSchema,
} from '../validators/moderation-validators';

const router: Router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// ==================== ROTAS DE BANIMENTO ====================

// Banir usuário (requer moderador ou superior + verificação de hierarquia)
router.post(
  '/bans/:userId',
  requireModerator,
  validate(uuidParamSchema, 'params'),
  validate(banUserSchema),
  canBanMiddleware,
  (req, res, next) => {
    moderationController.banUser(req, res, next);
  }
);

// Desbanir usuário (requer moderador ou superior + verificação de hierarquia)
router.delete(
  '/bans/:userId',
  requireModerator,
  validate(uuidParamSchema, 'params'),
  validate(unbanUserSchema),
  canBanMiddleware,
  (req, res, next) => {
    moderationController.unbanUser(req, res, next);
  }
);

// Listar usuários banidos (requer moderador ou superior)
router.get(
  '/bans',
  requireModerator,
  validate(paginationSchema, 'query'),
  (req, res, next) => {
    moderationController.listBannedUsers(req, res, next);
  }
);

// Histórico de banimentos de um usuário (requer moderador ou superior)
router.get(
  '/bans/history/:userId',
  requireModerator,
  validate(uuidParamSchema, 'params'),
  (req, res, next) => {
    moderationController.getUserBanHistory(req, res, next);
  }
);

// ==================== ROTAS DE MUDANÇA DE CARGO ====================

// Alterar cargo de usuário (requer verificação de hierarquia)
router.patch(
  '/roles/:userId',
  requireModerator,
  validate(uuidParamSchema, 'params'),
  validate(changeRoleSchema),
  canManageMiddleware,
  (req, res, next) => {
    moderationController.changeUserRole(req, res, next);
  }
);

// Histórico de mudanças de cargo de um usuário (requer moderador ou superior)
router.get(
  '/roles/history/:userId',
  requireModerator,
  validate(uuidParamSchema, 'params'),
  (req, res, next) => {
    moderationController.getUserRoleHistory(req, res, next);
  }
);

// Listar mudanças de cargo recentes (requer moderador ou superior)
router.get(
  '/roles/changes',
  requireModerator,
  validate(paginationSchema, 'query'),
  (req, res, next) => {
    moderationController.listRecentRoleChanges(req, res, next);
  }
);

// ==================== ESTATÍSTICAS ====================

// Estatísticas de moderação (requer moderador ou superior)
router.get(
  '/stats',
  requireModerator,
  (req, res, next) => {
    moderationController.getModerationStats(req, res, next);
  }
);

export default router;
