import { Router } from 'express';
import { externalApiController } from '../controllers/external-api-controller';
import { authMiddleware } from '../middlewares/auth-middleware';
import { requireAdmin } from '../middlewares/role-middleware';
import { validate } from '../middlewares/validate-middleware';
import {
  searchTMDBContentSchema,
  getTMDBContentByIdSchema,
  searchSteamGameSchema,
  getSteamGameByIdSchema,
  deleteCacheSchema,
  cleanupExpiredCacheSchema,
  getCacheStatsSchema,
  getMostAccessedCacheSchema,
  countCacheBySourceSchema,
} from '../validators/external-api-validators';

const router: Router = Router();

// ==================== ROTAS TMDB (PÚBLICAS) ====================

// Buscar conteúdo TMDB por nome
// GET /api/v1/external/tmdb/search?query=Inception&type=movie
router.get('/tmdb/search', validate(searchTMDBContentSchema, 'query'), (req, res, next) => {
  externalApiController.searchTMDBContent(req, res, next);
});

// Buscar conteúdo TMDB por ID
// GET /api/v1/external/tmdb/:tmdbId?type=movie
router.get(
  '/tmdb/:tmdbId',
  validate(getTMDBContentByIdSchema, 'params'),
  validate(getTMDBContentByIdSchema, 'query'),
  (req, res, next) => {
    externalApiController.getTMDBContentById(req, res, next);
  }
);

// ==================== ROTAS STEAM (PÚBLICAS) ====================

// Buscar jogo Steam por nome
// GET /api/v1/external/steam/search?query=Counter-Strike
router.get('/steam/search', validate(searchSteamGameSchema, 'query'), (req, res, next) => {
  externalApiController.searchSteamGame(req, res, next);
});

// Buscar jogo Steam por App ID
// GET /api/v1/external/steam/:appId
router.get('/steam/:appId', validate(getSteamGameByIdSchema, 'params'), (req, res, next) => {
  externalApiController.getSteamGameById(req, res, next);
});

// ==================== ROTAS DE CACHE (ADMINISTRATIVAS) ====================
// Requerem autenticação e cargo de Admin ou Master

// Obter estatísticas do cache (público para visualização)
router.get('/cache/stats', validate(getCacheStatsSchema), (req, res, next) => {
  externalApiController.getCacheStats(req, res, next);
});

// Listar cache mais acessado (público para visualização)
router.get(
  '/cache/most-accessed',
  validate(getMostAccessedCacheSchema, 'query'),
  (req, res, next) => {
    externalApiController.getMostAccessedCache(req, res, next);
  }
);

// Contar cache por source (público para visualização)
router.get(
  '/cache/count/:source',
  validate(countCacheBySourceSchema, 'params'),
  (req, res, next) => {
    externalApiController.countCacheBySource(req, res, next);
  }
);

// Aplicar middleware de autenticação e admin para rotas de gerenciamento
router.use('/cache', authMiddleware);
router.use('/cache', requireAdmin);

// Limpar cache expirado
// POST /api/v1/external/cache/cleanup
router.post('/cache/cleanup', validate(cleanupExpiredCacheSchema), (req, res, next) => {
  externalApiController.cleanupExpiredCache(req, res, next);
});

// Deletar cache específico
// DELETE /api/v1/external/cache/:source/:externalId
router.delete('/cache/:source/:externalId', validate(deleteCacheSchema, 'params'), (req, res, next) => {
  externalApiController.deleteCache(req, res, next);
});

export default router;
