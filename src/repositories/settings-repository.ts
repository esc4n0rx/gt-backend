import { supabase, Database } from '../config/database';
import { SystemSetting, SettingKey } from '../types/settings.types';

type SettingRow = Database['public']['Tables']['system_settings']['Row'];

export class SettingsRepository {
  async findByKey(key: SettingKey): Promise<SystemSetting | null> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return this.mapToSetting(data);
  }

  async getValue(key: SettingKey): Promise<string | null> {
    const setting = await this.findByKey(key);
    return setting?.value ?? null;
  }

  async getBooleanValue(key: SettingKey): Promise<boolean> {
    const value = await this.getValue(key);
    return value === 'true';
  }

  async updateValue(key: SettingKey, value: string, updatedBy: string): Promise<SystemSetting> {
    const updateData: Database['public']['Tables']['system_settings']['Update'] = {
      value,
      updated_by: updatedBy,
    };

    const { data, error } = await supabase
      .from('system_settings')
      // @ts-ignore - Supabase type inference issue with Update types
      .update(updateData)
      .eq('key', key)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Falha ao atualizar configuração: ${error?.message}`);
    }

    return this.mapToSetting(data);
  }

  async getAll(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error || !data) return [];
    return data.map(this.mapToSetting);
  }

  private mapToSetting(row: SettingRow): SystemSetting {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      updated_by: row.updated_by,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}

export const settingsRepository = new SettingsRepository();