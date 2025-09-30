/**
 * Sistema de Autenticación Simplificado
 * Reemplaza Firebase Auth completamente
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { sqliteDb } from '../database/sqlite';
import { memoryCache } from '../cache/memory';
import { devAuthService } from '../devAuth';
import { config } from '../config';

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
        restaurant = await db.getRestaurant(restaurantId);
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

      // Crear usuario en la base de datos
      const result = await db.pg.query(`
        INSERT INTO restaurant_users (restaurant_id, email, password_hash, name, role, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        RETURNING *
      `, [data.restaurantId, data.email, passwordHash, data.name, data.role || 'employee']);

      const dbUser = result.rows[0];

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

      // Guardar sesión en cache
      await db.saveSession(user.id, user, 7 * 24 * 60 * 60);

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
      // Usar SQLite para desarrollo
      console.log('🔧 Using SQLite authentication system');
      
      let restaurantId: string;
      let dbUser: any;

      // Si se proporciona slug del restaurante, buscar por slug
      if (credentials.restaurantSlug) {
        const restaurant = await sqliteDb.getRestaurantBySlug(credentials.restaurantSlug);
        if (!restaurant) {
          throw new Error('Restaurante no encontrado');
        }
        restaurantId = restaurant.id;
        dbUser = await sqliteDb.getUserByEmail(credentials.email, restaurantId);
      } else {
        // Buscar usuario en SQLite (en todos los restaurantes)
        dbUser = await sqliteDb.getUserByEmail(credentials.email);
        
        if (!dbUser) {
          throw new Error('Credenciales inválidas');
        }
        
        restaurantId = dbUser.restaurant_id;
      }

      if (!dbUser) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(credentials.password, dbUser.password_hash);
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Obtener datos del restaurante
      const restaurant = await sqliteDb.getRestaurant(restaurantId);
      if (!restaurant) {
        throw new Error('Restaurante no encontrado');
      }

      // Actualizar último login
      await sqliteDb.updateLastLogin(dbUser.id);

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
      console.error('Error en login:', error);
      throw error;
    }
  }

  // =============================================
  // VERIFICACIÓN DE TOKENS
  // =============================================

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      // Verificar JWT
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Obtener usuario desde cache (memoria)
      const cachedUser = await memoryCache.get(`session:${decoded.userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      // Si no está en cache, obtener desde SQLite
      const dbUser = await sqliteDb.getUserByEmail(decoded.email, decoded.restaurantId);
      if (!dbUser) {
        return null;
      }

      const restaurant = await sqliteDb.getRestaurant(decoded.restaurantId);
      if (!restaurant) {
        return null;
      }

      const user: AuthUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        restaurantId: decoded.restaurantId,
        restaurantName: restaurant.name,
        permissions: dbUser.permissions || []
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
      // Obtener usuario
      const result = await db.pg.query(`
        SELECT password_hash FROM restaurant_users WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const dbUser = result.rows[0];

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isValidPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash de la nueva contraseña
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await db.pg.query(`
        UPDATE restaurant_users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `, [newPasswordHash, userId]);

      // Invalidar todas las sesiones del usuario
      await this.logout(userId);
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
      role: user.role,
      restaurantId: user.restaurantId
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
