import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Tipos das tabelas do banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          name: string;
          email: string;
          password_hash: string;
          invite_code_used: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      profiles: {
        Row: {
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
          role: 'usuario' | 'moderador' | 'admin' | 'vip';
          is_banned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      token_blacklist: {
        Row: {
          id: string;
          token: string;
          user_id: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['token_blacklist']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['token_blacklist']['Insert']>;
      };
      invite_codes: {
        Row: {
          id: string;
          code: string;
          owner_id: string;
          used_by_id: string | null;
          is_active: boolean;
          used_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invite_codes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invite_codes']['Insert']>;
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
      };
    };
  };
}

// Criar cliente Supabase com Service Role Key (bypass RLS)
export const supabase: SupabaseClient<Database> = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Função para testar conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erro ao conectar com Supabase:', error.message);
      return false;
    }
    console.log('📦 Conectado ao Supabase com sucesso');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com Supabase:', err);
    return false;
  }
};