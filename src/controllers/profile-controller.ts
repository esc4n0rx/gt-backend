import { Request, Response, NextFunction } from 'express';
import { profileService } from '../services/profile-service';
import { sendSuccess, sendError } from '../utils/api-response';
import { ApiError } from '../utils/api-error';

/**
 * Controlador de perfis
 */
export class ProfileController {
  /**
   * GET /api/v1/profile - Busca perfil do usuário autenticado
   */
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await profileService.getProfile(userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile - Atualiza nome e/ou bio
   */
  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await profileService.updateProfile(userId, req.body);
      sendSuccess(res, result, 'Perfil atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/avatar - Upload de avatar
   */
  async updateAvatar(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        throw ApiError.badRequest('Nenhum arquivo enviado');
      }

      // Valida tipo de arquivo (imagem)
      if (!req.file.mimetype.startsWith('image/')) {
        throw ApiError.badRequest('Apenas imagens são permitidas');
      }

      // Valida tamanho (máx 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        throw ApiError.badRequest('Imagem muito grande (máx 5MB)');
      }

      const profile = await profileService.updateAvatar(
        userId,
        req.file.buffer
      );
      sendSuccess(res, { profile }, 'Avatar atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/banner - Upload de banner
   */
  async updateBanner(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        throw ApiError.badRequest('Nenhum arquivo enviado');
      }

      // Valida tipo de arquivo (imagem)
      if (!req.file.mimetype.startsWith('image/')) {
        throw ApiError.badRequest('Apenas imagens são permitidas');
      }

      // Valida tamanho (máx 10MB)
      if (req.file.size > 10 * 1024 * 1024) {
        throw ApiError.badRequest('Imagem muito grande (máx 10MB)');
      }

      const profile = await profileService.updateBanner(
        userId,
        req.file.buffer
      );
      sendSuccess(res, { profile }, 'Banner atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/signature - Upload de assinatura
   */
  async updateSignature(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        throw ApiError.badRequest('Nenhum arquivo enviado');
      }

      // Valida tipo de arquivo (imagem ou GIF)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw ApiError.badRequest('Apenas PNG, JPG e GIF são permitidos');
      }

      // Valida tamanho (máx 2MB)
      if (req.file.size > 2 * 1024 * 1024) {
        throw ApiError.badRequest('Arquivo muito grande (máx 2MB)');
      }

      const profile = await profileService.updateSignature(
        userId,
        req.file.buffer
      );
      sendSuccess(res, { profile }, 'Assinatura atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/profile/signature - Remove assinatura
   */
  async removeSignature(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await profileService.removeSignature(userId);
      sendSuccess(res, { profile }, 'Assinatura removida com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/email/request - Solicita alteração de email
   */
  async requestEmailChange(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await profileService.requestEmailChange(userId, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/email/confirm - Confirma alteração de email
   */
  async confirmEmailChange(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { code } = req.body;
      const result = await profileService.confirmEmailChange(userId, code);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/password/request - Solicita alteração de senha
   */
  async requestPasswordChange(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await profileService.requestPasswordChange(
        userId,
        req.body
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/password/confirm - Confirma alteração de senha
   */
  async confirmPasswordChange(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { code } = req.body;
      const result = await profileService.confirmPasswordChange(userId, code);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
