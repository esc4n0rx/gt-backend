import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';
import { sendSuccess } from '../utils/api-response';
import { RegisterInput, LoginInput } from '../validators/auth-validators';
import { verifyToken } from '../config/jwt';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterInput = req.body;
      const result = await authService.register(data);
      sendSuccess(res, result, 'Usuário registrado com sucesso', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginInput = req.body;
      const result = await authService.login(data);
      sendSuccess(res, result, 'Login realizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader!.split(' ')[1];
      const decoded = verifyToken(token);

      // Calcular data de expiração do token
      const expiresAt = new Date(decoded.exp! * 1000);

      await authService.logout(token, decoded.userId, expiresAt);
      sendSuccess(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      // Importação dinâmica para evitar dependência circular
      const { userRepository } = await import('../repositories/user-repository');
      const { profileRepository } = await import('../repositories/profile-repository');

      const user = await userRepository.findById(userId);
      const profile = await profileRepository.findByUserId(userId);

      if (!user || !profile) {
        sendSuccess(res, null, 'Usuário não encontrado', 404);
        return;
      }

      const { password_hash, ...userWithoutPassword } = user;

      sendSuccess(res, { user: userWithoutPassword, profile });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();