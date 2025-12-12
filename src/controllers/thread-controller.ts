import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { threadRepository } from '../repositories/thread-repository';
import { categoryRepository } from '../repositories/category-repository';
import {
  CreateThreadInput,
  UpdateThreadInput,
  UpdateThreadStatusInput,
  ListThreadsInput,
  GetThreadByIdInput,
  GetThreadBySlugInput,
  DeleteThreadInput,
} from '../validators/thread-validators';
import { THREAD_TEMPLATE_PERMISSIONS } from '../types/thread.types';

// Função auxiliar para gerar slug a partir do título
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

export class ThreadController {
  // ==================== CRIAR THREAD ====================

  async createThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, template, title, content }: CreateThreadInput['body'] = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // 1. Verificar se categoria existe
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw ApiError.notFound('Categoria não encontrada');
      }

      // 2. Verificar se categoria está bloqueada
      const isLocked = await threadRepository.isCategoryLocked(categoryId);
      if (isLocked) {
        throw ApiError.forbidden('Esta categoria está bloqueada para novos threads');
      }

      // 3. Verificar permissão para criar thread com este template
      const allowedRoles = THREAD_TEMPLATE_PERMISSIONS[template];
      if (!allowedRoles.includes(userRole)) {
        throw ApiError.forbidden(
          `Seu cargo (${userRole}) não tem permissão para criar threads do tipo "${template}". Cargos permitidos: ${allowedRoles.join(', ')}`
        );
      }

      // 4. Gerar slug único
      const baseSlug = generateSlug(title);
      let slug = baseSlug;
      let counter = 1;

      // Verificar se slug já existe na categoria
      while (await threadRepository.getBySlug(categoryId, slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 5. Criar thread
      const thread = await threadRepository.create({
        categoryId,
        authorId: userId,
        template,
        title,
        slug,
        content,
      });

      sendSuccess(
        res,
        {
          thread,
          message: 'Thread criada com sucesso',
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== LISTAR THREADS ====================

  async listThreads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ListThreadsInput['query'] = req.query as any;

      // Buscar threads
      const threads = await threadRepository.list(query);

      // Contar total
      const total = await threadRepository.count(query);

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      sendSuccess(res, {
        threads,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUSCAR THREAD POR ID ====================

  async getThreadById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId }: GetThreadByIdInput['params'] = req.params as any;

      const thread = await threadRepository.getByIdWithDetails(threadId);

      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      // Incrementar visualizações
      await threadRepository.incrementViews(threadId);

      sendSuccess(res, { thread });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUSCAR THREAD POR SLUG ====================

  async getThreadBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, slug }: GetThreadBySlugInput['params'] = req.params as any;

      const thread = await threadRepository.getBySlug(categoryId, slug);

      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      // Incrementar visualizações
      await threadRepository.incrementViews(thread.id);

      sendSuccess(res, { thread });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ATUALIZAR THREAD ====================

  async updateThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId }: UpdateThreadInput['params'] = req.params as any;
      const { title, content, status }: UpdateThreadInput['body'] = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar se thread existe
      const existingThread = await threadRepository.getById(threadId);
      if (!existingThread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      // Verificar se é o autor ou moderador+
      const isAuthor = await threadRepository.isAuthor(threadId, userId);
      const isModerator = ['moderador', 'admin', 'master'].includes(userRole);

      if (!isAuthor && !isModerator) {
        throw ApiError.forbidden('Você não tem permissão para editar esta thread');
      }

      // Se não for moderador+, não pode alterar status
      if (status && !isModerator) {
        throw ApiError.forbidden('Apenas moderadores podem alterar o status da thread');
      }

      // Gerar novo slug se título mudou
      let slug = existingThread.slug;
      if (title && title !== existingThread.title) {
        const baseSlug = generateSlug(title);
        slug = baseSlug;
        let counter = 1;

        while (await threadRepository.getBySlug(existingThread.category_id, slug)) {
          if (slug === existingThread.slug) break; // Se é o próprio slug, pode usar
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }

      // Atualizar thread
      const thread = await threadRepository.update(threadId, {
        title,
        slug: title ? slug : undefined,
        content,
        status,
      });

      sendSuccess(res, {
        thread,
        message: 'Thread atualizada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== FIXAR/DESFIXAR THREAD ====================

  async togglePinThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId } = req.params;
      const userRole = req.user!.role;

      // Apenas moderadores+ podem fixar threads
      if (!['moderador', 'admin', 'master'].includes(userRole)) {
        throw ApiError.forbidden('Apenas moderadores podem fixar threads');
      }

      const existingThread = await threadRepository.getById(threadId);
      if (!existingThread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      const thread = await threadRepository.update(threadId, {
        isPinned: !existingThread.is_pinned,
      });

      sendSuccess(res, {
        thread,
        message: existingThread.is_pinned ? 'Thread desfixada' : 'Thread fixada no topo',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BLOQUEAR/DESBLOQUEAR THREAD ====================

  async toggleLockThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId } = req.params;
      const userRole = req.user!.role;

      // Apenas moderadores+ podem bloquear threads
      if (!['moderador', 'admin', 'master'].includes(userRole)) {
        throw ApiError.forbidden('Apenas moderadores podem bloquear threads');
      }

      const existingThread = await threadRepository.getById(threadId);
      if (!existingThread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      const thread = await threadRepository.update(threadId, {
        isLocked: !existingThread.is_locked,
      });

      sendSuccess(res, {
        thread,
        message: existingThread.is_locked
          ? 'Thread desbloqueada. Novas respostas permitidas.'
          : 'Thread bloqueada. Novas respostas não são permitidas.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== DELETAR THREAD ====================

  async deleteThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId }: DeleteThreadInput['params'] = req.params as any;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar se thread existe
      const thread = await threadRepository.getById(threadId);
      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      // Verificar se é o autor ou moderador+
      const isAuthor = await threadRepository.isAuthor(threadId, userId);
      const isModerator = ['moderador', 'admin', 'master'].includes(userRole);

      if (!isAuthor && !isModerator) {
        throw ApiError.forbidden('Você não tem permissão para deletar esta thread');
      }

      // Deletar thread
      await threadRepository.delete(threadId);

      sendSuccess(res, {
        message: 'Thread deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ARQUIVAR THREAD ====================

  async archiveThread(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId } = req.params;
      const userRole = req.user!.role;

      // Apenas moderadores+ podem arquivar threads
      if (!['moderador', 'admin', 'master'].includes(userRole)) {
        throw ApiError.forbidden('Apenas moderadores podem arquivar threads');
      }

      const thread = await threadRepository.update(threadId, {
        status: 'archived',
      });

      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      sendSuccess(res, {
        thread,
        message: 'Thread arquivada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const threadController = new ThreadController();
