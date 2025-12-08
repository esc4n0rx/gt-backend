import { Router } from 'express';
import { categoryController } from '../controllers/category-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { requireAdmin } from '../middlewares/role-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryIdParamSchema,
  categorySlugParamSchema,
} from '../validators/category-validators';

const router: Router = Router();

// ==================== ROTAS PÚBLICAS ====================

// Obter árvore completa de categorias (pública)
router.get('/tree', (req, res, next) => {
  categoryController.getCategoryTree(req, res, next);
});

// Listar categorias raiz (pública)
router.get('/root', (req, res, next) => {
  categoryController.getRootCategories(req, res, next);
});

// Listar todas as categorias flat (pública)
router.get('/', (req, res, next) => {
  categoryController.getAllCategories(req, res, next);
});

// Buscar categoria por slug (pública)
router.get('/slug/:slug', validate(categorySlugParamSchema, 'params'), (req, res, next) => {
  categoryController.getCategoryBySlug(req, res, next);
});

// Buscar categoria por ID (pública)
router.get('/:categoryId', validate(categoryIdParamSchema, 'params'), (req, res, next) => {
  categoryController.getCategoryById(req, res, next);
});

// ==================== ROTAS ADMINISTRATIVAS ====================
// Requerem autenticação e cargo de Admin ou Master

router.use(authMiddleware);
router.use(requireAdmin);

// Criar nova categoria
router.post('/', validate(createCategorySchema), (req, res, next) => {
  categoryController.createCategory(req, res, next);
});

// Atualizar categoria
router.patch(
  '/:categoryId',
  validate(categoryIdParamSchema, 'params'),
  validate(updateCategorySchema),
  (req, res, next) => {
    categoryController.updateCategory(req, res, next);
  }
);

// Deletar categoria
router.delete(
  '/:categoryId',
  validate(categoryIdParamSchema, 'params'),
  (req, res, next) => {
    categoryController.deleteCategory(req, res, next);
  }
);

// Reordenar categorias
router.put('/reorder', validate(reorderCategoriesSchema), (req, res, next) => {
  categoryController.reorderCategories(req, res, next);
});

// Bloquear/Desbloquear categoria
router.patch(
  '/:categoryId/toggle-lock',
  validate(categoryIdParamSchema, 'params'),
  (req, res, next) => {
    categoryController.toggleLockCategory(req, res, next);
  }
);

export default router;
