/**
 * Sistema de Base de Datos SQLite
 * Para desarrollo sin PostgreSQL
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  config: Record<string, any>;
  plan: 'basic' | 'premium' | 'enterprise';
  plan_expires_at?: Date;
  status: 'active' | 'inactive' | 'suspended';
  retell_config: Record<string, any>;
  twilio_config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  email: string;
  password_hash: string;
  name?: string;
  role: 'admin' | 'manager' | 'employee' | 'restaurant';
  permissions: string[];
  status: 'active' | 'inactive';
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

class SQLiteDatabase {
  private db: sqlite3.Database;
  private static instance: SQLiteDatabase;

  constructor() {
    const dbPath = path.join(process.cwd(), 'restaurant_dev.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  private async initializeDatabase() {
    const run = promisify(this.db.run.bind(this.db));
    
    try {
      // Crear tabla de restaurantes
      await run(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          owner_email TEXT NOT NULL,
          owner_name TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          country TEXT,
          config TEXT DEFAULT '{}',
          plan TEXT DEFAULT 'basic',
          plan_expires_at TEXT,
          status TEXT DEFAULT 'active',
          retell_config TEXT DEFAULT '{}',
          twilio_config TEXT DEFAULT '{}',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Crear tabla de usuarios
      await run(`
        CREATE TABLE IF NOT EXISTS restaurant_users (
          id TEXT PRIMARY KEY,
          restaurant_id TEXT NOT NULL,
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'employee',
          permissions TEXT DEFAULT '[]',
          status TEXT DEFAULT 'active',
          last_login TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
        )
      `);

      // Insertar datos de ejemplo
      await this.insertSampleData();

      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SQLite database:', error);
    }
  }

  private async insertSampleData() {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    try {
      // Verificar si ya hay datos en la base de datos
      const restaurantCount = await get('SELECT COUNT(*) as count FROM restaurants') as { count: number };
      const userCount = await get('SELECT COUNT(*) as count FROM restaurant_users') as { count: number };
      
      // Solo insertar datos si la base de datos está completamente vacía
      if (restaurantCount.count === 0 && userCount.count === 0) {
        console.log('📝 Database is empty, inserting sample data...');
        
        // Insertar restaurantes de ejemplo
        await run(`
          INSERT INTO restaurants (id, name, slug, owner_email, owner_name, phone, address, city, country) VALUES
          ('admin', 'Administración General', 'admin', 'admin@restauranteia.com', 'Administrador', '+1-555-0000', 'Sistema', 'Ciudad', 'País'),
          ('rest_001', 'El Buen Sabor', 'elbuensabor', 'admin@elbuensabor.com', 'María González', '+1-555-0101', '123 Main St', 'Ciudad', 'País'),
          ('rest_003', 'La Gaviota', 'lagaviota', 'admin@lagaviota.com', 'Carlos Rodríguez', '+1-555-0103', '456 Ocean Ave', 'Ciudad', 'País')
        `);

        // Insertar usuarios de ejemplo (contraseña: admin123)
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('admin123', 12);

        await run(`
          INSERT INTO restaurant_users (id, restaurant_id, email, password_hash, name, role) VALUES
          ('user_admin', 'admin', 'admin@restauranteia.com', '${passwordHash}', 'Administrador', 'admin'),
          ('user_001', 'rest_001', 'admin@elbuensabor.com', '${passwordHash}', 'María González', 'restaurant'),
          ('user_003', 'rest_003', 'admin@lagaviota.com', '${passwordHash}', 'Carlos Rodríguez', 'restaurant')
        `);

        console.log('✅ Sample data inserted');
      } else {
        console.log('📊 Database already has data, skipping sample data insertion');
        console.log(`   - Restaurants: ${restaurantCount.count}`);
        console.log(`   - Users: ${userCount.count}`);
      }
    } catch (error) {
      console.error('❌ Error inserting sample data:', error);
    }
  }

  // Métodos de consulta
  async getRestaurant(id: string): Promise<Restaurant | null> {
    const get = promisify(this.db.get.bind(this.db));
    try {
      const row = await get(`SELECT * FROM restaurants WHERE id = '${id}'`) as any;
      if (!row) return null;
      
      return {
        ...row,
        config: JSON.parse(row.config),
        retell_config: JSON.parse(row.retell_config),
        twilio_config: JSON.parse(row.twilio_config),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        plan_expires_at: row.plan_expires_at ? new Date(row.plan_expires_at) : undefined
      };
    } catch (error) {
      console.error('Error getting restaurant:', error);
      return null;
    }
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    const get = promisify(this.db.get.bind(this.db));
    try {
      const row = await get(`SELECT * FROM restaurants WHERE slug = '${slug}'`) as any;
      if (!row) return null;
      
      return {
        ...row,
        config: JSON.parse(row.config),
        retell_config: JSON.parse(row.retell_config),
        twilio_config: JSON.parse(row.twilio_config),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        plan_expires_at: row.plan_expires_at ? new Date(row.plan_expires_at) : undefined
      };
    } catch (error) {
      console.error('Error getting restaurant by slug:', error);
      return null;
    }
  }

  async getUserByEmail(email: string, restaurantId?: string): Promise<RestaurantUser | null> {
    const get = promisify(this.db.get.bind(this.db));
    try {
      let query;
      
      if (restaurantId) {
        // Buscar en un restaurante específico
        query = `SELECT * FROM restaurant_users WHERE email = '${email}' AND restaurant_id = '${restaurantId}' AND status = 'active'`;
      } else {
        // Buscar en todos los restaurantes
        query = `SELECT * FROM restaurant_users WHERE email = '${email}' AND status = 'active'`;
      }
      
      const row = await get(query) as any;
      if (!row) return null;
      
      return {
        ...row,
        permissions: JSON.parse(row.permissions),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        last_login: row.last_login ? new Date(row.last_login) : undefined
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateUser(userId: string, updateData: Partial<RestaurantUser>): Promise<boolean> {
    const run = promisify(this.db.run.bind(this.db));
    try {
      const fields = [];
      const values = [];
      
      if (updateData.email) {
        fields.push('email = ?');
        values.push(updateData.email);
      }
      
      if (updateData.password_hash) {
        fields.push('password_hash = ?');
        values.push(updateData.password_hash);
      }
      
      if (updateData.name) {
        fields.push('name = ?');
        values.push(updateData.name);
      }
      
      if (updateData.role) {
        fields.push('role = ?');
        values.push(updateData.role);
      }
      
      if (updateData.permissions) {
        fields.push('permissions = ?');
        values.push(JSON.stringify(updateData.permissions));
      }
      
      if (updateData.status) {
        fields.push('status = ?');
        values.push(updateData.status);
      }
      
      // Siempre actualizar updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');
      
      if (fields.length === 0) {
        return false;
      }
      
      values.push(userId);
      
      const query = `UPDATE restaurant_users SET ${fields.join(', ')} WHERE id = ?`;
      await run(query);
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    try {
      await run(
        `UPDATE restaurant_users SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = '${userId}'`
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async getUserCount(restaurantId: string): Promise<number> {
    const get = promisify(this.db.get.bind(this.db));
    try {
      const result = await get(
        `SELECT COUNT(*) as count FROM restaurant_users WHERE restaurant_id = '${restaurantId}' AND status = 'active'`
      ) as any;
      return result ? result.count : 0;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  async createRestaurant(restaurantData: Partial<Restaurant>): Promise<Restaurant | null> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    try {
      const id = restaurantData.id || `rest_${Date.now()}`;
      const slug = restaurantData.slug || restaurantData.name?.toLowerCase().replace(/\s+/g, '-') || 'restaurant';
      
      await run(`
        INSERT INTO restaurants (
          id, name, slug, owner_email, owner_name, phone, address, city, country,
          config, plan, status, retell_config, twilio_config, created_at, updated_at
        ) VALUES ('${id}', '${restaurantData.name || 'Nuevo Restaurante'}', '${slug}', '${restaurantData.owner_email || ''}', '${restaurantData.owner_name || ''}', '${restaurantData.phone || ''}', '${restaurantData.address || ''}', '${restaurantData.city || ''}', '${restaurantData.country || ''}', '${JSON.stringify(restaurantData.config || {})}', '${restaurantData.plan || 'basic'}', '${restaurantData.status || 'active'}', '${JSON.stringify(restaurantData.retell_config || {})}', '${JSON.stringify(restaurantData.twilio_config || {})}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      // Retornar el restaurante creado
      return await this.getRestaurant(id);
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return null;
    }
  }

  async createUser(userData: Partial<RestaurantUser>): Promise<RestaurantUser | null> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));
    
    try {
      const id = userData.id || `user_${Date.now()}`;
      
      await run(`
        INSERT INTO restaurant_users (
          id, restaurant_id, email, password_hash, name, role, permissions, status, created_at, updated_at
        ) VALUES ('${id}', '${userData.restaurant_id || ''}', '${userData.email || ''}', '${userData.password_hash || ''}', '${userData.name || ''}', '${userData.role || 'employee'}', '${JSON.stringify(userData.permissions || [])}', '${userData.status || 'active'}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      // Retornar el usuario creado
      const row = await get(`SELECT * FROM restaurant_users WHERE id = '${id}'`) as any;
      if (!row) return null;
      
      return {
        ...row,
        permissions: JSON.parse(row.permissions),
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        last_login: row.last_login ? new Date(row.last_login) : undefined
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async updateRestaurant(id: string, updateData: Partial<Restaurant>): Promise<Restaurant | null> {
    const run = promisify(this.db.run.bind(this.db));
    try {
      const fields = [];
      
      if (updateData.name) {
        fields.push(`name = '${updateData.name}'`);
      }
      
      if (updateData.slug) {
        fields.push(`slug = '${updateData.slug}'`);
      }
      
      if (updateData.owner_email) {
        fields.push(`owner_email = '${updateData.owner_email}'`);
      }
      
      if (updateData.owner_name) {
        fields.push(`owner_name = '${updateData.owner_name}'`);
      }
      
      if (updateData.phone) {
        fields.push(`phone = '${updateData.phone}'`);
      }
      
      if (updateData.address) {
        fields.push(`address = '${updateData.address}'`);
      }
      
      if (updateData.city) {
        fields.push(`city = '${updateData.city}'`);
      }
      
      if (updateData.country) {
        fields.push(`country = '${updateData.country}'`);
      }
      
      if (updateData.config) {
        fields.push(`config = '${JSON.stringify(updateData.config)}'`);
      }
      
      if (updateData.plan) {
        fields.push(`plan = '${updateData.plan}'`);
      }
      
      if (updateData.status) {
        fields.push(`status = '${updateData.status}'`);
      }
      
      if (updateData.retell_config) {
        fields.push(`retell_config = '${JSON.stringify(updateData.retell_config)}'`);
      }
      
      if (updateData.twilio_config) {
        fields.push(`twilio_config = '${JSON.stringify(updateData.twilio_config)}'`);
      }
      
      // Siempre actualizar updated_at
      fields.push('updated_at = CURRENT_TIMESTAMP');
      
      if (fields.length === 0) {
        return await this.getRestaurant(id);
      }
      
      const query = `UPDATE restaurants SET ${fields.join(', ')} WHERE id = '${id}'`;
      await run(query);
      
      return await this.getRestaurant(id);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return null;
    }
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    const all = promisify(this.db.all.bind(this.db));
    try {
      // Excluir el restaurante 'admin' de la lista
      const rows = await all("SELECT * FROM restaurants WHERE id != 'admin' ORDER BY created_at DESC") as any[];
      return rows.map(row => ({
        ...row,
        config: row.config ? JSON.parse(row.config) : {},
        retell_config: row.retell_config ? JSON.parse(row.retell_config) : {},
        twilio_config: row.twilio_config ? JSON.parse(row.twilio_config) : {},
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Error getting all restaurants:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const sqliteDb = SQLiteDatabase.getInstance();
export default sqliteDb;