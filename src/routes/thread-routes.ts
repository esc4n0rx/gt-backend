import { Router } from 'express';
import { threadController } from '../controllers/thread-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { requireModerator } from '../middlewares/role-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  createThreadSchema,
  updateThreadSchema,
  listThreadsSchema,
  getThreadByIdSchema,
  getThreadBySlugSchema,
  deleteThreadSchema,
  togglePinThreadSchema,
  toggleLockThreadSchema,
} from '../validators/thread-validators';

const router: Router = Router();

// ==================== ROTAS PÚBLICAS ====================

// Listar threads (pública)
router.get('/', validate(listThreadsSchema), (req, res, next) => {
  threadController.listThreads(req, res, next);
});

// Buscar thread por ID (pública)
router.get('/:threadId', validate(getThreadByIdSchema), (req, res, next) => {
  threadController.getThreadById(req, res, next);
});

// Buscar thread por slug dentro de uma categoria (pública)
router.get('/category/:categoryId/slug/:slug', validate(getThreadBySlugSchema), (req, res, next) => {
  threadController.getThreadBySlug(req, res, next);
});

// ==================== ROTAS AUTENTICADAS ====================
// Requerem autenticação

router.use(authMiddleware);

// Criar nova thread (requer autenticação + permissão específica por template)
router.post('/', validate(createThreadSchema), (req, res, next) => {
  threadController.createThread(req, res, next);
});

// Atualizar thread (autor ou moderador+)
router.patch('/:threadId', validate(updateThreadSchema), (req, res, next) => {
  threadController.updateThread(req, res, next);
});

// Deletar thread (autor ou moderador+)
router.delete('/:threadId', validate(deleteThreadSchema), (req, res, next) => {
  threadController.deleteThread(req, res, next);
});

// ==================== ROTAS ADMINISTRATIVAS ====================
// Requerem moderador+

// Fixar/Desfixar thread
router.patch(
  '/:threadId/toggle-pin',
  requireModerator,
  validate(togglePinThreadSchema),
  (req, res, next) => {
    threadController.togglePinThread(req, res, next);
  }
);

// Bloquear/Desbloquear thread
router.patch(
  '/:threadId/toggle-lock',
  requireModerator,
  validate(toggleLockThreadSchema),
  (req, res, next) => {
    threadController.toggleLockThread(req, res, next);
  }
);

// Arquivar thread
router.patch('/:threadId/archive', requireModerator, (req, res, next) => {
  threadController.archiveThread(req, res, next);
});

export default router;
