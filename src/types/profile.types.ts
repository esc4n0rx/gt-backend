export type UserRole = 'usuario' | 'moderador' | 'admin' | 'vip';

export interface Profile {
  id: string;
  user_id: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  signature: string;
  total_posts: number;
  total_likes: number;
  ranking: number;
  level: number;
  role: UserRole;
  is_banned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProfileDTO {
  userId: string;
  avatarUrl?: string;
  bannerUrl?: string;
}