import { Request, Response, NextFunction } from 'express';
import { inviteService } from '../services/invite-service';
import { settingsService } from '../services/settings-service';
import { sendSuccess } from '../utils/api-response';

export class InviteController {
  async getMyInviteCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const inviteCodes = await inviteService.getUserInviteCodes(userId);
      
      sendSuccess(res, { inviteCodes });
    } catch (error) {
      next(error);
    }
  }

  async validateInviteCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const inviteCode = await inviteService.validateInviteCode(code);
      
      sendSuccess(res, { 
        valid: true, 
        inviteCode: {
          code: inviteCode.code,
          is_active: inviteCode.is_active,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getRegistrationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requireInviteCode = await settingsService.isInviteCodeRequired();
      
      sendSuccess(res, {
        requireInviteCode,
        registrationOpen: !requireInviteCode,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inviteController = new InviteController();