import { z } from 'zod';

export const toggleInviteRequirementSchema = z.object({
  required: z.boolean({
    required_error: 'Campo "required" é obrigatório',
    invalid_type_error: 'Campo "required" deve ser booleano',
  }),
});

export type ToggleInviteRequirementInput = z.infer<typeof toggleInviteRequirementSchema>;