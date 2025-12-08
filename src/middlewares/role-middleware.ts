import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { profileRepository } from '../repositories/profile-repository';

// Definição dos cargos disponíveis
export type UserRole = 'usuario' | 'vip' | 'uploader' | 'suporte' | 'moderador' | 'admin' | 'master';

// Hierarquia de cargos (maior número = mais poder)
const roleHierarchy: Record<UserRole, number> = {
  master: 6,
  admin: 5,
  moderador: 4,
  suporte: 3,
  uploader: 2,
  usuario: 1,
  vip: 1, // Mesmo nível que usuário
};

// Função para obter o nível hierárquico de um cargo
export const getRoleHierarchy = (role: UserRole): number => {
  return roleHierarchy[role] || 0;
};

// Função para verificar se um usuário pode gerenciar outro
export const canManageUser = (managerRole: UserRole, targetRole: UserRole): boolean => {
  return getRoleHierarchy(managerRole) > getRoleHierarchy(targetRole);
};

// Função para verificar se um usuário pode banir outro
export const canBanUser = (bannerRole: UserRole, targetRole: UserRole): boolean => {
  const bannerLevel = getRoleHierarchy(bannerRole);
  const targetLevel = getRoleHierarchy(targetRole);

  // Apenas Master, Admin e Moderador podem banir
  if (bannerLevel < 4) {
    return false;
  }

  // Master bane todos
  if (bannerRole === 'master') {
    return true;
  }

  // Admin bane de moderador para baixo
  if (bannerRole === 'admin') {
    return targetLevel <= 4;
  }

  // Moderador bane de suporte para baixo
  if (bannerRole === 'moderador') {
    return targetLevel <= 3;
  }

  return false;
};

// Middleware para verificar se o usuário tem um cargo específico ou superior
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Não autenticado');
      }

      const profile = await profileRepository.findByUserId(req.user.userId);

      if (!profile) {
        throw ApiError.notFound('Perfil não encontrado');
      }

      if (profile.is_banned) {
        throw ApiError.forbidden('Usuário banido');
      }

      const userRole = profile.role as UserRole;
      const userLevel = getRoleHierarchy(userRole);

      // Verificar se o usuário tem um dos cargos permitidos ou superior
      const hasPermission = allowedRoles.some(role => {
        const requiredLevel = getRoleHierarchy(role);
        return userLevel >= requiredLevel;
      });

      if (!hasPermission) {
        throw ApiError.forbidden(`Acesso restrito. Cargos permitidos: ${allowedRoles.join(', ')}`);
      }

      // Adicionar informações do perfil na requisição
      req.user.role = userRole;
      req.user.profile = profile;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware para verificar se o usuário é Master
export const requireMaster = requireRole('master');

// Middleware para verificar se o usuário é Admin ou superior
export const requireAdmin = requireRole('admin');

// Middleware para verificar se o usuário é Moderador ou superior
export const requireModerator = requireRole('moderador');

// Middleware para verificar se o usuário é Suporte ou superior
export const requireSupport = requireRole('suporte');

// Middleware para verificar se o usuário pode gerenciar outro usuário
export const canManageMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.role) {
      throw ApiError.unauthorized('Não autenticado');
    }

    const targetUserId = req.params.userId || req.body.targetUserId;

    if (!targetUserId) {
      throw ApiError.badRequest('ID do usuário alvo não fornecido');
    }

    const targetProfile = await profileRepository.findByUserId(targetUserId);

    if (!targetProfile) {
      throw ApiError.notFound('Usuário alvo não encontrado');
    }

    const managerRole = req.user.role as UserRole;
    const targetRole = targetProfile.role as UserRole;

    if (!canManageUser(managerRole, targetRole)) {
      throw ApiError.forbidden('Você não tem permissão para gerenciar este usuário');
    }

    // Adicionar informações do usuário alvo na requisição
    req.body.targetProfile = targetProfile;

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar se o usuário pode banir outro usuário
export const canBanMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.role) {
      throw ApiError.unauthorized('Não autenticado');
    }

    const targetUserId = req.params.userId || req.body.targetUserId;

    if (!targetUserId) {
      throw ApiError.badRequest('ID do usuário alvo não fornecido');
    }

    const targetProfile = await profileRepository.findByUserId(targetUserId);

    if (!targetProfile) {
      throw ApiError.notFound('Usuário alvo não encontrado');
    }

    const bannerRole = req.user.role as UserRole;
    const targetRole = targetProfile.role as UserRole;

    if (!canBanUser(bannerRole, targetRole)) {
      throw ApiError.forbidden('Você não tem permissão para banir este usuário');
    }

    // Adicionar informações do usuário alvo na requisição
    req.body.targetProfile = targetProfile;

    next();
  } catch (error) {
    next(error);
  }
};

// Adicionar tipos ao Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role?: UserRole;
        profile?: any;
      };
    }
  }
}
