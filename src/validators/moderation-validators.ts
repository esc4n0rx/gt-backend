import { z } from 'zod';

// Schema para banir usuário
export const banUserSchema = z.object({
  reason: z.string({
    required_error: 'Motivo do banimento é obrigatório',
  }).min(10, 'Motivo deve ter no mínimo 10 caracteres').max(500, 'Motivo deve ter no máximo 500 caracteres'),

  isPermanent: z.boolean().optional().default(true),

  expiresInDays: z.number().int().positive().optional(),
}).refine((data) => {
  // Se não for permanente, deve ter expiresInDays
  if (data.isPermanent === false && !data.expiresInDays) {
    return false;
  }
  return true;
}, {
  message: 'Para banimento temporário, é necessário especificar expiresInDays',
  path: ['expiresInDays'],
});

// Schema para desbanir usuário
export const unbanUserSchema = z.object({
  reason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
});

// Schema para alterar cargo
export const changeRoleSchema = z.object({
  newRole: z.enum(['usuario', 'vip', 'uploader', 'suporte', 'moderador', 'admin', 'master'], {
    required_error: 'Novo cargo é obrigatório',
    invalid_type_error: 'Cargo inválido',
  }),

  reason: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
});

// Schema para validação de UUID
export const uuidParamSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido'),
});

// Schema para paginação
export const paginationSchema = z.object({
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 50),
  offset: z.string().optional().transform((val) => val ? parseInt(val) : 0),
});

// Types exportados
export type BanUserInput = z.infer<typeof banUserSchema>;
export type UnbanUserInput = z.infer<typeof unbanUserSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type UuidParamInput = z.infer<typeof uuidParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
