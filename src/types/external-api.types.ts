// Types for External APIs (TMDB and Steam)

export type ContentSource = 'tmdb' | 'steam';

// =====================================================
// TMDB Types
// =====================================================

export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[] | TMDBTVShow[];
  total_results: number;
  total_pages: number;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
    }>;
  };
}

export interface TMDBTVShowDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  episode_run_time: number[];
  genres: Array<{ id: number; name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  status: string;
  tagline: string;
  created_by: Array<{ id: number; name: string }>;
  networks: Array<{ id: number; name: string; logo_path: string | null }>;
  production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
  spoken_languages: Array<{ iso_639_1: string; name: string }>;
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
  };
}

// DTO retornado pela nossa API (formatado para o template de thread)
export interface TMDBContentForThread {
  tmdb_id: string;
  nome_conteudo: string;
  poster_url: string | null;
  genero: string[];
  trailer_url: string | null;
  elenco: string[];
  sinopse: string;
  ano: number | null;
  duracao: string | null;
  classificacao: string | null;
  tipo: 'movie' | 'tv';
}

// =====================================================
// Steam Types
// =====================================================

export interface SteamAppListItem {
  appid: number;
  name: string;
}

export interface SteamAppList {
  applist: {
    apps: SteamAppListItem[];
  };
}

export interface SteamAppDetails {
  success: boolean;
  data?: {
    type: string;
    name: string;
    steam_appid: number;
    required_age: number;
    is_free: boolean;
    dlc?: number[];
    detailed_description: string;
    about_the_game: string;
    short_description: string;
    supported_languages: string;
    header_image: string;
    website: string | null;
    pc_requirements: {
      minimum?: string;
      recommended?: string;
    };
    mac_requirements: {
      minimum?: string;
      recommended?: string;
    };
    linux_requirements: {
      minimum?: string;
      recommended?: string;
    };
    legal_notice?: string;
    developers: string[];
    publishers: string[];
    price_overview?: {
      currency: string;
      initial: number;
      final: number;
      discount_percent: number;
      initial_formatted: string;
      final_formatted: string;
    };
    packages?: number[];
    package_groups?: any[];
    platforms: {
      windows: boolean;
      mac: boolean;
      linux: boolean;
    };
    metacritic?: {
      score: number;
      url: string;
    };
    categories?: Array<{
      id: number;
      description: string;
    }>;
    genres?: Array<{
      id: string;
      description: string;
    }>;
    screenshots?: Array<{
      id: number;
      path_thumbnail: string;
      path_full: string;
    }>;
    movies?: Array<{
      id: number;
      name: string;
      thumbnail: string;
      webm: {
        480: string;
        max: string;
      };
      mp4: {
        480: string;
        max: string;
      };
      highlight: boolean;
    }>;
    recommendations?: {
      total: number;
    };
    achievements?: {
      total: number;
      highlighted: Array<{
        name: string;
        path: string;
      }>;
    };
    release_date: {
      coming_soon: boolean;
      date: string;
    };
    support_info: {
      url: string;
      email: string;
    };
    background: string;
    background_raw: string;
    content_descriptors: {
      ids: number[];
      notes: string | null;
    };
  };
}

// DTO retornado pela nossa API (formatado para o template de thread)
export interface SteamGameForThread {
  steam_appid: string;
  nome: string;
  estilo: string[];
  poster_url: string | null;
  ano: number | null;
  sistema_operacional: string[];
  descricao: string;
  specs_minimas: string | null;
  specs_recomendadas: string | null;
  desenvolvedor: string | null;
  publisher: string | null;
}

// =====================================================
// Cache Types
// =====================================================

export interface ContentCache {
  id: string;
  source: ContentSource;
  external_id: string;
  search_query: string;
  content_data: any; // JSONB
  hits: number;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
}

export interface CreateCacheDto {
  source: ContentSource;
  externalId: string;
  searchQuery: string;
  contentData: any;
  expiresInDays?: number; // Default: 30
}

export interface CacheStats {
  source: ContentSource;
  total_entries: number;
  total_hits: number;
  avg_hits: number;
  oldest_entry: Date;
  newest_entry: Date;
}
