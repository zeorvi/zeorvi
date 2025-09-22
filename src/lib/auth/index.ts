/**
 * Sistema de Autenticación Propio
 * Reemplaza Firebase Auth completamente
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import type { RestaurantUser } from '../database';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'employee';
  restaurantId: string;
  restaurantName: string;
  permissions: string[];
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
  restaurantId: string;
  role?: 'admin' | 'manager' | 'employee';
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // =============================================
  // REGISTRO DE USUARIOS
  // =============================================

  async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    try {
      // Verificar que el restaurante existe
      const restaurant = await db.getRestaurant(data.restaurantId);
      if (!restaurant) {
        throw new Error('Restaurante no encontrado');
      }

      // Verificar que el email no esté en uso
      const existingUser = await this.getUserByEmail(data.email, data.restaurantId);
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
        restaurantId: data.restaurantId,
        restaurantName: restaurant.name,
        permissions: dbUser.permissions || []
      };

      // Generar JWT token
      const token = this.generateToken(user);

      // Guardar sesión en cache
      await this.saveSession(user.id, user);

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
      let restaurantId: string;

      // Si se proporciona slug del restaurante, buscar por slug
      if (credentials.restaurantSlug) {
        const restaurant = await db.getRestaurantBySlug(credentials.restaurantSlug);
        if (!restaurant) {
          throw new Error('Restaurante no encontrado');
        }
        restaurantId = restaurant.id;
      } else {
        // Buscar usuario en todas las bases de datos (para admin general)
        const result = await db.pg.query(`
          SELECT ru.*, r.name as restaurant_name, r.id as restaurant_id
          FROM restaurant_users ru
          JOIN restaurants r ON ru.restaurant_id = r.id
          WHERE ru.email = $1 AND ru.status = 'active'
          LIMIT 1
        `, [credentials.email]);

        if (result.rows.length === 0) {
          throw new Error('Usuario no encontrado');
        }

        const dbUser = result.rows[0];
        restaurantId = dbUser.restaurant_id;
      }

      // Buscar usuario específico
      const dbUser = await this.getUserByEmail(credentials.email, restaurantId);
      if (!dbUser) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(credentials.password, dbUser.password_hash);
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Obtener datos del restaurante
      const restaurant = await db.getRestaurant(restaurantId);
      if (!restaurant) {
        throw new Error('Restaurante no encontrado');
      }

      // Actualizar último login
      await db.pg.query(`
        UPDATE restaurant_users 
        SET last_login = NOW() 
        WHERE id = $1
      `, [dbUser.id]);

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
      await this.saveSession(user.id, user);

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
      
      // Obtener usuario desde cache
      const cachedUser = await this.getSession(decoded.userId);
      if (cachedUser) {
        return cachedUser;
      }

      // Si no está en cache, obtener desde BD
      const result = await db.pg.query(`
        SELECT ru.*, r.name as restaurant_name
        FROM restaurant_users ru
        JOIN restaurants r ON ru.restaurant_id = r.id
        WHERE ru.id = $1 AND ru.status = 'active'
      `, [decoded.userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const dbUser = result.rows[0];
      const user: AuthUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        restaurantId: dbUser.restaurant_id,
        restaurantName: dbUser.restaurant_name,
        permissions: dbUser.permissions || []
      };

      // Guardar en cache para próximas verificaciones
      await this.saveSession(user.id, user);

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
      // Eliminar sesión del cache
      await db.redis.del(`session:${userId}`);
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

  async resetPassword(email: string, restaurantSlug: string): Promise<void> {
    try {
      // Obtener restaurante
      const restaurant = await db.getRestaurantBySlug(restaurantSlug);
      if (!restaurant) {
        throw new Error('Restaurante no encontrado');
      }

      // Obtener usuario
      const dbUser = await this.getUserByEmail(email, restaurant.id);
      if (!dbUser) {
        throw new Error('Usuario no encontrado');
      }

      // Generar contraseña temporal
      const tempPassword = this.generateTempPassword();
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

      // Actualizar contraseña
      await db.pg.query(`
        UPDATE restaurant_users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `, [passwordHash, dbUser.id]);

      // TODO: Enviar email con contraseña temporal
      console.log(`Contraseña temporal para ${email}: ${tempPassword}`);

      // Invalidar sesiones
      await this.logout(dbUser.id);
    } catch (error) {
      console.error('Error reseteando contraseña:', error);
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

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  private async saveSession(userId: string, user: AuthUser): Promise<void> {
    try {
      await db.redis.setex(`session:${userId}`, 7 * 24 * 60 * 60, JSON.stringify(user)); // 7 días
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  }

  private async getSession(userId: string): Promise<AuthUser | null> {
    try {
      const sessionData = await db.redis.get(`session:${userId}`);
      if (!sessionData) return null;
      
      return JSON.parse(sessionData) as AuthUser;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  }

  private async getUserByEmail(email: string, restaurantId: string): Promise<RestaurantUser | null> {
    try {
      const result = await db.pg.query(`
        SELECT * FROM restaurant_users 
        WHERE email = $1 AND restaurant_id = $2 AND status = 'active'
      `, [email, restaurantId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error obteniendo usuario por email:', error);
      return null;
    }
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
export const authService = new AuthService();
export default authService;

