import { supabase } from '../config/database';
import { LikeStatusResponse, LikeUser } from '../types/like.types';

export class LikeRepository {
  // ==================== LIKES EM THREADS ====================

  /**
   * Curtir thread
   */
  async likeThread(threadId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('thread_likes').insert({
      thread_id: threadId,
      user_id: userId,
    });

    if (error) {
      // Se erro for de duplicata (já curtiu), retornar false
      if (error.code === '23505') {
        return false;
      }
      throw new Error(`Erro ao curtir thread: ${error.message}`);
    }

    return true;
  }

  /**
   * Descurtir thread
   */
  async unlikeThread(threadId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('thread_likes')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao descurtir thread: ${error.message}`);
    }

    return true;
  }

  /**
   * Verificar se usuário curtiu thread
   */
  async hasLikedThread(threadId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('thread_likes')
      .select('id')
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /**
   * Contar likes de uma thread
   */
  async countThreadLikes(threadId: string): Promise<number> {
    const { count, error } = await supabase
      .from('thread_likes')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (error) {
      throw new Error(`Erro ao contar likes: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Obter status de like da thread (curtiu + contagem)
   */
  async getThreadLikeStatus(threadId: string, userId?: string): Promise<LikeStatusResponse> {
    const likeCount = await this.countThreadLikes(threadId);
    let hasLiked = false;

    if (userId) {
      hasLiked = await this.hasLikedThread(threadId, userId);
    }

    return {
      hasLiked,
      likeCount,
    };
  }

  /**
   * Listar usuários que curtiram thread
   */
  async getThreadLikes(
    threadId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LikeUser[]> {
    const { data, error } = await supabase
      .from('thread_likes')
      .select(
        `
        user_id,
        created_at,
        profile:profiles!thread_likes_user_id_fkey(
          username,
          avatar_url,
          role
        )
      `
      )
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Erro ao listar likes: ${error.message}`);
    }

    return (data || []).map((like) => {
      const profile = Array.isArray(like.profile) ? like.profile[0] : like.profile;
      return {
        user_id: like.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        created_at: new Date(like.created_at),
      };
    });
  }

  // ==================== LIKES EM POSTS ====================

  /**
   * Curtir post
   */
  async likePost(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: userId,
    });

    if (error) {
      // Se erro for de duplicata (já curtiu), retornar false
      if (error.code === '23505') {
        return false;
      }
      throw new Error(`Erro ao curtir post: ${error.message}`);
    }

    return true;
  }

  /**
   * Descurtir post
   */
  async unlikePost(postId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao descurtir post: ${error.message}`);
    }

    return true;
  }

  /**
   * Verificar se usuário curtiu post
   */
  async hasLikedPost(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /**
   * Contar likes de um post
   */
  async countPostLikes(postId: string): Promise<number> {
    const { count, error } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      throw new Error(`Erro ao contar likes: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Obter status de like do post (curtiu + contagem)
   */
  async getPostLikeStatus(postId: string, userId?: string): Promise<LikeStatusResponse> {
    const likeCount = await this.countPostLikes(postId);
    let hasLiked = false;

    if (userId) {
      hasLiked = await this.hasLikedPost(postId, userId);
    }

    return {
      hasLiked,
      likeCount,
    };
  }

  /**
   * Listar usuários que curtiram post
   */
  async getPostLikes(
    postId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<LikeUser[]> {
    const { data, error } = await supabase
      .from('post_likes')
      .select(
        `
        user_id,
        created_at,
        profile:profiles!post_likes_user_id_fkey(
          username,
          avatar_url,
          role
        )
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Erro ao listar likes: ${error.message}`);
    }

    return (data || []).map((like) => {
      const profile = Array.isArray(like.profile) ? like.profile[0] : like.profile;
      return {
        user_id: like.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: profile.role,
        created_at: new Date(like.created_at),
      };
    });
  }

  // ==================== OPERAÇÕES MÚLTIPLAS ====================

  /**
   * Toggle like em thread (curtir se não curtiu, descurtir se curtiu)
   */
  async toggleThreadLike(threadId: string, userId: string): Promise<boolean> {
    const hasLiked = await this.hasLikedThread(threadId, userId);

    if (hasLiked) {
      await this.unlikeThread(threadId, userId);
      return false; // Descurtiu
    } else {
      await this.likeThread(threadId, userId);
      return true; // Curtiu
    }
  }

  /**
   * Toggle like em post (curtir se não curtiu, descurtir se curtiu)
   */
  async togglePostLike(postId: string, userId: string): Promise<boolean> {
    const hasLiked = await this.hasLikedPost(postId, userId);

    if (hasLiked) {
      await this.unlikePost(postId, userId);
      return false; // Descurtiu
    } else {
      await this.likePost(postId, userId);
      return true; // Curtiu
    }
  }

  /**
   * Obter likes de múltiplas threads de uma vez
   */
  async getMultipleThreadLikes(
    threadIds: string[],
    userId?: string
  ): Promise<Map<string, LikeStatusResponse>> {
    const result = new Map<string, LikeStatusResponse>();

    // Contar likes de cada thread
    const { data: counts } = await supabase
      .from('thread_likes')
      .select('thread_id')
      .in('thread_id', threadIds);

    const likeCounts = new Map<string, number>();
    counts?.forEach((like) => {
      const current = likeCounts.get(like.thread_id) || 0;
      likeCounts.set(like.thread_id, current + 1);
    });

    // Verificar quais o usuário curtiu (se fornecido)
    let userLikes = new Set<string>();
    if (userId) {
      const { data: likes } = await supabase
        .from('thread_likes')
        .select('thread_id')
        .eq('user_id', userId)
        .in('thread_id', threadIds);

      userLikes = new Set(likes?.map((l) => l.thread_id) || []);
    }

    // Montar resultado
    threadIds.forEach((threadId) => {
      result.set(threadId, {
        hasLiked: userLikes.has(threadId),
        likeCount: likeCounts.get(threadId) || 0,
      });
    });

    return result;
  }
}

export const likeRepository = new LikeRepository();
