import { Router } from 'express';
import { likeController } from '../controllers/like-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  toggleThreadLikeSchema,
  togglePostLikeSchema,
  listThreadLikesSchema,
  listPostLikesSchema,
  getThreadLikeStatusSchema,
  getPostLikeStatusSchema,
} from '../validators/like-validators';

const router: Router = Router();

// ==================== ROTAS PÚBLICAS ====================

// Status de like da thread (pública)
router.get(
  '/threads/:threadId/status',
  validate(getThreadLikeStatusSchema),
  (req, res, next) => {
    likeController.getThreadLikeStatus(req, res, next);
  }
);

// Listar usuários que curtiram thread (pública)
router.get('/threads/:threadId', validate(listThreadLikesSchema), (req, res, next) => {
  likeController.listThreadLikes(req, res, next);
});

// Status de like do post (pública)
router.get('/posts/:postId/status', validate(getPostLikeStatusSchema), (req, res, next) => {
  likeController.getPostLikeStatus(req, res, next);
});

// Listar usuários que curtiram post (pública)
router.get('/posts/:postId', validate(listPostLikesSchema), (req, res, next) => {
  likeController.listPostLikes(req, res, next);
});

// ==================== ROTAS AUTENTICADAS ====================
// Requerem autenticação

router.use(authMiddleware);

// Curtir/Descurtir thread (toggle)
router.post('/threads/:threadId', validate(toggleThreadLikeSchema), (req, res, next) => {
  likeController.toggleThreadLike(req, res, next);
});

// Curtir/Descurtir post (toggle)
router.post('/posts/:postId', validate(togglePostLikeSchema), (req, res, next) => {
  likeController.togglePostLike(req, res, next);
});

export default router;
