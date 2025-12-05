export interface InviteCode {
  id: string;
  code: string;
  owner_id: string;
  used_by_id: string | null;
  is_active: boolean;
  used_at: Date | null;
  created_at: Date;
}

export interface CreateInviteCodeDTO {
  code: string;
  ownerId: string;
}

export interface UseInviteCodeDTO {
  code: string;
  usedById: string;
}