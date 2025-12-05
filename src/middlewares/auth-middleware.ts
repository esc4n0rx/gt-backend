import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../config/jwt';
import { ApiError } from '../utils/api-error';
import { supabase } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token não fornecido');
    }

    const token = authHeader.split(' ')[1];

    // Verificar se o token está na blacklist
    const { data: blacklisted } = await supabase
      .from('token_blacklist')
      .select('id')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (blacklisted) {
      throw ApiError.unauthorized('Token inválido');
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(ApiError.unauthorized('Token inválido ou expirado'));
  }
};