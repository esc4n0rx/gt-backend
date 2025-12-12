import { supabase } from '../config/database';
import {
  Thread,
  ThreadContent,
  ThreadTemplate,
  ThreadStatus,
  ThreadWithContent,
  ThreadWithAuthor,
  ThreadDetail,
  ThreadListItem,
  GetThreadsQuery,
  ThreadMidiaContent,
  ThreadJogosContent,
  ThreadSoftwareContent,
  ThreadTorrentContent,
  ThreadPostagemContent,
} from '../types/thread.types';

export class ThreadRepository {
  /**
   * Criar nova thread
   */
  async create(data: {
    categoryId: string;
    authorId: string;
    template: ThreadTemplate;
    title: string;
    slug: string;
    content: ThreadContent;
  }): Promise<ThreadWithContent> {
    // 1. Verificar se categoria é leaf node
    const { data: isLeaf, error: leafError } = await supabase.rpc('is_leaf_category', {
      category_id_param: data.categoryId,
    });

    if (leafError) {
      throw new Error(`Erro ao verificar categoria: ${leafError.message}`);
    }

    if (!isLeaf) {
      throw new Error('Threads só podem ser criadas em categorias finais (sem subcategorias)');
    }

    // 2. Inserir thread principal
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert({
        category_id: data.categoryId,
        author_id: data.authorId,
        template: data.template,
        title: data.title,
        slug: data.slug,
        status: 'active',
      })
      .select()
      .single();

    if (threadError || !thread) {
      throw new Error(`Erro ao criar thread: ${threadError?.message || 'Thread não retornada'}`);
    }

    // 3. Inserir conteúdo na tabela específica do template
    await this.insertContent(thread.id, data.template, data.content);

    // 4. Retornar thread com conteúdo
    const threadWithContent = await this.getById(thread.id);
    if (!threadWithContent) {
      throw new Error('Thread criada mas não encontrada');
    }

    return threadWithContent;
  }

  /**
   * Inserir conteúdo específico do template
   */
  private async insertContent(
    threadId: string,
    template: ThreadTemplate,
    content: ThreadContent
  ): Promise<void> {
    let tableName: string;
    let contentData: any;

    switch (template) {
      case 'midia':
        tableName = 'thread_midia_content';
        contentData = { thread_id: threadId, ...(content as ThreadMidiaContent) };
        break;
      case 'jogos':
        tableName = 'thread_jogos_content';
        contentData = { thread_id: threadId, ...(content as ThreadJogosContent) };
        break;
      case 'software':
        tableName = 'thread_software_content';
        contentData = { thread_id: threadId, ...(content as ThreadSoftwareContent) };
        break;
      case 'torrent':
        tableName = 'thread_torrent_content';
        contentData = { thread_id: threadId, ...(content as ThreadTorrentContent) };
        break;
      case 'postagem':
        tableName = 'thread_postagem_content';
        contentData = { thread_id: threadId, ...(content as ThreadPostagemContent) };
        break;
      default:
        throw new Error(`Template inválido: ${template}`);
    }

    const { error } = await supabase.from(tableName).insert(contentData);

    if (error) {
      // Se falhar, deletar thread principal
      await supabase.from('threads').delete().eq('id', threadId);
      throw new Error(`Erro ao inserir conteúdo: ${error.message}`);
    }
  }

  /**
   * Buscar thread por ID com conteúdo completo
   */
  async getById(threadId: string): Promise<ThreadWithContent | null> {
    // Buscar thread
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return null;
    }

    // Buscar conteúdo
    const content = await this.getContent(thread.id, thread.template);

    return {
      ...thread,
      created_at: new Date(thread.created_at),
      updated_at: new Date(thread.updated_at),
      last_reply_at: thread.last_reply_at ? new Date(thread.last_reply_at) : null,
      content,
    } as ThreadWithContent;
  }

  /**
   * Buscar thread com detalhes completos (autor, categoria, breadcrumbs)
   */
  async getByIdWithDetails(threadId: string): Promise<ThreadDetail | null> {
    // Buscar thread com autor e categoria
    const { data, error } = await supabase
      .from('threads')
      .select(
        `
        *,
        author:profiles!threads_author_id_fkey(
          user_id,
          username,
          avatar_url,
          total_posts,
          total_likes,
          level,
          role,
          ranking,
          signature
        ),
        category:categories!threads_category_id_fkey(id, name, slug, level)
      `
      )
      .eq('id', threadId)
      .single();

    if (error || !data) {
      return null;
    }

    // Buscar conteúdo
    const content = await this.getContent(data.id, data.template);

    // Buscar breadcrumbs
    const { data: breadcrumbs } = await supabase.rpc('get_category_breadcrumbs', {
      category_id_param: data.category_id,
    });

    const author = Array.isArray(data.author) ? data.author[0] : data.author;

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      last_reply_at: data.last_reply_at ? new Date(data.last_reply_at) : null,
      content,
      author: {
        id: author.user_id,
        username: author.username,
        avatar_url: author.avatar_url,
        total_posts: author.total_posts,
        total_likes: author.total_likes,
        level: author.level,
        role: author.role,
        ranking: author.ranking,
        signature: author.signature,
      },
      category: Array.isArray(data.category) ? data.category[0] : data.category,
      breadcrumbs: breadcrumbs || [],
    } as ThreadDetail;
  }

  /**
   * Buscar conteúdo específico do template
   */
  private async getContent(threadId: string, template: ThreadTemplate): Promise<ThreadContent> {
    const tableMap: Record<ThreadTemplate, string> = {
      midia: 'thread_midia_content',
      jogos: 'thread_jogos_content',
      software: 'thread_software_content',
      torrent: 'thread_torrent_content',
      postagem: 'thread_postagem_content',
    };

    const tableName = tableMap[template];
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (error || !data) {
      throw new Error(`Conteúdo da thread não encontrado: ${error?.message}`);
    }

    // Remover thread_id e created_at do retorno
    const { thread_id, created_at, ...content } = data;
    return content as ThreadContent;
  }

  /**
   * Listar threads com filtros
   */
  async list(query: GetThreadsQuery): Promise<ThreadListItem[]> {
    const {
      categoryId,
      authorId,
      template,
      status = 'active',
      isPinned,
      limit = 50,
      offset = 0,
      sortBy = 'recent',
    } = query;

    let dbQuery = supabase
      .from('threads')
      .select(
        `
        id,
        category_id,
        title,
        slug,
        template,
        status,
        view_count,
        reply_count,
        is_pinned,
        is_locked,
        last_reply_at,
        last_reply_by,
        created_at,
        author:profiles!threads_author_id_fkey(
          user_id,
          username,
          avatar_url,
          total_posts,
          total_likes,
          level,
          role,
          ranking,
          signature
        )
      `
      )
      .eq('status', status);

    // Filtros opcionais
    if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId);
    if (authorId) dbQuery = dbQuery.eq('author_id', authorId);
    if (template) dbQuery = dbQuery.eq('template', template);
    if (isPinned !== undefined) dbQuery = dbQuery.eq('is_pinned', isPinned);

    // Ordenação
    switch (sortBy) {
      case 'recent':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'popular':
        dbQuery = dbQuery.order('view_count', { ascending: false });
        break;
      case 'replies':
        dbQuery = dbQuery.order('reply_count', { ascending: false });
        break;
      case 'views':
        dbQuery = dbQuery.order('view_count', { ascending: false });
        break;
    }

    // Paginação
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Erro ao listar threads: ${error.message}`);
    }

    return (data || []).map((thread) => {
      const author = Array.isArray(thread.author) ? thread.author[0] : thread.author;
      return {
        ...thread,
        author: {
          id: author.user_id,
          username: author.username,
          avatar_url: author.avatar_url,
          total_posts: author.total_posts,
          total_likes: author.total_likes,
          level: author.level,
          role: author.role,
          ranking: author.ranking,
          signature: author.signature,
        },
        created_at: new Date(thread.created_at),
        last_reply_at: thread.last_reply_at ? new Date(thread.last_reply_at) : null,
      } as ThreadListItem;
    });
  }

  /**
   * Contar total de threads com filtros
   */
  async count(query: Partial<GetThreadsQuery>): Promise<number> {
    const { categoryId, authorId, template, status = 'active', isPinned } = query;

    let dbQuery = supabase
      .from('threads')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);

    if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId);
    if (authorId) dbQuery = dbQuery.eq('author_id', authorId);
    if (template) dbQuery = dbQuery.eq('template', template);
    if (isPinned !== undefined) dbQuery = dbQuery.eq('is_pinned', isPinned);

    const { count, error } = await dbQuery;

    if (error) {
      throw new Error(`Erro ao contar threads: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Buscar thread por slug dentro de uma categoria
   */
  async getBySlug(categoryId: string, slug: string): Promise<ThreadWithContent | null> {
    const { data: thread, error } = await supabase
      .from('threads')
      .select('*')
      .eq('category_id', categoryId)
      .eq('slug', slug)
      .single();

    if (error || !thread) {
      return null;
    }

    const content = await this.getContent(thread.id, thread.template);

    return {
      ...thread,
      created_at: new Date(thread.created_at),
      updated_at: new Date(thread.updated_at),
      last_reply_at: thread.last_reply_at ? new Date(thread.last_reply_at) : null,
      content,
    } as ThreadWithContent;
  }

  /**
   * Atualizar thread
   */
  async update(
    threadId: string,
    data: {
      title?: string;
      slug?: string;
      status?: ThreadStatus;
      isPinned?: boolean;
      isLocked?: boolean;
      content?: Partial<ThreadContent>;
    }
  ): Promise<Thread | null> {
    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.slug) updateData.slug = data.slug;
    if (data.status) updateData.status = data.status;
    if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;
    if (data.isLocked !== undefined) updateData.is_locked = data.isLocked;

    // Atualizar thread principal
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', threadId)
      .select()
      .single();

    if (threadError || !thread) {
      return null;
    }

    // Atualizar conteúdo se fornecido
    if (data.content) {
      await this.updateContent(threadId, thread.template, data.content);
    }

    return {
      ...thread,
      created_at: new Date(thread.created_at),
      updated_at: new Date(thread.updated_at),
      last_reply_at: thread.last_reply_at ? new Date(thread.last_reply_at) : null,
    } as Thread;
  }

  /**
   * Atualizar conteúdo específico do template
   */
  private async updateContent(
    threadId: string,
    template: ThreadTemplate,
    content: Partial<ThreadContent>
  ): Promise<void> {
    const tableMap: Record<ThreadTemplate, string> = {
      midia: 'thread_midia_content',
      jogos: 'thread_jogos_content',
      software: 'thread_software_content',
      torrent: 'thread_torrent_content',
      postagem: 'thread_postagem_content',
    };

    const tableName = tableMap[template];
    const { error } = await supabase
      .from(tableName)
      .update(content)
      .eq('thread_id', threadId);

    if (error) {
      throw new Error(`Erro ao atualizar conteúdo: ${error.message}`);
    }
  }

  /**
   * Deletar thread
   */
  async delete(threadId: string): Promise<boolean> {
    const { error } = await supabase.from('threads').delete().eq('id', threadId);

    if (error) {
      throw new Error(`Erro ao deletar thread: ${error.message}`);
    }

    return true;
  }

  /**
   * Incrementar visualizações
   */
  async incrementViews(threadId: string): Promise<void> {
    const { error } = await supabase.rpc('increment', {
      table_name: 'threads',
      row_id: threadId,
      column_name: 'view_count',
    });

    // Se a função RPC não existir, usar update manual
    if (error) {
      await supabase
        .from('threads')
        .update({ view_count: supabase.sql`view_count + 1` })
        .eq('id', threadId);
    }
  }

  /**
   * Verificar se usuário é autor da thread
   */
  async isAuthor(threadId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('threads')
      .select('author_id')
      .eq('id', threadId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.author_id === userId;
  }

  /**
   * Verificar se categoria está bloqueada
   */
  async isCategoryLocked(categoryId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('categories')
      .select('is_locked')
      .eq('id', categoryId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_locked;
  }
}

export const threadRepository = new ThreadRepository();
