import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url('SUPABASE_URL inválida'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatória'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DEFAULT_AVATAR_URL: z.string().url().default('https://gtracker.com/assets/default-avatar.png'),
  DEFAULT_BANNER_URL: z.string().url().default('https://gtracker.com/assets/default-banner.png'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;