import { z } from 'zod';

// Helper para validar slug
const slugRegex = /^[a-z0-9-]+$/;

// Schema para criar categoria
export const createCategorySchema = z.object({
  name: z.string({
    required_error: 'Nome da categoria é obrigatório',
  }).min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),

  slug: z.string({
    required_error: 'Slug é obrigatório',
  }).min(2, 'Slug deve ter no mínimo 2 caracteres').max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(slugRegex, 'Slug deve conter apenas letras minúsculas, números e hífens'),

  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),

  parentId: z.string().uuid('Parent ID inválido').optional(),

  displayOrder: z.number().int().min(0, 'Ordem deve ser um número positivo').optional(),

  isLocked: z.boolean().optional(),

  icon: z.string().max(50, 'Ícone deve ter no máximo 50 caracteres').optional(),
});

// Schema para atualizar categoria
export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),

  slug: z.string().min(2, 'Slug deve ter no mínimo 2 caracteres').max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(slugRegex, 'Slug deve conter apenas letras minúsculas, números e hífens').optional(),

  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),

  displayOrder: z.number().int().min(0, 'Ordem deve ser um número positivo').optional(),

  isLocked: z.boolean().optional(),

  icon: z.string().max(50, 'Ícone deve ter no máximo 50 caracteres').optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
});

// Schema para reordenar categorias
export const reorderCategoriesSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().uuid('ID de categoria inválido'),
      displayOrder: z.number().int().min(0, 'Ordem deve ser um número positivo'),
    })
  ).min(1, 'Deve fornecer pelo menos uma categoria para reordenar'),
});

// Schema para validação de UUID em params
export const categoryIdParamSchema = z.object({
  categoryId: z.string().uuid('ID de categoria inválido'),
});

export const categorySlugParamSchema = z.object({
  slug: z.string().min(1, 'Slug é obrigatório'),
});

// Types exportados
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
export type CategoryIdParamInput = z.infer<typeof categoryIdParamSchema>;
export type CategorySlugParamInput = z.infer<typeof categorySlugParamSchema>;
