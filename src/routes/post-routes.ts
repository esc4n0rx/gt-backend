import { Router } from 'express';
import { postController } from '../controllers/post-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  createPostSchema,
  updatePostSchema,
  listPostsSchema,
  getPostByIdSchema,
  deletePostSchema,
  getPostRepliesSchema,
} from '../validators/post-validators';

const router: Router = Router();

// ==================== ROTAS PÚBLICAS ====================

// Listar posts de uma thread (pública - query param threadId obrigatório)
router.get('/', validate(listPostsSchema), (req, res, next) => {
  postController.listPosts(req, res, next);
});

// Buscar post por ID (pública)
router.get('/:postId', validate(getPostByIdSchema), (req, res, next) => {
  postController.getPostById(req, res, next);
});

// Buscar respostas de um post (pública)
router.get('/:postId/replies', validate(getPostRepliesSchema), (req, res, next) => {
  postController.getPostReplies(req, res, next);
});

// ==================== ROTAS AUTENTICADAS ====================
// Requerem autenticação

router.use(authMiddleware);

// Criar post (requer autenticação)
router.post('/', validate(createPostSchema), (req, res, next) => {
  postController.createPost(req, res, next);
});

// Atualizar post (autor ou moderador+)
router.patch('/:postId', validate(updatePostSchema), (req, res, next) => {
  postController.updatePost(req, res, next);
});

// Deletar post (autor ou moderador+)
router.delete('/:postId', validate(deletePostSchema), (req, res, next) => {
  postController.deletePost(req, res, next);
});

export default router;
