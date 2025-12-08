import { supabase } from '../config/database';

export interface VerificationCode {
  id: string;
  user_id: string;
  code: string;
  type: 'email_change' | 'password_change';
  new_value: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export interface CreateVerificationCodeDTO {
  userId: string;
  code: string;
  type: 'email_change' | 'password_change';
  newValue: string;
  expiresAt: Date;
}

export class VerificationCodeRepository {
  /**
   * Cria um novo código de verificação
   */
  async create(data: CreateVerificationCodeDTO): Promise<VerificationCode> {
    const { data: code, error } = await supabase
      .from('verification_codes')
      .insert({
        user_id: data.userId,
        code: data.code,
        type: data.type,
        new_value: data.newValue,
        expires_at: data.expiresAt.toISOString(),
        is_used: false,
      } as any)
      .select()
      .single();

    if (error || !code) {
      throw new Error(`Falha ao criar código de verificação: ${error?.message}`);
    }

    return this.mapToVerificationCode(code);
  }

  /**
   * Busca código por valor e tipo
   */
  async findByCodeAndType(
    code: string,
    type: 'email_change' | 'password_change'
  ): Promise<VerificationCode | null> {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('code', code)
      .eq('type', type)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return this.mapToVerificationCode(data);
  }

  /**
   * Marca código como usado
   */
  async markAsUsed(id: string): Promise<void> {
    const { error } = await supabase
      .from('verification_codes')
      .update({ is_used: true } as any)
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao marcar código como usado: ${error.message}`);
    }
  }

  /**
   * Deleta códigos pendentes de um usuário para um tipo específico
   */
  async deletePendingByUserAndType(
    userId: string,
    type: 'email_change' | 'password_change'
  ): Promise<void> {
    await supabase
      .from('verification_codes')
      .delete()
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_used', false);
  }

  private mapToVerificationCode(row: any): VerificationCode {
    return {
      id: row.id,
      user_id: row.user_id,
      code: row.code,
      type: row.type,
      new_value: row.new_value,
      expires_at: new Date(row.expires_at),
      is_used: row.is_used,
      created_at: new Date(row.created_at),
    };
  }
}

export const verificationCodeRepository = new VerificationCodeRepository();
