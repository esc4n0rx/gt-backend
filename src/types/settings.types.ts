export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export type SettingKey = 'require_invite_code';

export interface UpdateSettingDTO {
  key: SettingKey;
  value: string;
  updatedBy: string;
}