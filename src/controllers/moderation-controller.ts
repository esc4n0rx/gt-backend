import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { banRepository } from '../repositories/ban-repository';
import { roleChangeRepository } from '../repositories/role-change-repository';
import { profileRepository } from '../repositories/profile-repository';
import { userRepository } from '../repositories/user-repository';
import { UserRole, canManageUser } from '../middlewares/role-middleware';

export class ModerationController {
  // ==================== BANIMENTOS ====================

  // Banir usuário
  async banUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason, isPermanent, expiresInDays } = req.body;
      const bannedBy = req.user!.userId;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Validar se o usuário alvo existe
      const targetProfile = await profileRepository.findByUserId(userId);
      if (!targetProfile) {
        throw ApiError.notFound('Usuário não encontrado');
      }

      // Verificar se já está banido
      if (targetProfile.is_banned) {
        throw ApiError.badRequest('Usuário já está banido');
      }

      // Calcular data de expiração se temporário
      let expiresAt: Date | undefined;
      if (!isPermanent && expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // Criar banimento
      const ban = await banRepository.create({
        targetUserId: userId,
        bannedByUserId: bannedBy,
        reason,
        ipAddress,
        userAgent,
        isPermanent: isPermanent ?? true,
        expiresAt,
      });

      // Buscar informações completas do usuário banido e do autor
      const targetUser = await userRepository.findById(userId);
      const bannerUser = await userRepository.findById(bannedBy);

      sendSuccess(res, {
        ban: {
          id: ban.id,
          targetUser: {
            id: targetUser?.id,
            username: targetUser?.username,
            name: targetUser?.name,
          },
          bannedBy: {
            id: bannerUser?.id,
            username: bannerUser?.username,
            name: bannerUser?.name,
          },
          reason: ban.reason,
          isPermanent: ban.is_permanent,
          expiresAt: ban.expires_at,
          createdAt: ban.created_at,
        },
        message: `Usuário ${targetUser?.username} foi banido com sucesso`,
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // Desbanir usuário
  async unbanUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const unbannedBy = req.user!.userId;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Verificar se o usuário está banido
      const activeBan = await banRepository.findActiveByUserId(userId);
      if (!activeBan) {
        throw ApiError.badRequest('Usuário não está banido');
      }

      // Desativar o banimento
      await banRepository.deactivate(activeBan.id);

      // Criar registro de desbanimento
      await banRepository.createUnban({
        banId: activeBan.id,
        targetUserId: userId,
        unbannedByUserId: unbannedBy,
        reason,
        ipAddress,
        userAgent,
      });

      // Buscar informações do usuário
      const targetUser = await userRepository.findById(userId);
      const unbannerUser = await userRepository.findById(unbannedBy);

      sendSuccess(res, {
        message: `Usuário ${targetUser?.username} foi desbanido com sucesso`,
        unban: {
          targetUser: {
            id: targetUser?.id,
            username: targetUser?.username,
            name: targetUser?.name,
          },
          unbannedBy: {
            id: unbannerUser?.id,
            username: unbannerUser?.username,
            name: unbannerUser?.name,
          },
          reason,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Listar usuários banidos
  async listBannedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const bans = await banRepository.listActive(limit, offset);

      sendSuccess(res, {
        bans,
        pagination: {
          limit,
          offset,
          count: bans.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Histórico de banimentos de um usuário
  async getUserBanHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;

      const bans = await banRepository.findAllByUserId(userId);
      const unbans = await banRepository.findUnbansByUserId(userId);

      const targetUser = await userRepository.findById(userId);

      sendSuccess(res, {
        user: {
          id: targetUser?.id,
          username: targetUser?.username,
          name: targetUser?.name,
        },
        bans,
        unbans,
        totalBans: bans.length,
        activeBan: bans.find(b => b.is_active) || null,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== MUDANÇAS DE CARGO ====================

  // Alterar cargo de usuário
  async changeUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { newRole, reason } = req.body;
      const changedBy = req.user!.userId;
      const changerRole = req.user!.role as UserRole;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      // Validar se o usuário alvo existe
      const targetProfile = await profileRepository.findByUserId(userId);
      if (!targetProfile) {
        throw ApiError.notFound('Usuário não encontrado');
      }

      const oldRole = targetProfile.role as UserRole;

      // Verificar se o novo cargo é diferente do atual
      if (oldRole === newRole) {
        throw ApiError.badRequest('O usuário já possui este cargo');
      }

      // Verificar se o administrador pode gerenciar o usuário
      if (!canManageUser(changerRole, oldRole)) {
        throw ApiError.forbidden('Você não pode alterar o cargo deste usuário');
      }

      // Verificar se o administrador pode atribuir o novo cargo
      if (!canManageUser(changerRole, newRole)) {
        throw ApiError.forbidden('Você não pode atribuir este cargo');
      }

      // Atualizar cargo no perfil
      await profileRepository.updateRole(userId, newRole);

      // Registrar mudança de cargo
      await roleChangeRepository.create({
        targetUserId: userId,
        changedByUserId: changedBy,
        oldRole,
        newRole,
        reason,
        ipAddress,
        userAgent,
      });

      // Buscar informações dos usuários
      const targetUser = await userRepository.findById(userId);
      const changerUser = await userRepository.findById(changedBy);

      sendSuccess(res, {
        message: `Cargo de ${targetUser?.username} alterado de ${oldRole} para ${newRole}`,
        roleChange: {
          targetUser: {
            id: targetUser?.id,
            username: targetUser?.username,
            name: targetUser?.name,
          },
          changedBy: {
            id: changerUser?.id,
            username: changerUser?.username,
            name: changerUser?.name,
          },
          oldRole,
          newRole,
          reason,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Histórico de mudanças de cargo de um usuário
  async getUserRoleHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const roleChanges = await roleChangeRepository.findByUserId(userId, limit);
      const targetUser = await userRepository.findById(userId);
      const targetProfile = await profileRepository.findByUserId(userId);

      sendSuccess(res, {
        user: {
          id: targetUser?.id,
          username: targetUser?.username,
          name: targetUser?.name,
          currentRole: targetProfile?.role,
        },
        roleChanges,
        totalChanges: roleChanges.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // Listar mudanças de cargo recentes
  async listRecentRoleChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const roleChanges = await roleChangeRepository.listRecent(limit, offset);

      sendSuccess(res, {
        roleChanges,
        pagination: {
          limit,
          offset,
          count: roleChanges.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ESTATÍSTICAS ====================

  // Estatísticas de moderação
  async getModerationStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleChangeStats = await roleChangeRepository.getStats();

      // Buscar total de banimentos ativos
      const activeBans = await banRepository.listActive(1000);
      const totalActiveBans = activeBans.length;

      sendSuccess(res, {
        stats: {
          bans: {
            active: totalActiveBans,
          },
          roleChanges: roleChangeStats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const moderationController = new ModerationController();
