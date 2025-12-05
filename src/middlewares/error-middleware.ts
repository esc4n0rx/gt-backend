import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { sendError } from '../utils/api-response';
import { env } from '../config/env';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 'JSON inválido no corpo da requisição', 400);
  }

  // Erro genérico
  return sendError(
    res,
    env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    500
  );
};