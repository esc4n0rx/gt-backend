import { supabase } from '../config/database';
import { ContentCache, CreateCacheDto, ContentSource, CacheStats } from '../types/external-api.types';

export class ContentCacheRepository {
  /**
   * Buscar cache por source e external_id
   */
  async findBySourceAndId(source: ContentSource, externalId: string): Promise<ContentCache | null> {
    const { data, error } = await supabase
      .from('content_cache')
      .select('*')
      .eq('source', source)
      .eq('external_id', externalId)
      .gt('expires_at', new Date().toISOString()) // Apenas cache válido
      .single();

    if (error || !data) {
      return null;
    }

    // Incrementar hits
    await supabase.rpc('increment_cache_hits', { cache_id_param: data.id });

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      expires_at: new Date(data.expires_at),
    } as ContentCache;
  }

  /**
   * Criar novo cache
   */
  async create(dto: CreateCacheDto): Promise<ContentCache> {
    const expiresInDays = dto.expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('content_cache')
      .insert({
        source: dto.source,
        external_id: dto.externalId,
        search_query: dto.searchQuery,
        content_data: dto.contentData,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Erro ao criar cache: ${error?.message || 'Cache não retornado'}`);
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      expires_at: new Date(data.expires_at),
    } as ContentCache;
  }

  /**
   * Atualizar cache existente
   */
  async update(source: ContentSource, externalId: string, contentData: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Renovar por mais 30 dias

    await supabase
      .from('content_cache')
      .update({
        content_data: contentData,
        expires_at: expiresAt.toISOString(),
      })
      .eq('source', source)
      .eq('external_id', externalId);
  }

  /**
   * Upsert (insert ou update)
   */
  async upsert(dto: CreateCacheDto): Promise<ContentCache> {
    // Verificar se já existe
    const existing = await this.findBySourceAndId(dto.source, dto.externalId);

    if (existing) {
      // Atualizar
      await this.update(dto.source, dto.externalId, dto.contentData);
      return existing;
    }

    // Criar novo
    return this.create(dto);
  }

  /**
   * Deletar cache por source e external_id
   */
  async delete(source: ContentSource, externalId: string): Promise<boolean> {
    const { error } = await supabase
      .from('content_cache')
      .delete()
      .eq('source', source)
      .eq('external_id', externalId);

    if (error) {
      throw new Error(`Erro ao deletar cache: ${error.message}`);
    }

    return true;
  }

  /**
   * Limpar cache expirado
   */
  async cleanupExpired(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_expired_cache');

    if (error) {
      throw new Error(`Erro ao limpar cache: ${error.message}`);
    }

    return data || 0;
  }

  /**
   * Obter estatísticas do cache
   */
  async getStats(): Promise<CacheStats[]> {
    const { data, error } = await supabase.rpc('get_cache_stats');

    if (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }

    return (data || []).map((stat: any) => ({
      source: stat.source,
      total_entries: parseInt(stat.total_entries),
      total_hits: parseInt(stat.total_hits),
      avg_hits: parseFloat(stat.avg_hits),
      oldest_entry: new Date(stat.oldest_entry),
      newest_entry: new Date(stat.newest_entry),
    }));
  }

  /**
   * Listar cache mais acessado
   */
  async getMostAccessed(limit: number = 20): Promise<ContentCache[]> {
    const { data, error } = await supabase
      .from('content_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('hits', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erro ao listar cache: ${error.message}`);
    }

    return (data || []).map((item) => ({
      ...item,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
      expires_at: new Date(item.expires_at),
    }));
  }

  /**
   * Contar total de cache por source
   */
  async countBySource(source: ContentSource): Promise<number> {
    const { count, error } = await supabase
      .from('content_cache')
      .select('id', { count: 'exact', head: true })
      .eq('source', source)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Erro ao contar cache: ${error.message}`);
    }

    return count || 0;
  }
}

export const contentCacheRepository = new ContentCacheRepository();
