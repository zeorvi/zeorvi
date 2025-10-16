/**
 * Sistema de Autenticación Simplificado
 * Reemplaza Firebase Auth completamente
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sqliteDb } from '../database/sqlite';
import { memoryCache } from '../cache/memory';
import { config } from '../config';
import { findUserByEmail, verifyPassword, HARDCODED_USERS } from './hardcodedUsers';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'employee' | 'restaurant';
  restaurantId: string;
  restaurantName: string;
  permissions: string[];
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  restaurantSlug?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  restaurantId?: string;
  role?: 'admin' | 'manager' | 'employee' | 'restaurant';
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = config.jwt.secret;
    this.jwtExpiresIn = config.jwt.expiresIn;
  }

  // =============================================
  // REGISTRO DE USUARIOS
  // =============================================

  async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    try {
      // Si no se proporciona restaurantId, crear un restaurante temporal
      let restaurantId = data.restaurantId;
      let restaurant;
      
      if (!restaurantId) {
        // Crear restaurante temporal para usuarios admin
        restaurant = {
          id: 'temp-admin',
          name: 'Administración General',
          slug: 'admin'
        };
        restaurantId = 'temp-admin';
      } else {
        // Verificar que el restaurante existe
        restaurant = await sqliteDb.getRestaurant(restaurantId);
        if (!restaurant) {
          throw new Error('Restaurante no encontrado');
        }
      }

      // Verificar que el email no esté en uso
      const existingUser = await this.getUserByEmail(data.email, restaurantId);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Crear usuario en la base de datos SQLite
      const dbUser = await sqliteDb.createUser({
        restaurant_id: restaurantId,
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        role: data.role || 'employee',
        status: 'active'
      });

      if (!dbUser) {
        throw new Error('Error creando usuario');
      }

      // Crear objeto de usuario autenticado
      const user: AuthUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        restaurantId: restaurantId,
        restaurantName: restaurant.name,
        permissions: dbUser.permissions || []
      };

      // Generar JWT token
      const token = this.generateToken(user);

      // Guardar sesión en cache (memoria)
      await memoryCache.setex(`session:${user.id}`, 7 * 24 * 60 * 60, user);

      return { user, token };
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  // =============================================
  // LOGIN DE USUARIOS
  // =============================================

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    try {
      console.log('🔐 Login attempt for:', credentials.email);
      
      // SIEMPRE usar usuarios hardcoded (más simple y confiable)
      console.log('🔍 Looking up user in hardcoded database...');
      const hardcodedUser = await findUserByEmail(credentials.email);
      
      if (!hardcodedUser) {
        console.log('❌ User not found:', credentials.email);
        throw new Error('Credenciales inválidas');
      }

      console.log('✅ User found:', hardcodedUser.email);
      console.log('🔍 Verifying password...');
      
      // Verificar contraseña
      const isValidPassword = await verifyPassword(credentials.password, hardcodedUser.passwordHash);
      
      if (!isValidPassword) {
        console.log('❌ Invalid password for:', credentials.email);
        throw new Error('Credenciales inválidas');
      }

      console.log('✅ Password verified successfully');

      // Crear objeto de usuario autenticado
      const user: AuthUser = {
        id: hardcodedUser.id,
        email: hardcodedUser.email,
        name: hardcodedUser.name,
        role: hardcodedUser.role,
        restaurantId: hardcodedUser.restaurantId,
        restaurantName: hardcodedUser.restaurantName,
        permissions: hardcodedUser.permissions
      };
      
      console.log('✅ User object created:', { id: user.id, email: user.email, role: user.role });

      // Generar JWT token
      console.log('🔍 Generating JWT token...');
      const token = this.generateToken(user);
      console.log('✅ JWT token generated');

      // Guardar sesión en cache (memoria)
      console.log('🔍 Saving session to cache...');
      await memoryCache.setex(`session:${user.id}`, 7 * 24 * 60 * 60, user);
      console.log('✅ Session saved to cache');

      console.log('🎉 Login successful for:', user.email);
      return { user, token };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      throw error;
    }
  }

  // =============================================
  // VERIFICACIÓN DE TOKENS
  // =============================================

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // Verificar JWT (esto es rápido, no necesita BD)
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Obtener usuario desde cache (memoria)
      const cachedUser = await memoryCache.get(`session:${decoded.userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      // Si no está en cache, construir usuario desde el token decodificado
      // Esto evita consultas innecesarias a la BD en cada verificación
      const user: AuthUser = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name || '',
        role: decoded.role,
        restaurantId: decoded.restaurantId,
        restaurantName: decoded.restaurantName || 'Restaurant',
        permissions: decoded.permissions || []
      };

      // Guardar en cache para próximas verificaciones
      await memoryCache.setex(`session:${user.id}`, 7 * 24 * 60 * 60, user);

      return user;
    } catch (error) {
      console.error('Error verificando token:', error);
      return null;
    }
  }

  // =============================================
  // LOGOUT
  // =============================================

  async logout(userId: string): Promise<void> {
    try {
      // Eliminar sesión del cache (memoria)
      await memoryCache.del(`session:${userId}`);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  // =============================================
  // GESTIÓN DE CONTRASEÑAS
  // =============================================

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Obtener usuario desde SQLite
      const dbUser = await sqliteDb.getUserByEmail('', ''); // We need to get user by ID, but SQLite doesn't have this method
      
      // For now, we'll implement a simpler approach
      // In a real implementation, you'd need to add a getUserById method to SQLite
      throw new Error('Cambio de contraseña no implementado en SQLite');
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  }

  // =============================================
  // MÉTODOS PRIVADOS
  // =============================================

  private generateToken(user: AuthUser): string {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantName: user.restaurantName,
      permissions: user.permissions
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  private async getUserByEmail(email: string, restaurantId: string): Promise<any | null> {
    try {
      return await sqliteDb.getUserByEmail(email, restaurantId);
    } catch (error) {
      console.error('Error obteniendo usuario por email:', error);
      return null;
    }
  }

  // =============================================
  // MIDDLEWARE DE AUTENTICACIÓN
  // =============================================

  async authenticateRequest(request: Request): Promise<AuthUser | null> {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      return await this.verifyToken(token);
    } catch (error) {
      console.error('Error autenticando request:', error);
      return null;
    }
  }

  // Middleware para Next.js API routes
  withAuth(handler: (req: any, res: any, user: AuthUser) => Promise<any>) {
    return async (req: any, res: any) => {
      try {
        const user = await this.authenticateRequest(req);
        if (!user) {
          return res.status(401).json({ error: 'No autorizado' });
        }

        return await handler(req, res, user);
      } catch (error) {
        console.error('Error en middleware de auth:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
    };
  }
}

// Instancia singleton
export default new AuthService();
