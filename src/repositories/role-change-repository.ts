import { supabase } from '../config/database';
import { UserRole } from '../middlewares/role-middleware';

// Tipos para mudanças de cargo
export interface RoleChange {
  id: string;
  target_user_id: string;
  changed_by_user_id: string;
  old_role: UserRole;
  new_role: UserRole;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateRoleChangeDTO {
  targetUserId: string;
  changedByUserId: string;
  oldRole: UserRole;
  newRole: UserRole;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RoleChangeRepository {
  // Criar registro de mudança de cargo
  async create(data: CreateRoleChangeDTO): Promise<RoleChange> {
    const { data: roleChange, error } = await supabase
      .from('role_changes')
      .insert({
        target_user_id: data.targetUserId,
        changed_by_user_id: data.changedByUserId,
        old_role: data.oldRole,
        new_role: data.newRole,
        reason: data.reason || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      } as any)
      .select()
      .single();

    if (error || !roleChange) {
      throw new Error(`Falha ao registrar mudança de cargo: ${error?.message}`);
    }

    return this.mapToRoleChange(roleChange);
  }

  // Buscar histórico de mudanças de cargo de um usuário
  async findByUserId(userId: string, limit: number = 50): Promise<RoleChange[]> {
    const { data, error } = await supabase
      .from('role_changes')
      .select(`
        *,
        target_user:users!role_changes_target_user_id_fkey(id, username, name),
        changed_by:users!role_changes_changed_by_user_id_fkey(id, username, name)
      `)
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((change) => this.mapToRoleChange(change));
  }

  // Buscar mudanças realizadas por um administrador
  async findByChangedBy(changedByUserId: string, limit: number = 50): Promise<RoleChange[]> {
    const { data, error } = await supabase
      .from('role_changes')
      .select(`
        *,
        target_user:users!role_changes_target_user_id_fkey(id, username, name),
        changed_by:users!role_changes_changed_by_user_id_fkey(id, username, name)
      `)
      .eq('changed_by_user_id', changedByUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((change) => this.mapToRoleChange(change));
  }

  // Listar todas as mudanças de cargo recentes (com paginação)
  async listRecent(limit: number = 50, offset: number = 0): Promise<RoleChange[]> {
    const { data, error } = await supabase
      .from('role_changes')
      .select(`
        *,
        target_user:users!role_changes_target_user_id_fkey(id, username, name),
        changed_by:users!role_changes_changed_by_user_id_fkey(id, username, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) return [];
    return data.map((change) => this.mapToRoleChange(change));
  }

  // Buscar última mudança de cargo de um usuário
  async findLastByUserId(userId: string): Promise<RoleChange | null> {
    const { data, error } = await supabase
      .from('role_changes')
      .select('*')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return this.mapToRoleChange(data);
  }

  // Contar mudanças de cargo de um usuário
  async countByUserId(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('role_changes')
      .select('id', { count: 'exact', head: true })
      .eq('target_user_id', userId);

    if (error) return 0;
    return count || 0;
  }

  // Estatísticas de mudanças de cargo
  async getStats(): Promise<{
    total: number;
    last24h: number;
    last7days: number;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { count: total } = await supabase
      .from('role_changes')
      .select('id', { count: 'exact', head: true });

    const { count: count24h } = await supabase
      .from('role_changes')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24h.toISOString());

    const { count: count7days } = await supabase
      .from('role_changes')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last7days.toISOString());

    return {
      total: total || 0,
      last24h: count24h || 0,
      last7days: count7days || 0,
    };
  }

  private mapToRoleChange(row: any): RoleChange {
    return {
      id: row.id,
      target_user_id: row.target_user_id,
      changed_by_user_id: row.changed_by_user_id,
      old_role: row.old_role as UserRole,
      new_role: row.new_role as UserRole,
      reason: row.reason,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: new Date(row.created_at),
    };
  }
}

export const roleChangeRepository = new RoleChangeRepository();
