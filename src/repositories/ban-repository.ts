import { supabase } from '../config/database';

// Tipos para banimentos
export interface Ban {
  id: string;
  target_user_id: string;
  banned_by_user_id: string;
  reason: string;
  ip_address: string | null;
  user_agent: string | null;
  is_permanent: boolean;
  expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBanDTO {
  targetUserId: string;
  bannedByUserId: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
  isPermanent: boolean;
  expiresAt?: Date;
}

export interface Unban {
  id: string;
  ban_id: string;
  target_user_id: string;
  unbanned_by_user_id: string;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateUnbanDTO {
  banId: string;
  targetUserId: string;
  unbannedByUserId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class BanRepository {
  // Criar um novo banimento
  async create(data: CreateBanDTO): Promise<Ban> {
    // Desativar banimentos anteriores
    await supabase
      .from('bans')
      .update({ is_active: false })
      .eq('target_user_id', data.targetUserId)
      .eq('is_active', true);

    const { data: ban, error } = await supabase
      .from('bans')
      .insert({
        target_user_id: data.targetUserId,
        banned_by_user_id: data.bannedByUserId,
        reason: data.reason,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        is_permanent: data.isPermanent,
        expires_at: data.expiresAt ? data.expiresAt.toISOString() : null,
        is_active: true,
      } as any)
      .select()
      .single();

    if (error || !ban) {
      throw new Error(`Falha ao criar banimento: ${error?.message}`);
    }

    return this.mapToBan(ban);
  }

  // Buscar banimento ativo de um usuário
  async findActiveByUserId(userId: string): Promise<Ban | null> {
    const { data, error } = await supabase
      .from('bans')
      .select('*')
      .eq('target_user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapToBan(data);
  }

  // Buscar todos os banimentos de um usuário (histórico)
  async findAllByUserId(userId: string): Promise<Ban[]> {
    const { data, error } = await supabase
      .from('bans')
      .select('*')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((ban) => this.mapToBan(ban));
  }

  // Buscar banimento por ID
  async findById(banId: string): Promise<Ban | null> {
    const { data, error } = await supabase
      .from('bans')
      .select('*')
      .eq('id', banId)
      .single();

    if (error || !data) return null;
    return this.mapToBan(data);
  }

  // Listar todos os banimentos ativos (com paginação)
  async listActive(limit: number = 50, offset: number = 0): Promise<Ban[]> {
    const { data, error } = await supabase
      .from('bans')
      .select(`
        *,
        target_user:users!bans_target_user_id_fkey(id, username, name),
        banned_by:users!bans_banned_by_user_id_fkey(id, username, name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) return [];
    return data.map((ban) => this.mapToBan(ban));
  }

  // Desativar banimento (desbanir usuário)
  async deactivate(banId: string): Promise<Ban> {
    const { data, error } = await supabase
      .from('bans')
      .update({ is_active: false })
      .eq('id', banId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao desativar banimento: ${error?.message}`);
    }

    return this.mapToBan(data);
  }

  // Criar registro de desbanimento
  async createUnban(data: CreateUnbanDTO): Promise<Unban> {
    const { data: unban, error } = await supabase
      .from('unbans')
      .insert({
        ban_id: data.banId,
        target_user_id: data.targetUserId,
        unbanned_by_user_id: data.unbannedByUserId,
        reason: data.reason || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      } as any)
      .select()
      .single();

    if (error || !unban) {
      throw new Error(`Falha ao criar registro de desbanimento: ${error?.message}`);
    }

    return this.mapToUnban(unban);
  }

  // Buscar histórico de desbanimentos de um usuário
  async findUnbansByUserId(userId: string): Promise<Unban[]> {
    const { data, error } = await supabase
      .from('unbans')
      .select('*')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((unban) => this.mapToUnban(unban));
  }

  // Verificar se usuário está banido
  async isBanned(userId: string): Promise<boolean> {
    const ban = await this.findActiveByUserId(userId);
    return ban !== null && ban.is_active;
  }

  // Expirar banimentos temporários (executar via cron)
  async expireTemporaryBans(): Promise<number> {
    const { data, error } = await supabase.rpc('expire_temporary_bans');

    if (error) {
      throw new Error(`Falha ao expirar banimentos: ${error?.message}`);
    }

    return data || 0;
  }

  private mapToBan(row: any): Ban {
    return {
      id: row.id,
      target_user_id: row.target_user_id,
      banned_by_user_id: row.banned_by_user_id,
      reason: row.reason,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      is_permanent: row.is_permanent,
      expires_at: row.expires_at ? new Date(row.expires_at) : null,
      is_active: row.is_active,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  private mapToUnban(row: any): Unban {
    return {
      id: row.id,
      ban_id: row.ban_id,
      target_user_id: row.target_user_id,
      unbanned_by_user_id: row.unbanned_by_user_id,
      reason: row.reason,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: new Date(row.created_at),
    };
  }
}

export const banRepository = new BanRepository();
