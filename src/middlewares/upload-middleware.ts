import multer from 'multer';
import { Request } from 'express';

/**
 * Configuração do Multer para upload de arquivos
 * Usa memoryStorage para processar arquivos em memória (Buffer)
 */
const storage = multer.memoryStorage();

/**
 * Filtro de tipo de arquivo
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Aceita apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas'));
  }
};

/**
 * Middleware de upload único (single file)
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
}).single('file');
