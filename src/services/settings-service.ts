import { settingsRepository } from '../repositories/settings-repository';
import { ApiError } from '../utils/api-error';
import { SystemSetting, SettingKey } from '../types/settings.types';

export class SettingsService {
  async isInviteCodeRequired(): Promise<boolean> {
    return settingsRepository.getBooleanValue('require_invite_code');
  }

  async setInviteCodeRequired(required: boolean, updatedBy: string): Promise<SystemSetting> {
    return settingsRepository.updateValue(
      'require_invite_code',
      required ? 'true' : 'false',
      updatedBy
    );
  }

  async getSetting(key: SettingKey): Promise<SystemSetting> {
    const setting = await settingsRepository.findByKey(key);
    
    if (!setting) {
      throw ApiError.notFound(`Configuração '${key}' não encontrada`);
    }

    return setting;
  }

  async getAllSettings(): Promise<SystemSetting[]> {
    return settingsRepository.getAll();
  }
}

export const settingsService = new SettingsService();