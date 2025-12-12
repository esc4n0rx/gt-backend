import { z } from 'zod';

// =====================================================
// Validator para criar post
// =====================================================

export const createPostSchema = z.object({
  body: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
    content: z
      .string()
      .min(1, 'Conteúdo é obrigatório')
      .max(10000, 'Conteúdo não pode ter mais de 10000 caracteres'),
    parentPostId: z.string().uuid('ID de post pai inválido').nullable().optional(),
  }),
});

// =====================================================
// Validator para atualizar post
// =====================================================

export const updatePostSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Conteúdo é obrigatório')
      .max(10000, 'Conteúdo não pode ter mais de 10000 caracteres'),
  }),
});

// =====================================================
// Validator para listar posts
// =====================================================

export const listPostsSchema = z.object({
  query: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('50'),
    offset: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(0))
      .optional()
      .default('0'),
    sortBy: z.enum(['asc', 'desc']).optional().default('asc'),
    parentPostId: z.string().uuid('ID de post pai inválido').nullable().optional(),
  }),
});

// =====================================================
// Validator para buscar post por ID
// =====================================================

export const getPostByIdSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
});

// =====================================================
// Validator para deletar post
// =====================================================

export const deletePostSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
});

// =====================================================
// Validator para buscar respostas de um post
// =====================================================

export const getPostRepliesSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
  query: z.object({
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('50'),
    offset: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(0))
      .optional()
      .default('0'),
  }),
});

// =====================================================
// Type exports para uso no controller
// =====================================================

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type ListPostsInput = z.infer<typeof listPostsSchema>;
export type GetPostByIdInput = z.infer<typeof getPostByIdSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
export type GetPostRepliesInput = z.infer<typeof getPostRepliesSchema>;
