import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { categoryRepository } from '../repositories/category-repository';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
} from '../validators/category-validators';

export class CategoryController {
  // ==================== CRIAR CATEGORIA ====================

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateCategoryInput = req.body;

      // Verificar se slug já existe
      const slugExists = await categoryRepository.slugExists(data.slug);
      if (slugExists) {
        throw ApiError.conflict('Slug já está em uso');
      }

      // Se tem parent_id, verificar se existe e se não excede nível máximo
      if (data.parentId) {
        const parent = await categoryRepository.findById(data.parentId);
        if (!parent) {
          throw ApiError.notFound('Categoria pai não encontrada');
        }

        // Verificar nível (máximo 2)
        if (parent.level >= 2) {
          throw ApiError.badRequest('Não é permitido criar subcategorias além do nível 2');
        }
      }

      const category = await categoryRepository.create({
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        displayOrder: data.displayOrder || 0,
        isLocked: data.isLocked || false,
        icon: data.icon,
      });

      sendSuccess(res, {
        category,
        message: 'Categoria criada com sucesso',
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // ==================== LISTAR ÁRVORE COMPLETA ====================

  async getCategoryTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await categoryRepository.getTree();

      sendSuccess(res, {
        tree,
        totalCategories: await categoryRepository.count(),
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LISTAR CATEGORIAS RAIZ ====================

  async getRootCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryRepository.findRootCategories();

      sendSuccess(res, {
        categories,
        count: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUSCAR CATEGORIA POR ID ====================

  async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;

      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw ApiError.notFound('Categoria não encontrada');
      }

      // Buscar subcategorias
      const subcategories = await categoryRepository.findByParentId(categoryId);

      sendSuccess(res, {
        category,
        subcategories,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUSCAR CATEGORIA POR SLUG ====================

  async getCategoryBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params;

      const category = await categoryRepository.findBySlug(slug);
      if (!category) {
        throw ApiError.notFound('Categoria não encontrada');
      }

      // Buscar subcategorias
      const subcategories = await categoryRepository.findByParentId(category.id);

      sendSuccess(res, {
        category,
        subcategories,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ATUALIZAR CATEGORIA ====================

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const data: UpdateCategoryInput = req.body;

      // Verificar se categoria existe
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw ApiError.notFound('Categoria não encontrada');
      }

      // Se está atualizando slug, verificar se já existe
      if (data.slug && data.slug !== category.slug) {
        const slugExists = await categoryRepository.slugExists(data.slug, categoryId);
        if (slugExists) {
          throw ApiError.conflict('Slug já está em uso');
        }
      }

      const updatedCategory = await categoryRepository.update(categoryId, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        displayOrder: data.displayOrder,
        isLocked: data.isLocked,
        icon: data.icon,
      });

      sendSuccess(res, {
        category: updatedCategory,
        message: 'Categoria atualizada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== DELETAR CATEGORIA ====================

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;

      // Verificar se categoria existe
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw ApiError.notFound('Categoria não encontrada');
      }

      // Verificar se tem subcategorias
      const hasSubcategories = await categoryRepository.hasSubcategories(categoryId);
      if (hasSubcategories) {
        throw ApiError.badRequest('Não é possível deletar categoria com subcategorias. Delete as subcategorias primeiro.');
      }

      // Verificar se tem threads (será validado pelo trigger SQL também)
      const hasThreads = await categoryRepository.hasThreads(categoryId);
      if (hasThreads) {
        const threadCount = category.thread_count;
        throw ApiError.badRequest(`Não é possível deletar categoria com ${threadCount} thread(s) existente(s)`);
      }

      // Deletar categoria
      await categoryRepository.delete(categoryId);

      sendSuccess(res, {
        message: 'Categoria deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== REORDENAR CATEGORIAS ====================

  async reorderCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: ReorderCategoriesInput = req.body;

      // Atualizar ordem de cada categoria
      const updatePromises = data.categories.map((item) =>
        categoryRepository.updateDisplayOrder(item.id, item.displayOrder)
      );

      await Promise.all(updatePromises);

      sendSuccess(res, {
        message: 'Categorias reordenadas com sucesso',
        updated: data.categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BLOQUEAR/DESBLOQUEAR CATEGORIA ====================

  async toggleLockCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;

      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw ApiError.notFound('Categoria não encontrada');
      }

      const updatedCategory = await categoryRepository.update(categoryId, {
        isLocked: !category.is_locked,
      });

      sendSuccess(res, {
        category: updatedCategory,
        message: updatedCategory.is_locked
          ? 'Categoria bloqueada. Novos threads não podem ser criados.'
          : 'Categoria desbloqueada. Novos threads podem ser criados.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LISTAR TODAS AS CATEGORIAS (FLAT) ====================

  async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryRepository.findAll();

      sendSuccess(res, {
        categories,
        count: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
