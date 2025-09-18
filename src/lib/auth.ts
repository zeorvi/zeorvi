import { NextRequest } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { auth } from './firebase';
import { logger, logAuth } from './logger';
import { AuthenticationError, AuthorizationError } from './errorHandler';

// Configuración JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

const JWT_ISSUER = 'restaurante-ai-platform';
const JWT_AUDIENCE = 'restaurante-ai-platform-users';

// Interfaces
export interface JWTPayload {
  uid: string;
  email: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export interface AuthContext {
  user: JWTPayload;
  token: string;
}

// Crear JWT token
export const createJWTToken = async (payload: Omit<JWTPayload, 'exp' | 'iat' | 'iss' | 'aud'>): Promise<string> => {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    logAuth('token_created', payload.uid, { email: payload.email, role: payload.role });
    return token;
  } catch (error) {
    logger.error('Error creating JWT token', { error, payload });
    throw new Error('Error al crear token de autenticación');
  }
};

// Verificar JWT token
export const verifyJWTToken = async (token: string): Promise<JWTPayload> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as JWTPayload;
  } catch (error) {
    logger.warn('Invalid JWT token', { error: (error as Error).message });
    throw new AuthenticationError('Token inválido o expirado');
  }
};

// Extraer token del header Authorization
export const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

// Verificar autenticación desde Firebase token
export const verifyFirebaseToken = async (firebaseToken: string): Promise<JWTPayload> => {
  try {
    // En un entorno real, verificarías el token de Firebase aquí
    // const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    // Por ahora, simulamos la verificación
    // En producción, reemplaza esto con la verificación real de Firebase
    throw new Error('Firebase token verification not implemented');
  } catch (error) {
    logger.error('Firebase token verification failed', { error });
    throw new AuthenticationError('Token de Firebase inválido');
  }
};

// Middleware de autenticación
export const requireAuth = (handler: Function) => {
  return async (request: NextRequest, context?: any) => {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      throw new AuthenticationError('Token de autenticación requerido');
    }

    const user = await verifyJWTToken(token);
    
    // Añadir contexto de autenticación al request
    (request as any).auth = { user, token };
    
    return handler(request, context);
  };
};

// Middleware de autorización por rol
export const requireRole = (roles: ('admin' | 'restaurant')[]) => {
  return (handler: Function) => {
    return requireAuth(async (request: NextRequest, context?: any) => {
      const auth = (request as any).auth as AuthContext;
      
      if (!roles.includes(auth.user.role)) {
        logAuth('authorization_failed', auth.user.uid, { 
          requiredRoles: roles, 
          userRole: auth.user.role 
        });
        throw new AuthorizationError(`Acceso denegado. Se requiere rol: ${roles.join(' o ')}`);
      }

      logAuth('authorization_success', auth.user.uid, { 
        role: auth.user.role,
        endpoint: request.url 
      });
      
      return handler(request, context);
    });
  };
};

// Middleware para verificar acceso a restaurante específico
export const requireRestaurantAccess = (handler: Function) => {
  return requireAuth(async (request: NextRequest, context?: any) => {
    const auth = (request as any).auth as AuthContext;
    const url = new URL(request.url);
    const restaurantId = url.searchParams.get('restaurantId') || 
                        url.pathname.split('/').find(segment => segment.startsWith('rest_'));

    // Los admins pueden acceder a cualquier restaurante
    if (auth.user.role === 'admin') {
      return handler(request, context);
    }

    // Los usuarios de restaurante solo pueden acceder a su propio restaurante
    if (auth.user.role === 'restaurant') {
      if (!auth.user.restaurantId || auth.user.restaurantId !== restaurantId) {
        logAuth('restaurant_access_denied', auth.user.uid, { 
          userRestaurantId: auth.user.restaurantId,
          requestedRestaurantId: restaurantId 
        });
        throw new AuthorizationError('No tienes acceso a este restaurante');
      }
    }

    return handler(request, context);
  });
};

// Helper para obtener el contexto de autenticación del request
export const getAuthContext = (request: NextRequest): AuthContext | null => {
  return (request as any).auth || null;
};

// Validar permisos específicos
export const hasPermission = (
  user: JWTPayload, 
  action: string, 
  resource?: string
): boolean => {
  // Lógica de permisos basada en roles
  switch (user.role) {
    case 'admin':
      return true; // Los admins tienen todos los permisos
    
    case 'restaurant':
      // Los restaurantes solo pueden gestionar sus propios recursos
      const restaurantActions = [
        'read:reservations',
        'create:reservations',
        'update:reservations',
        'read:tables',
        'update:tables',
        'read:clients',
        'create:clients',
        'update:clients',
        'read:restaurant_config',
        'update:restaurant_config'
      ];
      return restaurantActions.includes(action);
    
    default:
      return false;
  }
};

// Middleware para validar permisos específicos
export const requirePermission = (action: string, resource?: string) => {
  return (handler: Function) => {
    return requireAuth(async (request: NextRequest, context?: any) => {
      const auth = (request as any).auth as AuthContext;
      
      if (!hasPermission(auth.user, action, resource)) {
        logAuth('permission_denied', auth.user.uid, { 
          action, 
          resource, 
          userRole: auth.user.role 
        });
        throw new AuthorizationError(`No tienes permisos para: ${action}`);
      }

      return handler(request, context);
    });
  };
};

// Generar contraseña temporal para nuevos usuarios
export const generateTemporaryPassword = (): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Mayúscula
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Símbolo
  
  // Completar hasta 12 caracteres
  for (let i = 4; i < 12; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export default {
  createJWTToken,
  verifyJWTToken,
  requireAuth,
  requireRole,
  requireRestaurantAccess,
  requirePermission,
  hasPermission,
  getAuthContext,
  generateTemporaryPassword
};
