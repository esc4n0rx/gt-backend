import { supabase, Database } from '../config/database';
import { User, CreateUserDTO } from '../types/user.types';
import { hashPassword } from '../utils/password';

type UserRow = Database['public']['Tables']['users']['Row'];

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToUser(data);
  }

  async findByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .single();

    if (error || !data) return null;
    return this.mapToUser(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .single();

    if (error || !data) return null;
    return this.mapToUser(data);
  }

  async existsByUsername(username: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('username', username);

    if (error) return false;
    return (count ?? 0) > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('email', email);

    if (error) return false;
    return (count ?? 0) > 0;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const passwordHash = await hashPassword(data.password);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username: data.username,
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        invite_code_used: data.inviteCode || null,
      } as any)
      .select()
      .single();

    if (error || !user) {
      throw new Error(`Falha ao criar usuário: ${error?.message}`);
    }

    return this.mapToUser(user);
  }

  async updateName(userId: string, name: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ name } as any)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar nome: ${error?.message}`);
    }

    return this.mapToUser(data);
  }

  async updateEmail(userId: string, email: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ email } as any)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar email: ${error?.message}`);
    }

    return this.mapToUser(data);
  }

  async updatePassword(userId: string, newPassword: string): Promise<User> {
    const passwordHash = await hashPassword(newPassword);

    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash } as any)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar senha: ${error?.message}`);
    }

    return this.mapToUser(data);
  }

  private mapToUser(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      invite_code_used: row.invite_code_used,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

export const userRepository = new UserRepository();