import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { tmdbClient } from '../services/tmdb-client';
import { steamClient } from '../services/steam-client';
import { contentCacheRepository } from '../repositories/content-cache-repository';
import {
  SearchTMDBContentInput,
  GetTMDBContentByIdInput,
  SearchSteamGameInput,
  GetSteamGameByIdInput,
  DeleteCacheInput,
  GetMostAccessedCacheInput,
  CountCacheBySourceInput,
} from '../validators/external-api-validators';

export class ExternalApiController {
  // ==================== TMDB ====================

  /**
   * Buscar conteúdo TMDB por nome
   * GET /api/v1/external/tmdb/search?query=Inception&type=movie
   */
  async searchTMDBContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, type } = req.query as unknown as SearchTMDBContentInput['query'];

      const content = await tmdbClient.searchContent(query, type);

      sendSuccess(res, {
        content,
        message: 'Conteúdo encontrado com sucesso',
      });
    } catch (error: any) {
      if (error.message.includes('Nenhum resultado encontrado')) {
        next(ApiError.notFound(error.message));
      } else {
        next(error);
      }
    }
  }

  /**
   * Buscar conteúdo TMDB por ID
   * GET /api/v1/external/tmdb/:tmdbId?type=movie
   */
  async getTMDBContentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tmdbId } = req.params as GetTMDBContentByIdInput['params'];
      const { type } = req.query as unknown as GetTMDBContentByIdInput['query'];

      const content = await tmdbClient.getContentById(parseInt(tmdbId), type);

      sendSuccess(res, {
        content,
        message: 'Conteúdo encontrado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== STEAM ====================

  /**
   * Buscar jogo Steam por nome
   * GET /api/v1/external/steam/search?query=Counter-Strike
   */
  async searchSteamGame(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.query as unknown as SearchSteamGameInput['query'];

      const game = await steamClient.searchGame(query);

      sendSuccess(res, {
        game,
        message: 'Jogo encontrado com sucesso',
      });
    } catch (error: any) {
      if (error.message.includes('Nenhum jogo encontrado')) {
        next(ApiError.notFound(error.message));
      } else {
        next(error);
      }
    }
  }

  /**
   * Buscar jogo Steam por App ID
   * GET /api/v1/external/steam/:appId
   */
  async getSteamGameById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { appId } = req.params as GetSteamGameByIdInput['params'];

      const game = await steamClient.getGameById(parseInt(appId));

      sendSuccess(res, {
        game,
        message: 'Jogo encontrado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Deletar cache específico
   * DELETE /api/v1/external/cache/:source/:externalId
   */
  async deleteCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { source, externalId } = req.params as DeleteCacheInput['params'];

      await contentCacheRepository.delete(source, externalId);

      sendSuccess(res, {
        message: 'Cache deletado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Limpar cache expirado
   * POST /api/v1/external/cache/cleanup
   */
  async cleanupExpiredCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deletedCount = await contentCacheRepository.cleanupExpired();

      sendSuccess(res, {
        deletedCount,
        message: `${deletedCount} entradas de cache expiradas foram removidas`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas do cache
   * GET /api/v1/external/cache/stats
   */
  async getCacheStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await contentCacheRepository.getStats();

      sendSuccess(res, {
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar cache mais acessado
   * GET /api/v1/external/cache/most-accessed?limit=20
   */
  async getMostAccessedCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query as unknown as GetMostAccessedCacheInput['query'];

      const cache = await contentCacheRepository.getMostAccessed(
        typeof limit === 'string' ? parseInt(limit) : limit
      );

      sendSuccess(res, {
        cache,
        count: cache.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Contar cache por source
   * GET /api/v1/external/cache/count/:source
   */
  async countCacheBySource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { source } = req.params as CountCacheBySourceInput['params'];

      const count = await contentCacheRepository.countBySource(source);

      sendSuccess(res, {
        source,
        count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const externalApiController = new ExternalApiController();
