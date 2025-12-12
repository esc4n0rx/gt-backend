// Thread Types for Gtracker Forum
// Sistema de threads com templates especializados

import { UserProfileExpanded } from './post.types';

export type ThreadTemplate = 'midia' | 'jogos' | 'software' | 'torrent' | 'postagem';

export type ThreadStatus = 'active' | 'locked' | 'pinned' | 'archived';

// Base Thread Interface
export interface Thread {
  id: string;
  category_id: string;
  author_id: string;
  template: ThreadTemplate;
  title: string;
  slug: string;
  status: ThreadStatus;
  view_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_reply_at: Date | null;
  last_reply_by: string | null;
  created_at: Date;
  updated_at: Date;
}

// Template-specific content interfaces

// Midia Template (Filmes, Séries, Animes)
export interface ThreadMidiaContent {
  nome_conteudo: string;
  poster_url: string | null;
  genero: string[];
  trailer_url: string | null;
  elenco: string[];
  sinopse: string;
  notas: string | null;
  tamanho: string;
  formato: string[];
  link_download: string;
  idiomas: string[];
  qualidade: string | null;
  ano: number | null;
  duracao: string | null;
  classificacao: string | null;
  tmdb_id: string | null;
}

// Jogos Template
export interface ThreadJogosContent {
  nome: string;
  estilo: string[];
  poster_url: string | null;
  ano: number | null;
  sistema_operacional: string[];
  descricao: string;
  specs_minimas: string | null;
  specs_recomendadas: string | null;
  guia_instalacao: string;
  tamanho: string;
  formato: string;
  link_download: string;
  versao: string | null;
  desenvolvedor: string | null;
  publisher: string | null;
}

// Software Template
export interface ThreadSoftwareContent {
  nome: string;
  categoria: string[];
  poster_url: string | null;
  ano: number | null;
  sistema_operacional: string[];
  descricao: string;
  requisitos: string | null;
  guia_instalacao: string;
  tamanho: string;
  formato: string;
  link_download: string;
  versao: string;
  desenvolvedor: string | null;
  licenca: string | null;
}

// Torrent Template (similar a Midia mas com info torrent)
export interface ThreadTorrentContent {
  nome_conteudo: string;
  poster_url: string | null;
  genero: string[];
  trailer_url: string | null;
  elenco: string[];
  sinopse: string;
  notas: string | null;
  tamanho: string;
  formato: string[];
  magnet_link: string | null;
  torrent_file_url: string | null;
  idiomas: string[];
  qualidade: string | null;
  ano: number | null;
  seeders: number | null;
  leechers: number | null;
  tmdb_id: string | null;
}

// Postagem Template (thread padrão)
export interface ThreadPostagemContent {
  conteudo: string;
  tags: string[];
}

// Union type para conteúdo de thread
export type ThreadContent =
  | ThreadMidiaContent
  | ThreadJogosContent
  | ThreadSoftwareContent
  | ThreadTorrentContent
  | ThreadPostagemContent;

// Thread completa com conteúdo
export interface ThreadWithContent extends Thread {
  content: ThreadContent;
}

// Thread com informações do autor
export interface ThreadWithAuthor extends Thread {
  author: UserProfileExpanded;
}

// Thread com informações completas (para detalhes)
export interface ThreadDetail extends ThreadWithContent, ThreadWithAuthor {
  category: {
    id: string;
    name: string;
    slug: string;
    level: number;
  };
  breadcrumbs: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// DTOs para criação

export interface CreateThreadDto {
  categoryId: string;
  template: ThreadTemplate;
  title: string;
  content: ThreadContent;
}

export interface UpdateThreadDto {
  title?: string;
  content?: Partial<ThreadContent>;
  status?: ThreadStatus;
}

// DTOs para queries

export interface GetThreadsQuery {
  categoryId?: string;
  authorId?: string;
  template?: ThreadTemplate;
  status?: ThreadStatus;
  isPinned?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'popular' | 'replies' | 'views';
}

export interface ThreadListItem {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  template: ThreadTemplate;
  status: ThreadStatus;
  view_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  author: UserProfileExpanded;
  last_reply_at: Date | null;
  last_reply_by: string | null;
  created_at: Date;
  like_count?: number; // Total de likes na thread
  user_has_liked?: boolean; // Se o usuário logado curtiu
}

export interface ThreadsResponse {
  threads: ThreadListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Permissões para criar threads por template
export const THREAD_TEMPLATE_PERMISSIONS: Record<ThreadTemplate, string[]> = {
  midia: ['uploader', 'suporte', 'moderador', 'admin', 'master'],
  jogos: ['uploader', 'suporte', 'moderador', 'admin', 'master'],
  software: ['uploader', 'suporte', 'moderador', 'admin', 'master'],
  torrent: ['uploader', 'suporte', 'moderador', 'admin', 'master'],
  postagem: ['usuario', 'vip', 'uploader', 'suporte', 'moderador', 'admin', 'master'],
};
