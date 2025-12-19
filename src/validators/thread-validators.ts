import { z } from 'zod';

// =====================================================
// Validators para conteúdo dos templates
// =====================================================

// Template: MIDIA
export const threadMidiaContentSchema = z.object({
  nome_conteudo: z.string().min(1).max(200),
  poster_url: z.string().url().nullable().optional(),
  genero: z.array(z.string()).min(1, 'Pelo menos um gênero é obrigatório'),
  trailer_url: z.string().url().nullable().optional(),
  elenco: z.array(z.string()).default([]),
  sinopse: z.string().min(10, 'Sinopse deve ter pelo menos 10 caracteres'),
  notas: z.string().nullable().optional(),
  tamanho: z.string().min(1, 'Tamanho é obrigatório'),
  formato: z.array(z.string()).min(1, 'Pelo menos um formato é obrigatório'),
  link_download: z.string().url('Link de download deve ser uma URL válida'),
  idiomas: z.array(z.string()).min(1, 'Pelo menos um idioma é obrigatório'),
  qualidade: z.string().nullable().optional(),
  ano: z.number().int().min(1800).max(2100).nullable().optional(),
  duracao: z.string().nullable().optional(),
  classificacao: z.string().max(20).nullable().optional(),
  tmdb_id: z.string().max(50).nullable().optional(),
});

// Template: JOGOS
export const threadJogosContentSchema = z.object({
  nome: z.string().min(1).max(200),
  estilo: z.array(z.string()).min(1, 'Pelo menos um estilo/gênero é obrigatório'),
  poster_url: z.string().url().nullable().optional(),
  ano: z.number().int().min(1970).max(2100).nullable().optional(),
  sistema_operacional: z.array(z.string()).min(1, 'Pelo menos um sistema operacional é obrigatório'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  specs_minimas: z.string().nullable().optional(),
  specs_recomendadas: z.string().nullable().optional(),
  guia_instalacao: z.string().min(10, 'Guia de instalação é obrigatório'),
  tamanho: z.string().min(1, 'Tamanho é obrigatório'),
  formato: z.string().min(1, 'Formato é obrigatório'),
  link_download: z.string().url('Link de download deve ser uma URL válida'),
  versao: z.string().nullable().optional(),
  desenvolvedor: z.string().max(200).nullable().optional(),
  publisher: z.string().max(200).nullable().optional(),
});

// Template: SOFTWARE
export const threadSoftwareContentSchema = z.object({
  nome: z.string().min(1).max(200),
  categoria: z.array(z.string()).min(1, 'Pelo menos uma categoria é obrigatória'),
  poster_url: z.string().url().nullable().optional(),
  ano: z.number().int().min(1970).max(2100).nullable().optional(),
  sistema_operacional: z.array(z.string()).min(1, 'Pelo menos um sistema operacional é obrigatório'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  requisitos: z.string().nullable().optional(),
  guia_instalacao: z.string().min(10, 'Guia de instalação é obrigatório'),
  tamanho: z.string().min(1, 'Tamanho é obrigatório'),
  formato: z.string().min(1, 'Formato é obrigatório'),
  link_download: z.string().url('Link de download deve ser uma URL válida'),
  versao: z.string().min(1, 'Versão é obrigatória'),
  desenvolvedor: z.string().max(200).nullable().optional(),
  licenca: z.string().max(100).nullable().optional(),
});

// Template: TORRENT (base schema sem validação)
const threadTorrentContentBaseSchema = z.object({
  nome_conteudo: z.string().min(1).max(200),
  poster_url: z.string().url().nullable().optional(),
  genero: z.array(z.string()).min(1, 'Pelo menos um gênero é obrigatório'),
  trailer_url: z.string().url().nullable().optional(),
  elenco: z.array(z.string()).default([]),
  sinopse: z.string().min(10, 'Sinopse deve ter pelo menos 10 caracteres'),
  notas: z.string().nullable().optional(),
  tamanho: z.string().min(1, 'Tamanho é obrigatório'),
  formato: z.array(z.string()).min(1, 'Pelo menos um formato é obrigatório'),
  magnet_link: z.string().nullable().optional(),
  torrent_file_url: z.string().url().nullable().optional(),
  idiomas: z.array(z.string()).min(1, 'Pelo menos um idioma é obrigatório'),
  qualidade: z.string().nullable().optional(),
  ano: z.number().int().min(1800).max(2100).nullable().optional(),
  seeders: z.number().int().min(0).nullable().optional(),
  leechers: z.number().int().min(0).nullable().optional(),
  tmdb_id: z.string().max(50).nullable().optional(),
});

// Template: TORRENT (com validação de links)
export const threadTorrentContentSchema = threadTorrentContentBaseSchema.refine(
  (data) => data.magnet_link || data.torrent_file_url,
  {
    message: 'Pelo menos um link (magnet ou arquivo torrent) é obrigatório',
    path: ['magnet_link'],
  }
);

// Template: POSTAGEM
export const threadPostagemContentSchema = z.object({
  conteudo: z.string().min(10, 'Conteúdo deve ter pelo menos 10 caracteres'),
  tags: z.array(z.string()).default([]),
});

// =====================================================
// Validator para criar thread
// =====================================================

export const createThreadSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('ID de categoria inválido'),
    template: z.enum(['midia', 'jogos', 'software', 'torrent', 'postagem'], {
      errorMap: () => ({ message: 'Template inválido' }),
    }),
    title: z
      .string()
      .min(5, 'Título deve ter pelo menos 5 caracteres')
      .max(200, 'Título não pode ter mais de 200 caracteres'),
    content: z.union([
      threadMidiaContentSchema,
      threadJogosContentSchema,
      threadSoftwareContentSchema,
      threadTorrentContentSchema,
      threadPostagemContentSchema,
    ]),
  }),
});

// =====================================================
// Validator para atualizar thread
// =====================================================

export const updateThreadSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
  body: z.object({
    title: z
      .string()
      .min(5, 'Título deve ter pelo menos 5 caracteres')
      .max(200, 'Título não pode ter mais de 200 caracteres')
      .optional(),
    content: z
      .union([
        threadMidiaContentSchema.partial(),
        threadJogosContentSchema.partial(),
        threadSoftwareContentSchema.partial(),
        threadTorrentContentBaseSchema.partial(),
        threadPostagemContentSchema.partial(),
      ])
      .optional(),
    status: z.enum(['active', 'locked', 'pinned', 'archived']).optional(),
  }),
});

// =====================================================
// Validator para modificar status da thread
// =====================================================

export const updateThreadStatusSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
  body: z.object({
    status: z.enum(['active', 'locked', 'pinned', 'archived'], {
      errorMap: () => ({ message: 'Status inválido' }),
    }),
  }),
});

// =====================================================
// Validator para pin/unpin thread
// =====================================================

export const togglePinThreadSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
});

// =====================================================
// Validator para lock/unlock thread
// =====================================================

export const toggleLockThreadSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
});

// =====================================================
// Validator para listar threads
// =====================================================

export const listThreadsSchema = z.object({
  query: z.object({
    categoryId: z.string().uuid('ID de categoria inválido').optional(),
    authorId: z.string().uuid('ID de autor inválido').optional(),
    template: z.enum(['midia', 'jogos', 'software', 'torrent', 'postagem']).optional(),
    status: z.enum(['active', 'locked', 'pinned', 'archived']).optional(),
    isPinned: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('50'),
    offset: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(0))
      .optional()
      .default('0'),
    sortBy: z.enum(['recent', 'popular', 'replies', 'views']).optional().default('recent'),
  }),
});

// =====================================================
// Validator para buscar thread por ID
// =====================================================

export const getThreadByIdSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
});

// =====================================================
// Validator para buscar thread por slug
// =====================================================

export const getThreadBySlugSchema = z.object({
  params: z.object({
    categoryId: z.string().uuid('ID de categoria inválido'),
    slug: z.string().min(1, 'Slug inválido'),
  }),
});

// =====================================================
// Validator para deletar thread
// =====================================================

export const deleteThreadSchema = z.object({
  params: z.object({
    threadId: z.string().uuid('ID de thread inválido'),
  }),
});

// =====================================================
// Type exports para uso no controller
// =====================================================

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type UpdateThreadStatusInput = z.infer<typeof updateThreadStatusSchema>;
export type TogglePinThreadInput = z.infer<typeof togglePinThreadSchema>;
export type ToggleLockThreadInput = z.infer<typeof toggleLockThreadSchema>;
export type ListThreadsInput = z.infer<typeof listThreadsSchema>;
export type GetThreadByIdInput = z.infer<typeof getThreadByIdSchema>;
export type GetThreadBySlugInput = z.infer<typeof getThreadBySlugSchema>;
export type DeleteThreadInput = z.infer<typeof deleteThreadSchema>;
