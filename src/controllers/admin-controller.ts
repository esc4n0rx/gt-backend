import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings-service';
import { sendSuccess } from '../utils/api-response';
import { ToggleInviteRequirementInput } from '../validators/admin-validators';

export class AdminController {
  async toggleInviteRequirement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { required }: ToggleInviteRequirementInput = req.body;
      const userId = req.user!.userId;

      const setting = await settingsService.setInviteCodeRequired(required, userId);

      sendSuccess(res, {
        requireInviteCode: setting.value === 'true',
        message: required
          ? 'Registro agora exige código de convite'
          : 'Registro agora está aberto para todos',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getAllSettings();
      
      sendSuccess(res, { settings });
    } catch (error) {
      next(error);
    }
  }

  async getRegistrationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requireInviteCode = await settingsService.isInviteCodeRequired();
      
      sendSuccess(res, {
        requireInviteCode,
        registrationOpen: !requireInviteCode,
      });
    } catch (error) {
    next(error);
}}}
export const adminController = new AdminController();