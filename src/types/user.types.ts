export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  password_hash: string;
  invite_code_used: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  username: string;
  name: string;
  email: string;
  password: string;
  inviteCode?: string;
}

export type UserWithoutPassword = Omit<User, 'password_hash'>;