import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { profileRepository } from '../repositories/profile-repository';

export const adminMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Não autenticado');
    }

    const profile = await profileRepository.findByUserId(req.user.userId);

    if (!profile) {
      throw ApiError.notFound('Perfil não encontrado');
    }

    if (profile.role !== 'admin') {
      throw ApiError.forbidden('Acesso restrito a administradores');
    }

    next();
  } catch (error) {
    next(error);
  }
};