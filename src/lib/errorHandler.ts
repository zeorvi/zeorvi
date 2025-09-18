import { NextRequest, NextResponse } from 'next/server';
import { logger, logError } from './logger';
import { ZodError } from 'zod';

// Tipos de errores personalizados
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes') {
    super(message, 429);
  }
}

// Middleware para manejo de errores en APIs
export const errorHandler = (handler: Function) => {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error, request);
    }
  };
};

// Función principal para manejar errores
export const handleError = (error: unknown, request?: NextRequest): NextResponse => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let details: any = null;

  // Log del error
  if (error instanceof Error) {
    logError(error, {
      url: request?.url,
      method: request?.method,
      userAgent: request?.headers.get('user-agent')
    });
  }

  // Manejo específico por tipo de error
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
    details = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
  } else if (error instanceof Error) {
    // Errores específicos de Firebase
    if (error.message.includes('auth/')) {
      statusCode = 401;
      message = getFirebaseAuthErrorMessage(error.message);
    } else if (error.message.includes('permission-denied')) {
      statusCode = 403;
      message = 'No tienes permisos para realizar esta acción';
    } else if (error.message.includes('not-found')) {
      statusCode = 404;
      message = 'Recurso no encontrado';
    } else {
      message = process.env.NODE_ENV === 'production' 
        ? 'Error interno del servidor'
        : error.message;
    }
  }

  // Respuesta de error estructurada
  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && { stack: error.stack })
    },
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(errorResponse, { status: statusCode });
};

// Mensajes de error de Firebase más amigables
const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/invalid-email': 'Email inválido',
    'auth/weak-password': 'La contraseña es muy débil',
    'auth/email-already-in-use': 'Este email ya está en uso',
    'auth/requires-recent-login': 'Necesitas volver a autenticarte para esta acción',
    'auth/invalid-credential': 'Credenciales inválidas'
  };

  const key = Object.keys(errorMessages).find(k => errorCode.includes(k));
  return key ? errorMessages[key] : 'Error de autenticación';
};

// Helper para validar y manejar errores de forma consistente
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<[T | null, Error | null]> => {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    if (context) {
      logger.error(`Error in ${context}`, { error });
    }
    return [null, error as Error];
  }
};

// Middleware para rate limiting
export const withRateLimit = (
  handler: Function,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (request: NextRequest, context?: any) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar entradas expiradas
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < now) {
        requests.delete(key);
      }
    }

    // Verificar límite de rate
    const current = requests.get(ip);
    if (current) {
      if (current.count >= maxRequests && current.resetTime > now) {
        throw new RateLimitError();
      }
      current.count += 1;
    } else {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    }

    return handler(request, context);
  };
};

export default errorHandler;
