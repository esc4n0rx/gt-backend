export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(message, 400);
  }

  static unauthorized(message: string = 'Não autorizado'): ApiError {
    return new ApiError(message, 401);
  }

  static forbidden(message: string = 'Acesso negado'): ApiError {
    return new ApiError(message, 403);
  }

  static notFound(message: string = 'Recurso não encontrado'): ApiError {
    return new ApiError(message, 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }

  static internal(message: string = 'Erro interno do servidor'): ApiError {
    return new ApiError(message, 500, false);
  }
}