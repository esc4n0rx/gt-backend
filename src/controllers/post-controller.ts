import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { postRepository } from '../repositories/post-repository';
import { threadRepository } from '../repositories/thread-repository';
import {
  CreatePostInput,
  UpdatePostInput,
  ListPostsInput,
  GetPostByIdInput,
  DeletePostInput,
  GetPostRepliesInput,
} from '../validators/post-validators';

export class PostController {
  // ==================== CRIAR POST ====================

  async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { threadId, content, parentPostId }: CreatePostInput['body'] = req.body;
      const userId = req.user!.id;

      // Verificar se thread existe
      const thread = await threadRepository.getById(threadId);
      if (!thread) {
        throw ApiError.notFound('Thread não encontrada');
      }

      // Verificar se thread está bloqueada
      if (thread.is_locked) {
        throw ApiError.forbidden('Esta thread está bloqueada para novas respostas');
      }

      // Se tem parent_post_id, verificar se post pai existe e pertence à mesma thread
      if (parentPostId) {
        const parentPost = await postRepository.getById(parentPostId);
        if (!parentPost) {
          throw ApiError.notFound('Post pai não encontrado');
        }
        if (parentPost.thread_id !== threadId) {
          throw ApiError.badRequest('Post pai não pertence a esta thread');
        }
      }

      // Criar post
      const post = await postRepository.create({
        threadId,
        authorId: userId,
        content,
        parentPostId,
      });

      sendSuccess(
        res,
        {
          post,
          message: 'Post criado com sucesso',
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  // ==================== LISTAR POSTS ====================

  async listPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ListPostsInput['query'] = req.query as any;
      const userId = req.user?.id; // Opcional - para marcar likes do usuário

      // Buscar posts
      const posts = await postRepository.list(query, userId);

      // Contar total
      const total = await postRepository.count(query.threadId, query.parentPostId);

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      sendSuccess(res, {
        posts,
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

  // ==================== BUSCAR POST POR ID ====================

  async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: GetPostByIdInput['params'] = req.params as any;
      const userId = req.user?.id;

      const post = await postRepository.getById(postId, userId);

      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      sendSuccess(res, { post });
    } catch (error) {
      next(error);
    }
  }

  // ==================== BUSCAR RESPOSTAS DE UM POST ====================

  async getPostReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: GetPostRepliesInput['params'] = req.params as any;
      const { limit, offset }: GetPostRepliesInput['query'] = req.query as any;
      const userId = req.user?.id;

      // Verificar se post existe
      const post = await postRepository.getById(postId);
      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      // Buscar respostas
      const replies = await postRepository.list(
        {
          threadId: post.thread_id,
          parentPostId: postId,
          limit: limit || 50,
          offset: offset || 0,
        },
        userId
      );

      // Contar total
      const total = await postRepository.count(post.thread_id, postId);

      sendSuccess(res, {
        replies,
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

  // ==================== ATUALIZAR POST ====================

  async updatePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: UpdatePostInput['params'] = req.params as any;
      const { content }: UpdatePostInput['body'] = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar se post existe
      const existingPost = await postRepository.getById(postId);
      if (!existingPost) {
        throw ApiError.notFound('Post não encontrado');
      }

      // Verificar se é o autor ou moderador+
      const isAuthor = await postRepository.isAuthor(postId, userId);
      const isModerator = ['moderador', 'admin', 'master'].includes(userRole);

      if (!isAuthor && !isModerator) {
        throw ApiError.forbidden('Você não tem permissão para editar este post');
      }

      // Atualizar post
      const post = await postRepository.update(postId, content);

      sendSuccess(res, {
        post,
        message: 'Post atualizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== DELETAR POST ====================

  async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId }: DeletePostInput['params'] = req.params as any;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verificar se post existe
      const post = await postRepository.getById(postId);
      if (!post) {
        throw ApiError.notFound('Post não encontrado');
      }

      // Verificar se é o autor ou moderador+
      const isAuthor = await postRepository.isAuthor(postId, userId);
      const isModerator = ['moderador', 'admin', 'master'].includes(userRole);

      if (!isAuthor && !isModerator) {
        throw ApiError.forbidden('Você não tem permissão para deletar este post');
      }

      // Deletar post (CASCADE deleta respostas também)
      await postRepository.delete(postId);

      sendSuccess(res, {
        message: 'Post deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
