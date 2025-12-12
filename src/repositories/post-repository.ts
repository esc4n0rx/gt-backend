import { supabase } from '../config/database';
import {
  Post,
  PostWithAuthor,
  PostWithDetails,
  GetPostsQuery,
  UserProfileExpanded,
} from '../types/post.types';

export class PostRepository {
  /**
   * Criar novo post/comentário
   */
  async create(data: {
    threadId: string;
    authorId: string;
    content: string;
    parentPostId?: string | null;
  }): Promise<PostWithAuthor> {
    // 1. Inserir post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        thread_id: data.threadId,
        author_id: data.authorId,
        content: data.content,
        parent_post_id: data.parentPostId || null,
      })
      .select()
      .single();

    if (postError || !post) {
      throw new Error(`Erro ao criar post: ${postError?.message || 'Post não retornado'}`);
    }

    // 2. Buscar post com autor
    const postWithAuthor = await this.getById(post.id);
    if (!postWithAuthor) {
      throw new Error('Post criado mas não encontrado');
    }

    return postWithAuthor;
  }

  /**
   * Buscar post por ID com autor
   */
  async getById(postId: string, userId?: string): Promise<PostWithDetails | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey(
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
      .eq('id', postId)
      .single();

    if (error || !data) {
      return null;
    }

    // Verificar se usuário curtiu (se userId fornecido)
    let userHasLiked = false;
    if (userId) {
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      userHasLiked = !!likeData;
    }

    const author = Array.isArray(data.author) ? data.author[0] : data.author;

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      edited_at: data.edited_at ? new Date(data.edited_at) : null,
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
      user_has_liked: userHasLiked,
    } as PostWithDetails;
  }

  /**
   * Listar posts de uma thread
   */
  async list(query: GetPostsQuery, userId?: string): Promise<PostWithDetails[]> {
    const { threadId, limit = 50, offset = 0, sortBy = 'asc', parentPostId } = query;

    let dbQuery = supabase
      .from('posts')
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey(
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
      .eq('thread_id', threadId);

    // Filtrar por post pai (null = respostas diretas à thread)
    if (parentPostId === null) {
      dbQuery = dbQuery.is('parent_post_id', null);
    } else if (parentPostId) {
      dbQuery = dbQuery.eq('parent_post_id', parentPostId);
    }

    // Ordenação
    dbQuery = dbQuery.order('created_at', { ascending: sortBy === 'asc' });

    // Paginação
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Erro ao listar posts: ${error.message}`);
    }

    // Buscar likes do usuário (se fornecido)
    let userLikes: Set<string> = new Set();
    if (userId && data && data.length > 0) {
      const postIds = data.map((p) => p.id);
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      if (likesData) {
        userLikes = new Set(likesData.map((l) => l.post_id));
      }
    }

    return (data || []).map((post) => {
      const author = Array.isArray(post.author) ? post.author[0] : post.author;

      return {
        ...post,
        created_at: new Date(post.created_at),
        updated_at: new Date(post.updated_at),
        edited_at: post.edited_at ? new Date(post.edited_at) : null,
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
        user_has_liked: userLikes.has(post.id),
      } as PostWithDetails;
    });
  }

  /**
   * Contar posts de uma thread
   */
  async count(threadId: string, parentPostId?: string | null): Promise<number> {
    let dbQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (parentPostId === null) {
      dbQuery = dbQuery.is('parent_post_id', null);
    } else if (parentPostId) {
      dbQuery = dbQuery.eq('parent_post_id', parentPostId);
    }

    const { count, error } = await dbQuery;

    if (error) {
      throw new Error(`Erro ao contar posts: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Atualizar post
   */
  async update(postId: string, content: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', postId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      edited_at: data.edited_at ? new Date(data.edited_at) : null,
    } as Post;
  }

  /**
   * Deletar post
   */
  async delete(postId: string): Promise<boolean> {
    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      throw new Error(`Erro ao deletar post: ${error.message}`);
    }

    return true;
  }

  /**
   * Verificar se usuário é autor do post
   */
  async isAuthor(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.author_id === userId;
  }

  /**
   * Buscar respostas aninhadas de um post
   */
  async getReplies(postId: string, userId?: string): Promise<PostWithDetails[]> {
    return this.list(
      {
        threadId: '', // Não usado aqui
        parentPostId: postId,
      },
      userId
    );
  }

  /**
   * Buscar último post de uma thread
   */
  async getLastPost(threadId: string): Promise<PostWithAuthor | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey(
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
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const author = Array.isArray(data.author) ? data.author[0] : data.author;

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      edited_at: data.edited_at ? new Date(data.edited_at) : null,
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
    } as PostWithAuthor;
  }
}

export const postRepository = new PostRepository();
