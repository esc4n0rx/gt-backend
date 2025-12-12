import { z } from 'zod';

// =====================================================
// Validators para TMDB API
// =====================================================

// Buscar conteúdo TMDB por nome
export const searchTMDBContentSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Query de busca é obrigatória'),
    type: z.enum(['movie', 'tv'], {
      errorMap: () => ({ message: 'Tipo deve ser "movie" ou "tv"' }),
    }).optional().default('movie'),
  }),
});

// Buscar conteúdo TMDB por ID
export const getTMDBContentByIdSchema = z.object({
  params: z.object({
    tmdbId: z.string().regex(/^\d+$/, 'TMDB ID deve ser um número'),
  }),
  query: z.object({
    type: z.enum(['movie', 'tv'], {
      errorMap: () => ({ message: 'Tipo deve ser "movie" ou "tv"' }),
    }).optional().default('movie'),
  }),
});

// =====================================================
// Validators para Steam API
// =====================================================

// Buscar jogo Steam por nome
export const searchSteamGameSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Query de busca é obrigatória'),
  }),
});

// Buscar jogo Steam por App ID
export const getSteamGameByIdSchema = z.object({
  params: z.object({
    appId: z.string().regex(/^\d+$/, 'App ID deve ser um número'),
  }),
});

// =====================================================
// Validators para Cache Management
// =====================================================

// Deletar cache por source e external_id
export const deleteCacheSchema = z.object({
  params: z.object({
    source: z.enum(['tmdb', 'steam'], {
      errorMap: () => ({ message: 'Source deve ser "tmdb" ou "steam"' }),
    }),
    externalId: z.string().min(1, 'External ID é obrigatório'),
  }),
});

// Limpar cache expirado
export const cleanupExpiredCacheSchema = z.object({
  // Não requer parâmetros
});

// Obter estatísticas do cache
export const getCacheStatsSchema = z.object({
  // Não requer parâmetros
});

// Listar cache mais acessado
export const getMostAccessedCacheSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('20'),
  }),
});

// Contar cache por source
export const countCacheBySourceSchema = z.object({
  params: z.object({
    source: z.enum(['tmdb', 'steam'], {
      errorMap: () => ({ message: 'Source deve ser "tmdb" ou "steam"' }),
    }),
  }),
});

// =====================================================
// Type exports para uso no controller
// =====================================================

export type SearchTMDBContentInput = z.infer<typeof searchTMDBContentSchema>;
export type GetTMDBContentByIdInput = z.infer<typeof getTMDBContentByIdSchema>;
export type SearchSteamGameInput = z.infer<typeof searchSteamGameSchema>;
export type GetSteamGameByIdInput = z.infer<typeof getSteamGameByIdSchema>;
export type DeleteCacheInput = z.infer<typeof deleteCacheSchema>;
export type CleanupExpiredCacheInput = z.infer<typeof cleanupExpiredCacheSchema>;
export type GetCacheStatsInput = z.infer<typeof getCacheStatsSchema>;
export type GetMostAccessedCacheInput = z.infer<typeof getMostAccessedCacheSchema>;
export type CountCacheBySourceInput = z.infer<typeof countCacheBySourceSchema>;
