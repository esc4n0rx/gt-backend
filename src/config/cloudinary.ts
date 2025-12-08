import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

/**
 * Upload de imagem para o Cloudinary
 * @param file Buffer do arquivo
 * @param folder Pasta no Cloudinary
 * @param publicId ID público (opcional)
 * @param userId ID do usuário (para vinculação)
 * @returns URL da imagem
 */
export const uploadImage = async (
  file: Buffer,
  folder: string,
  publicId?: string,
  userId?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      public_id: publicId,
      resource_type: 'auto' as const,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      context: userId ? `user_id=${userId}` : undefined,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    uploadStream.end(file);
  });
};

/**
 * Deleta uma imagem do Cloudinary
 * @param publicId ID público da imagem
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
  }
};

/**
 * Extrai o public_id de uma URL do Cloudinary
 * @param url URL da imagem
 * @returns Public ID ou null
 */
export const extractPublicId = (url: string): string | null => {
  try {
    const match = url.match(/\/v\d+\/(.+)\.[a-z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export default cloudinary;
