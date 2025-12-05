import { inviteRepository } from '../repositories/invite-repository';
import { generateUniqueInviteCode } from '../utils/generate-code';
import { ApiError } from '../utils/api-error';
import { InviteCode } from '../types/invite.types';

export class InviteService {
  async createInviteCode(ownerId: string): Promise<InviteCode> {
    const code = await generateUniqueInviteCode(
      (code) => inviteRepository.existsByCode(code)
    );

    return inviteRepository.create({
      code,
      ownerId,
    });
  }

  async validateInviteCode(code: string): Promise<InviteCode> {
    const inviteCode = await inviteRepository.findActiveByCode(code);

    if (!inviteCode) {
      throw ApiError.badRequest('Código de convite inválido ou já utilizado');
    }

    return inviteCode;
  }

  async useInviteCode(code: string, usedById: string): Promise<InviteCode> {
    await this.validateInviteCode(code);

    return inviteRepository.markAsUsed(code, usedById);
  }

  async getUserInviteCodes(userId: string): Promise<InviteCode[]> {
    return inviteRepository.findByOwnerId(userId);
  }

  async getActiveInviteCodesCount(userId: string): Promise<number> {
    return inviteRepository.countActiveByOwnerId(userId);
  }
}

export const inviteService = new InviteService();