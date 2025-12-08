import { profileRepository } from '../repositories/profile-repository';
import { userRepository } from '../repositories/user-repository';
import { verificationCodeRepository } from '../repositories/verification-code-repository';
import { emailService } from './email-service';
import { uploadImage, deleteImage, extractPublicId } from '../config/cloudinary';
import { comparePassword } from '../utils/password';
import { generateCode } from '../utils/generate-code';
import { ApiError } from '../utils/api-error';
import { Profile } from '../types/profile.types';
import { User } from '../types/user.types';
import {
  UpdateProfileDTO,
  RequestEmailChangeDTO,
  RequestPasswordChangeDTO,
} from '../validators/profile-validators';

/**
 * Serviço de gerenciamento de perfis
 */
class ProfileService {
  /**
   * Busca perfil do usuário
   */
  async getProfile(userId: string): Promise<{ user: User; profile: Profile }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado');
    }

    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Perfil não encontrado');
    }

    // Remove senha do retorno
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      profile,
    };
  }

  /**
   * Atualiza nome e/ou bio do perfil
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDTO
  ): Promise<{ user?: User; profile?: Profile }> {
    const result: { user?: User; profile?: Profile } = {};

    // Atualiza nome no users
    if (data.name) {
      const user = await userRepository.updateName(userId, data.name);
      const { password_hash, ...userWithoutPassword } = user;
      result.user = userWithoutPassword as User;
    }

    // Atualiza bio no profiles
    if (data.bio !== undefined) {
      result.profile = await profileRepository.updateBio(userId, data.bio);
    }

    return result;
  }

  /**
   * Upload de avatar
   */
  async updateAvatar(userId: string, file: Buffer): Promise<Profile> {
    // Busca perfil atual para deletar avatar antigo
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Perfil não encontrado');
    }

    // Deleta avatar antigo se não for o padrão
    if (profile.avatar_url && !profile.avatar_url.includes('default-avatar')) {
      const oldPublicId = extractPublicId(profile.avatar_url);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Upload novo avatar
    const avatarUrl = await uploadImage(
      file,
      'gtracker/avatars',
      `avatar_${userId}_${Date.now()}`,
      userId
    );

    return await profileRepository.updateAvatar(userId, avatarUrl);
  }

  /**
   * Upload de banner
   */
  async updateBanner(userId: string, file: Buffer): Promise<Profile> {
    // Busca perfil atual para deletar banner antigo
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Perfil não encontrado');
    }

    // Deleta banner antigo se não for o padrão
    if (profile.banner_url && !profile.banner_url.includes('default-banner')) {
      const oldPublicId = extractPublicId(profile.banner_url);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Upload novo banner
    const bannerUrl = await uploadImage(
      file,
      'gtracker/banners',
      `banner_${userId}_${Date.now()}`,
      userId
    );

    return await profileRepository.updateBanner(userId, bannerUrl);
  }

  /**
   * Upload de assinatura
   */
  async updateSignature(userId: string, file: Buffer): Promise<Profile> {
    // Busca perfil atual para deletar assinatura antiga
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Perfil não encontrado');
    }

    // Deleta assinatura antiga se existir
    if (profile.signature) {
      const oldPublicId = extractPublicId(profile.signature);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Upload nova assinatura (aceita GIF)
    const signatureUrl = await uploadImage(
      file,
      'gtracker/signatures',
      `signature_${userId}_${Date.now()}`,
      userId
    );

    return await profileRepository.updateSignature(userId, signatureUrl);
  }

  /**
   * Remove assinatura
   */
  async removeSignature(userId: string): Promise<Profile> {
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Perfil não encontrado');
    }

    // Deleta assinatura do Cloudinary
    if (profile.signature) {
      const publicId = extractPublicId(profile.signature);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    return await profileRepository.updateSignature(userId, '');
  }

  /**
   * Solicita alteração de email (envia código)
   */
  async requestEmailChange(
    userId: string,
    data: RequestEmailChangeDTO
  ): Promise<{ message: string }> {
    // Busca usuário
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado');
    }

    // Verifica senha
    const isPasswordValid = await comparePassword(
      data.password,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Senha incorreta');
    }

    // Verifica se email já está em uso
    const emailExists = await userRepository.existsByEmail(data.newEmail);
    if (emailExists) {
      throw ApiError.conflict('Este email já está em uso');
    }

    // Deleta códigos pendentes
    await verificationCodeRepository.deletePendingByUserAndType(
      userId,
      'email_change'
    );

    // Gera código de 6 dígitos
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Salva código no banco
    await verificationCodeRepository.create({
      userId,
      code,
      type: 'email_change',
      newValue: data.newEmail,
      expiresAt,
    });

    // Envia email com código
    await emailService.sendEmailChangeCode(data.newEmail, user.username, code);

    return {
      message: 'Código de verificação enviado para o novo email',
    };
  }

  /**
   * Confirma alteração de email
   */
  async confirmEmailChange(
    userId: string,
    code: string
  ): Promise<{ user: User; message: string }> {
    // Busca código
    const verificationCode = await verificationCodeRepository.findByCodeAndType(
      code,
      'email_change'
    );

    if (!verificationCode || verificationCode.user_id !== userId) {
      throw ApiError.badRequest('Código inválido ou expirado');
    }

    // Atualiza email
    const user = await userRepository.updateEmail(
      userId,
      verificationCode.new_value
    );

    // Marca código como usado
    await verificationCodeRepository.markAsUsed(verificationCode.id);

    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      message: 'Email atualizado com sucesso',
    };
  }

  /**
   * Solicita alteração de senha (envia código)
   */
  async requestPasswordChange(
    userId: string,
    data: RequestPasswordChangeDTO
  ): Promise<{ message: string }> {
    // Busca usuário
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('Usuário não encontrado');
    }

    // Verifica senha atual
    const isPasswordValid = await comparePassword(
      data.currentPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Senha atual incorreta');
    }

    // Deleta códigos pendentes
    await verificationCodeRepository.deletePendingByUserAndType(
      userId,
      'password_change'
    );

    // Gera código de 6 dígitos
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Salva código no banco (armazena a nova senha temporariamente)
    await verificationCodeRepository.create({
      userId,
      code,
      type: 'password_change',
      newValue: data.newPassword, // Armazena em texto para hash posterior
      expiresAt,
    });

    // Envia email com código
    await emailService.sendPasswordChangeCode(user.email, user.username, code);

    return {
      message: 'Código de verificação enviado para seu email',
    };
  }

  /**
   * Confirma alteração de senha
   */
  async confirmPasswordChange(
    userId: string,
    code: string
  ): Promise<{ message: string }> {
    // Busca código
    const verificationCode = await verificationCodeRepository.findByCodeAndType(
      code,
      'password_change'
    );

    if (!verificationCode || verificationCode.user_id !== userId) {
      throw ApiError.badRequest('Código inválido ou expirado');
    }

    // Atualiza senha
    await userRepository.updatePassword(userId, verificationCode.new_value);

    // Marca código como usado
    await verificationCodeRepository.markAsUsed(verificationCode.id);

    return {
      message: 'Senha atualizada com sucesso',
    };
  }
}

export const profileService = new ProfileService();
