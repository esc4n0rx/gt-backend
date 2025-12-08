import { z } from 'zod';

/**
 * Validação para atualização de perfil básico
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
});

/**
 * Validação para solicitação de alteração de email
 */
export const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * Validação para confirmação de alteração de email
 */
export const confirmEmailChangeSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 caracteres'),
});

/**
 * Validação para solicitação de alteração de senha
 */
export const requestPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres').max(100, 'Nova senha deve ter no máximo 100 caracteres'),
});

/**
 * Validação para confirmação de alteração de senha
 */
export const confirmPasswordChangeSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 caracteres'),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type RequestEmailChangeDTO = z.infer<typeof requestEmailChangeSchema>;
export type ConfirmEmailChangeDTO = z.infer<typeof confirmEmailChangeSchema>;
export type RequestPasswordChangeDTO = z.infer<typeof requestPasswordChangeSchema>;
export type ConfirmPasswordChangeDTO = z.infer<typeof confirmPasswordChangeSchema>;
