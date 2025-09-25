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