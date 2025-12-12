import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { likeRepository } from '../repositories/like-repository';
import { threadRepository } from '../repositories/thread-repository';
import { postRepository } from '../repositories/post-repository';
import {
  ToggleThreadLikeInput,
  TogglePostLikeInput,
  ListThreadLikesInput,
  ListPostLikesInput,
  GetThreadLikeStatusInput,
  GetPostLikeStatusInput,
} from '../validators/like-validators';

export class LikeController {
  // ==================== LIKES EM THREADS ====================

  /**
   * Curtir/Descurtir thread (toggle)
   */
  async toggleThreadLike(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId }: ToggleThreadLikeInput['params'] = req.params as any;
      const userId = req.user!.id;

      // Verificar se thread existe
      const thread = await threadRepository.getById(threadId);
      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      // Toggle like
      const hasLiked = await likeRepository.toggleThreadLike(threadId, userId);

      // Buscar status atualizado
      const status = await likeRepository.getThreadLikeStatus(threadId, userId);

      sendSuccess(res, {
        hasLiked: status.hasLiked,
        likeCount: status.likeCount,
        message: hasLiked ? 'Thread curtida' : 'Like removido',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter status de like da thread
   */
  async getThreadLikeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId }: GetThreadLikeStatusInput['params'] = req.params as any;
      const userId = req.user?.id;

      // Verificar se thread existe
      const thread = await threadRepository.getById(threadId);
      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      const status = await likeRepository.getThreadLikeStatus(threadId, userId);

      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar usuários que curtiram thread
   */
  async listThreadLikes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId }: ListThreadLikesInput['params'] = req.params as any;
      const { limit, offset }: ListThreadLikesInput['query'] = req.query as any;

      // Verificar se thread existe
      const thread = await threadRepository.getById(threadId);
      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      const likes = await likeRepository.getThreadLikes(threadId, limit || 50, offset || 0);
      const total = await likeRepository.countThreadLikes(threadId);

      sendSuccess(res, {
        likes,
        pagination: {
          total,
          limit: limit || 50,
          offset: offset || 0,
          hasMore: (offset || 0) + (limit || 50) < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LIKES EM POSTS ====================

  /**
   * Curtir/Descurtir post (toggle)
   */
  async togglePostLike(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: TogglePostLikeInput['params'] = req.params as any;
      const userId = req.user!.id;

      // Verificar se post existe
      const post = await postRepository.getById(postId);
      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      // Toggle like
      const hasLiked = await likeRepository.togglePostLike(postId, userId);

      // Buscar status atualizado
      const status = await likeRepository.getPostLikeStatus(postId, userId);

      sendSuccess(res, {
        hasLiked: status.hasLiked,
        likeCount: status.likeCount,
        message: hasLiked ? 'Post curtido' : 'Like removido',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter status de like do post
   */
  async getPostLikeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: GetPostLikeStatusInput['params'] = req.params as any;
      const userId = req.user?.id;

      // Verificar se post existe
      const post = await postRepository.getById(postId);
      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      const status = await likeRepository.getPostLikeStatus(postId, userId);

      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar usuários que curtiram post
   */
  async listPostLikes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: ListPostLikesInput['params'] = req.params as any;
      const { limit, offset }: ListPostLikesInput['query'] = req.query as any;

      // Verificar se post existe
      const post = await postRepository.getById(postId);
      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      const likes = await likeRepository.getPostLikes(postId, limit || 50, offset || 0);
      const total = await likeRepository.countPostLikes(postId);

      sendSuccess(res, {
        likes,
        pagination: {
          total,
          limit: limit || 50,
          offset: offset || 0,
          hasMore: (offset || 0) + (limit || 50) < total,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const likeController = new LikeController();
