import { UserWithoutPassword } from './user.types';
import { Profile } from './profile.types';

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  name: string;
  email: string;
  password: string;
  inviteCode?: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  profile: Profile;
  token: string;
}

export interface TokenBlacklist {
  id: string;
  token: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}