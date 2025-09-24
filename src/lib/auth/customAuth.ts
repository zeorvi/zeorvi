/**
 * Sistema de Autenticación Propio
 * Reemplaza completamente Firebase Authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Usar SQLite en desarrollo, PostgreSQL en producción
let db: any;
if (process.env.NODE_ENV === 'development') {
  try {
    db = require('../database/sqlite').db;
  } catch (error) {
    console.error('Error loading SQLite database:', error);
    // Fallback a PostgreSQL si SQLite falla
    db = require('../database').db;
  }
} else {
  db = require('../database').db;
}
import { logger } from '../logger';

// Interfaces
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  restaurantName?: string;
  permissions: string[];
  lastLogin?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role: 'admin' | 'restaurant';
  restaurantId?: string;
  restaurantName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 12;

class CustomAuthService {
  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      logger.info('Attempting user registration', { email: data.email, role: data.role });

      // Verificar si el usuario ya existe
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

      // Crear usuario en la base de datos
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser = {
        id: userId,
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
        role: data.role,
        restaurant_id: data.restaurantId,
        restaurant_name: data.restaurantName,
        permissions: this.getDefaultPermissions(data.role),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Insertar en la base de datos
      if (process.env.NODE_ENV === 'development') {
        // SQLite
        await db.createUser({
          id: newUser.id,
          email: newUser.email,
          password_hash: newUser.password_hash,
          name: newUser.name,
          role: newUser.role,
          restaurant_id: newUser.restaurant_id,
          permissions: newUser.permissions,
          status: newUser.status
        });
      } else {
        // PostgreSQL
        await db.pg.query(`
          INSERT INTO restaurant_users (id, email, password_hash, name, role, restaurant_id, restaurant_name, permissions, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          newUser.id, newUser.email, newUser.password_hash, newUser.name,
          newUser.role, newUser.restaurant_id, newUser.restaurant_name,
          JSON.stringify(newUser.permissions), newUser.status,
          newUser.created_at, newUser.updated_at
        ]);
      }

      // Generar token JWT
      const token = this.generateToken(newUser);

      logger.info('User registered successfully', { userId: newUser.id, email: data.email });

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          restaurantId: newUser.restaurant_id,
          restaurantName: newUser.restaurant_name,
          permissions: newUser.permissions
        },
        token
      };

    } catch (error) {
      logger.error('Registration failed', { error, email: data.email });
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      logger.info('Attempting login', { email: credentials.email });

      // Buscar usuario por email
      const user = await this.getUserByEmail(credentials.email);
      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Verificar contraseña - puede ser hash bcrypt o contraseña plana de restaurante
      let isValidPassword = false;
      
      if (user.password_hash) {
        // Usuario con contraseña hasheada (admin)
        isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      } else {
        // Usuario de restaurante con contraseña plana
        // Buscar la contraseña del restaurante
        const restaurant = await this.getRestaurantPassword(user.restaurant_id);
        if (restaurant && restaurant.password) {
          isValidPassword = credentials.password === restaurant.password;
        }
      }
      
      if (!isValidPassword) {
        logger.warn('Invalid password attempt', { email: credentials.email });
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Verificar que el usuario esté activo
      if (user.status !== 'active') {
        return {
          success: false,
          error: 'Cuenta desactivada. Contacta al administrador.'
        };
      }

      // Actualizar último login
      await this.updateLastLogin(user.id);

      // Generar token JWT
      const token = this.generateToken(user);

      logger.info('Login successful', { userId: user.id, email: credentials.email });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurant_id,
          restaurantName: user.restaurant_name,
          permissions: user.permissions,
          lastLogin: user.last_login
        },
        token
      };

    } catch (error) {
      logger.error('Login failed', { error, email: credentials.email });
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Verificar token JWT
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Buscar usuario en la base de datos
      const user = await this.getUserById(decoded.uid);  // Cambiar de userId a uid
      if (!user || user.status !== 'active') {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant_name,
        permissions: user.permissions,
        lastLogin: user.last_login
      };

    } catch (error) {
      logger.error('Token verification failed', { error });
      return null;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        };
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Actualizar en la base de datos
      await db.pg.query(`
        UPDATE restaurant_users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `, [newPasswordHash, userId]);

      logger.info('Password changed successfully', { userId });

      return {
        success: true
      };

    } catch (error) {
      logger.error('Password change failed', { error, userId });
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Obtener usuario por email
   */
  private async getUserByEmail(email: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      // SQLite
      return await db.getUserByEmail(email);
    } else {
      // PostgreSQL
      const result = await db.pg.query(`
        SELECT * FROM restaurant_users WHERE email = $1
      `, [email]);
      
      return result.rows[0] || null;
    }
  }

  /**
   * Obtener usuario por ID
   */
  private async getUserById(userId: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      // SQLite
      return await db.getUserById(userId);
    } else {
      // PostgreSQL
      const result = await db.pg.query(`
        SELECT * FROM restaurant_users WHERE id = $1
      `, [userId]);
      
      return result.rows[0] || null;
    }
  }

  /**
   * Actualizar último login
   */
  private async updateLastLogin(userId: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      // SQLite
      await db.updateUserLastLogin(userId);
    } else {
      // PostgreSQL
      await db.pg.query(`
        UPDATE restaurant_users 
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [userId]);
    }
  }

  private async getRestaurantPassword(restaurantId: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      // SQLite
      return await db.getRestaurant(restaurantId);
    } else {
      // PostgreSQL
      const result = await db.pg.query(`
        SELECT id, password FROM restaurants WHERE id = $1
      `, [restaurantId]);
      return result.rows[0] || null;
    }
  }

  /**
   * Generar token JWT
   */
  private generateToken(user: any): string {
    const payload = {
      uid: user.id,  // Cambiar de userId a uid para compatibilidad
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
      permissions: user.permissions
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Obtener permisos por defecto según el rol
   */
  private getDefaultPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return [
          'restaurants:read',
          'restaurants:write',
          'restaurants:delete',
          'users:read',
          'users:write',
          'users:delete',
          'reports:read',
          'settings:read',
          'settings:write'
        ];
      
      case 'restaurant':
        return [
          'tables:read',
          'tables:write',
          'reservations:read',
          'reservations:write',
          'clients:read',
          'clients:write',
          'reports:read'
        ];
      
      default:
        return [];
    }
  }

  /**
   * Validar credenciales de restaurante (compatibilidad con sistema actual)
   */
  async validateRestaurantCredentials(username: string, password: string): Promise<{
    valid: boolean;
    user?: AuthUser;
    restaurantData?: any;
  }> {
    try {
      // Buscar usuario por email (asumiendo que username es email)
      const user = await this.getUserByEmail(username);
      if (!user) {
        return { valid: false };
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return { valid: false };
      }

      // Verificar que el usuario esté activo
      if (user.status !== 'active') {
        return { valid: false };
      }

      // Obtener datos del restaurante si aplica
      let restaurantData = null;
      if (user.restaurant_id) {
        restaurantData = await db.getRestaurant(user.restaurant_id);
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurant_id,
          restaurantName: user.restaurant_name,
          permissions: user.permissions,
          lastLogin: user.last_login
        },
        restaurantData
      };

    } catch (error) {
      logger.error('Restaurant credentials validation failed', { error, username });
      return { valid: false };
    }
  }
}

// Instancia singleton
export const customAuth = new CustomAuthService();
export default customAuth;
