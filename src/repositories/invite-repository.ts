import { supabase, Database } from '../config/database';
import { InviteCode, CreateInviteCodeDTO } from '../types/invite.types';

type InviteCodeRow = Database['public']['Tables']['invite_codes']['Row'];

export class InviteRepository {
  async findByCode(code: string): Promise<InviteCode | null> {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) return null;
    return this.mapToInviteCode(data);
  }

  async findActiveByCode(code: string): Promise<InviteCode | null> {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return this.mapToInviteCode(data);
  }

  async findByOwnerId(ownerId: string): Promise<InviteCode[]> {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToInviteCode);
  }

  async existsByCode(code: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('invite_codes')
      .select('*', { count: 'exact', head: true })
      .eq('code', code.toUpperCase());

    if (error) return false;
    return (count ?? 0) > 0;
  }

  async create(data: CreateInviteCodeDTO): Promise<InviteCode> {
    const { data: inviteCode, error } = await supabase
      .from('invite_codes')
      .insert({
        code: data.code.toUpperCase(),
        owner_id: data.ownerId,
        is_active: true,
        used_by_id: null,
        used_at: null,
      }as any)
      .select()
      .single();

    if (error || !inviteCode) {
      throw new Error(`Falha ao criar invite code: ${error?.message}`);
    }

    return this.mapToInviteCode(inviteCode);
  }

  async markAsUsed(code: string, usedById: string): Promise<InviteCode> {
    const updateData: Database['public']['Tables']['invite_codes']['Update'] = {
      is_active: false,
      used_by_id: usedById,
      used_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('invite_codes')
      // @ts-ignore - Supabase type inference issue with Update types
      .update(updateData)
      .eq('code', code.toUpperCase())
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao marcar invite code como usado: ${error?.message}`);
    }

    return this.mapToInviteCode(data);
  }

  async countActiveByOwnerId(ownerId: string): Promise<number> {
    const { count, error } = await supabase
      .from('invite_codes')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', ownerId)
      .eq('is_active', true);

    if (error) return 0;
    return count ?? 0;
  }

  private mapToInviteCode(row: InviteCodeRow): InviteCode {
    return {
      id: row.id,
      code: row.code,
      owner_id: row.owner_id,
      used_by_id: row.used_by_id,
      is_active: row.is_active,
      used_at: row.used_at ? new Date(row.used_at) : null,
      created_at: new Date(row.created_at),
    };
  }
}

export const inviteRepository = new InviteRepository();