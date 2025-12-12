import { z } from 'zod';

// =====================================================
// Validator para curtir/descurtir thread
// =====================================================

export const toggleThreadLikeSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
});

// =====================================================
// Validator para curtir/descurtir post
// =====================================================

export const togglePostLikeSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
});

// =====================================================
// Validator para listar likes de thread
// =====================================================

export const listThreadLikesSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
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
// Validator para listar likes de post
// =====================================================

export const listPostLikesSchema = z.object({
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
// Validator para status de like de thread
// =====================================================

export const getThreadLikeStatusSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
});

// =====================================================
// Validator para status de like de post
// =====================================================

export const getPostLikeStatusSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID de post inválido'),
  }),
});

// =====================================================
// Type exports para uso no controller
// =====================================================

export type ToggleThreadLikeInput = z.infer<typeof toggleThreadLikeSchema>;
export type TogglePostLikeInput = z.infer<typeof togglePostLikeSchema>;
export type ListThreadLikesInput = z.infer<typeof listThreadLikesSchema>;
export type ListPostLikesInput = z.infer<typeof listPostLikesSchema>;
export type GetThreadLikeStatusInput = z.infer<typeof getThreadLikeStatusSchema>;
export type GetPostLikeStatusInput = z.infer<typeof getPostLikeStatusSchema>;
