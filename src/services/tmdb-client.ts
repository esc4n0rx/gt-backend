import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import {
  TMDBSearchResult,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBContentForThread,
} from '../types/external-api.types';
import { contentCacheRepository } from '../repositories/content-cache-repository';

export class TMDBClient {
  private client: AxiosInstance;
  private apiKey: string;
  private imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  private imageOriginalUrl = 'https://image.tmdb.org/t/p/original';

  constructor() {
    this.apiKey = env.TMDB_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️  TMDB_API_KEY não configurada no .env');
    }

    this.client = axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      params: {
        api_key: this.apiKey,
        language: 'pt-BR',
      },
    });
  }

  /**
   * Buscar filme por nome
   */
  async searchMovie(query: string): Promise<TMDBSearchResult> {
    const { data } = await this.client.get('/search/movie', {
      params: { query },
    });
    return data;
  }

  /**
   * Buscar série por nome
   */
  async searchTVShow(query: string): Promise<TMDBSearchResult> {
    const { data } = await this.client.get('/search/tv', {
      params: { query },
    });
    return data;
  }

  /**
   * Obter detalhes de filme por ID
   */
  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    const { data } = await this.client.get(`/movie/${movieId}`, {
      params: {
        append_to_response: 'videos,credits',
      },
    });
    return data;
  }

  /**
   * Obter detalhes de série por ID
   */
  async getTVShowDetails(tvId: number): Promise<TMDBTVShowDetails> {
    const { data } = await this.client.get(`/tv/${tvId}`, {
      params: {
        append_to_response: 'videos,credits',
      },
    });
    return data;
  }

  /**
   * Buscar conteúdo (filme ou série) e formatar para thread
   * COM CACHE
   */
  async searchContent(query: string, type: 'movie' | 'tv' = 'movie'): Promise<TMDBContentForThread> {
    // Buscar resultados
    const searchResults = type === 'movie'
      ? await this.searchMovie(query)
      : await this.searchTVShow(query);

    if (!searchResults.results || searchResults.results.length === 0) {
      throw new Error('Nenhum resultado encontrado para esta busca');
    }

    // Pegar primeiro resultado
    const firstResult: any = searchResults.results[0];
    const contentId = firstResult.id;

    // Verificar cache
    const cached = await contentCacheRepository.findBySourceAndId('tmdb', contentId.toString());
    if (cached) {
      console.log(`✅ Cache hit para TMDB ID ${contentId}`);
      return cached.content_data as TMDBContentForThread;
    }

    console.log(`🔍 Cache miss para TMDB ID ${contentId}. Buscando na API...`);

    // Buscar detalhes completos
    const details = type === 'movie'
      ? await this.getMovieDetails(contentId)
      : await this.getTVShowDetails(contentId);

    // Formatar para thread
    const formatted = this.formatForThread(details as any, type);

    // Salvar no cache
    await contentCacheRepository.create({
      source: 'tmdb',
      externalId: contentId.toString(),
      searchQuery: query,
      contentData: formatted,
      expiresInDays: 30,
    });

    return formatted;
  }

  /**
   * Buscar por ID direto (com cache)
   */
  async getContentById(tmdbId: number, type: 'movie' | 'tv' = 'movie'): Promise<TMDBContentForThread> {
    // Verificar cache
    const cached = await contentCacheRepository.findBySourceAndId('tmdb', tmdbId.toString());
    if (cached) {
      console.log(`✅ Cache hit para TMDB ID ${tmdbId}`);
      return cached.content_data as TMDBContentForThread;
    }

    console.log(`🔍 Cache miss para TMDB ID ${tmdbId}. Buscando na API...`);

    // Buscar detalhes
    const details = type === 'movie'
      ? await this.getMovieDetails(tmdbId)
      : await this.getTVShowDetails(tmdbId);

    // Formatar para thread
    const formatted = this.formatForThread(details as any, type);

    // Salvar no cache
    await contentCacheRepository.create({
      source: 'tmdb',
      externalId: tmdbId.toString(),
      searchQuery: formatted.nome_conteudo,
      contentData: formatted,
      expiresInDays: 30,
    });

    return formatted;
  }

  /**
   * Formatar dados do TMDB para formato de thread
   */
  private formatForThread(
    details: TMDBMovieDetails | TMDBTVShowDetails,
    type: 'movie' | 'tv'
  ): TMDBContentForThread {
    const isMovie = type === 'movie';
    const movieDetails = details as TMDBMovieDetails;
    const tvDetails = details as TMDBTVShowDetails;

    // Extrair trailer (YouTube)
    let trailerUrl: string | null = null;
    if (details.videos && details.videos.results.length > 0) {
      const trailer = details.videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    // Extrair elenco (top 10)
    const elenco: string[] = [];
    if (details.credits && details.credits.cast) {
      elenco.push(...details.credits.cast.slice(0, 10).map((actor) => actor.name));
    }

    // Duração
    let duracao: string | null = null;
    if (isMovie && movieDetails.runtime) {
      const hours = Math.floor(movieDetails.runtime / 60);
      const minutes = movieDetails.runtime % 60;
      duracao = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    } else if (!isMovie && tvDetails.episode_run_time && tvDetails.episode_run_time.length > 0) {
      duracao = `~${tvDetails.episode_run_time[0]}min por episódio`;
    }

    // Ano
    const releaseDate = isMovie ? movieDetails.release_date : tvDetails.first_air_date;
    const ano = releaseDate ? parseInt(releaseDate.split('-')[0]) : null;

    // Classificação
    let classificacao: string | null = null;
    if (movieDetails.adult !== undefined) {
      classificacao = movieDetails.adult ? '18+' : 'Livre';
    }

    return {
      tmdb_id: details.id.toString(),
      nome_conteudo: isMovie ? movieDetails.title : tvDetails.name,
      poster_url: details.poster_path
        ? `${this.imageOriginalUrl}${details.poster_path}`
        : null,
      genero: details.genres.map((g) => g.name),
      trailer_url: trailerUrl,
      elenco,
      sinopse: details.overview || 'Sem sinopse disponível',
      ano,
      duracao,
      classificacao,
      tipo: type,
    };
  }
}

export const tmdbClient = new TMDBClient();
