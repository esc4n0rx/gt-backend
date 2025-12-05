import { supabase } from '../config/database';
import { userRepository } from '../repositories/user-repository';
import { profileRepository } from '../repositories/profile-repository';
import { inviteService } from './invite-service';
import { settingsService } from './settings-service';
import { generateToken } from '../config/jwt';
import { comparePassword } from '../utils/password';
import { ApiError } from '../utils/api-error';
import { RegisterDTO, LoginDTO, AuthResponse } from '../types/auth.types';
import { UserWithoutPassword } from '../types/user.types';

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Verificar se invite code é obrigatório
    const requireInviteCode = await settingsService.isInviteCodeRequired();

    if (requireInviteCode && !data.inviteCode) {
      throw ApiError.badRequest('Código de convite é obrigatório para registro');
    }

    // Validar invite code se fornecido
    if (data.inviteCode) {
      await inviteService.validateInviteCode(data.inviteCode);
    }

    // Verificar se username já existe
    const usernameExists = await userRepository.existsByUsername(data.username);
    if (usernameExists) {
      throw ApiError.conflict('Username já está em uso');
    }

    // Verificar se email já existe
    const emailExists = await userRepository.existsByEmail(data.email);
    if (emailExists) {
      throw ApiError.conflict('Email já está em uso');
    }

    // Criar usuário
    const user = await userRepository.create({
      username: data.username,
      name: data.name,
      email: data.email,
      password: data.password,
      inviteCode: data.inviteCode,
    });

    // Criar perfil vazio
    const profile = await profileRepository.create({ userId: user.id });

    // Marcar invite code como usado (se fornecido)
    if (data.inviteCode) {
      await inviteService.useInviteCode(data.inviteCode, user.id);
    }

    // Gerar invite code para o novo usuário
    await inviteService.createInviteCode(user.id);

    // Gerar token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    // Remover senha do retorno
    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      invite_code_used: user.invite_code_used,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return { user: userWithoutPassword, profile, token };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Buscar usuário
    const user = await userRepository.findByUsername(data.username);
    if (!user) {
      throw ApiError.unauthorized('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Credenciais inválidas');
    }

    // Buscar perfil
    const profile = await profileRepository.findByUserId(user.id);
    if (!profile) {
      throw ApiError.internal('Perfil não encontrado');
    }

    // Verificar se está banido
    if (profile.is_banned) {
      throw ApiError.forbidden('Sua conta está banida');
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    // Remover senha do retorno
    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      invite_code_used: user.invite_code_used,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return { user: userWithoutPassword, profile, token };
  }

  async logout(token: string, userId: string, expiresAt: Date): Promise<void> {
    const { error } = await supabase
      .from('token_blacklist')
      .insert({
        token,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
      }as any);

    if (error) {
      throw ApiError.internal(`Falha ao realizar logout: ${error.message}`);
    }
  }
}

export const authService = new AuthService();