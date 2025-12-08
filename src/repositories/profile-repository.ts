import { supabase, Database } from '../config/database';
import { Profile, CreateProfileDTO } from '../types/profile.types';
import { env } from '../config/env';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export class ProfileRepository {
  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return this.mapToProfile(data);
  }

  async create(data: CreateProfileDTO): Promise<Profile> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: data.userId,
        avatar_url: data.avatarUrl || env.DEFAULT_AVATAR_URL,
        banner_url: data.bannerUrl || env.DEFAULT_BANNER_URL,
        bio: '',
        signature: '',
        total_posts: 0,
        total_likes: 0,
        ranking: 0,
        level: 0,
        role: 'usuario',
        is_banned: false,
      }as any)
      .select()
      .single();

    if (error || !profile) {
      throw new Error(`Falha ao criar perfil: ${error?.message}`);
    }

    return this.mapToProfile(profile);
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar avatar: ${error?.message}`);
    }

    return this.mapToProfile(data);
  }

  async updateBanner(userId: string, bannerUrl: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ banner_url: bannerUrl })
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar banner: ${error?.message}`);
    }

    return this.mapToProfile(data);
  }

  async updateSignature(userId: string, signatureUrl: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ signature: signatureUrl })
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar assinatura: ${error?.message}`);
    }

    return this.mapToProfile(data);
  }

  async updateBio(userId: string, bio: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ bio })
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar bio: ${error?.message}`);
    }

    return this.mapToProfile(data);
  }

  private mapToProfile(row: ProfileRow): Profile {
    return {
      id: row.id,
      user_id: row.user_id,
      avatar_url: row.avatar_url,
      banner_url: row.banner_url,
      bio: row.bio,
      signature: row.signature,
      total_posts: row.total_posts,
      total_likes: row.total_likes,
      ranking: row.ranking,
      level: row.level,
      role: row.role,
      is_banned: row.is_banned,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

export const profileRepository = new ProfileRepository();