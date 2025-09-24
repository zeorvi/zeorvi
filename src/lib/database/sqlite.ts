/**
 * Sistema de Base de Datos SQLite para Desarrollo
 * Alternativa más simple que PostgreSQL para desarrollo local
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
  password?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RestaurantUser {
  id: string;
  restaurant_id?: string;
  email: string;
  password_hash: string;
  name?: string;
  role: 'admin' | 'restaurant';
  permissions: string[];
  status: 'active' | 'inactive';
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

class SQLiteDatabase {
  private db: Database.Database;
  private static instance: SQLiteDatabase;

  constructor() {
    const dbPath = path.join(process.cwd(), 'restaurant_dev.db');
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  static getInstance(): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase();
    }
    return SQLiteDatabase.instance;
  }

  private initializeTables() {
    // Crear tabla de usuarios
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS restaurant_users (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin', 'restaurant')),
        permissions TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        last_login DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de restaurantes
    this.db.exec(`
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
        config TEXT NOT NULL DEFAULT '{}',
        plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
        plan_expires_at DATETIME,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        retell_config TEXT NOT NULL DEFAULT '{}',
        twilio_config TEXT NOT NULL DEFAULT '{}',
        password TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON restaurant_users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON restaurant_users(role);
      CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
      CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
    `);

    console.log('✅ SQLite database initialized');
  }

  // Métodos para usuarios
  async createUser(userData: Omit<RestaurantUser, 'id' | 'created_at' | 'updated_at'>): Promise<RestaurantUser> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO restaurant_users (
        id, restaurant_id, email, password_hash, name, role, permissions, status, last_login, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      userData.restaurant_id,
      userData.email,
      userData.password_hash,
      userData.name,
      userData.role,
      JSON.stringify(userData.permissions),
      userData.status,
      userData.last_login?.toISOString(),
      now,
      now
    );

    return {
      id,
      ...userData,
      created_at: new Date(now),
      updated_at: new Date(now)
    };
  }

  async getUserByEmail(email: string): Promise<RestaurantUser | null> {
    const stmt = this.db.prepare('SELECT * FROM restaurant_users WHERE email = ?');
    const row = stmt.get(email) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      restaurant_id: row.restaurant_id,
      email: row.email,
      password_hash: row.password_hash,
      name: row.name,
      role: row.role,
      permissions: JSON.parse(row.permissions),
      status: row.status,
      last_login: row.last_login ? new Date(row.last_login) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  async getUserById(id: string): Promise<RestaurantUser | null> {
    const stmt = this.db.prepare('SELECT * FROM restaurant_users WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      restaurant_id: row.restaurant_id,
      email: row.email,
      password_hash: row.password_hash,
      name: row.name,
      role: row.role,
      permissions: JSON.parse(row.permissions),
      status: row.status,
      last_login: row.last_login ? new Date(row.last_login) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE restaurant_users 
      SET last_login = ?, updated_at = ? 
      WHERE id = ?
    `);
    
    const now = new Date().toISOString();
    stmt.run(now, now, id);
  }

  // Métodos para restaurantes
  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant> {
    const id = `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO restaurants (
        id, name, slug, owner_email, owner_name, phone, address, city, country,
        config, plan, plan_expires_at, status, retell_config, twilio_config, password, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      restaurantData.name,
      restaurantData.slug,
      restaurantData.owner_email,
      restaurantData.owner_name,
      restaurantData.phone,
      restaurantData.address,
      restaurantData.city,
      restaurantData.country,
      JSON.stringify(restaurantData.config),
      restaurantData.plan,
      restaurantData.plan_expires_at?.toISOString(),
      restaurantData.status,
      JSON.stringify(restaurantData.retell_config),
      JSON.stringify(restaurantData.twilio_config),
      restaurantData.password,
      now,
      now
    );

    return {
      id,
      ...restaurantData,
      created_at: new Date(now),
      updated_at: new Date(now)
    };
  }

  async getRestaurant(id: string): Promise<Restaurant | null> {
    const stmt = this.db.prepare('SELECT * FROM restaurants WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      owner_email: row.owner_email,
      owner_name: row.owner_name,
      phone: row.phone,
      address: row.address,
      city: row.city,
      country: row.country,
      config: JSON.parse(row.config),
      plan: row.plan,
      plan_expires_at: row.plan_expires_at ? new Date(row.plan_expires_at) : undefined,
      status: row.status,
      retell_config: JSON.parse(row.retell_config),
      twilio_config: JSON.parse(row.twilio_config),
      password: row.password,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    const stmt = this.db.prepare('SELECT * FROM restaurants ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      owner_email: row.owner_email,
      owner_name: row.owner_name,
      phone: row.phone,
      address: row.address,
      city: row.city,
      country: row.country,
      config: JSON.parse(row.config),
      plan: row.plan,
      plan_expires_at: row.plan_expires_at ? new Date(row.plan_expires_at) : undefined,
      status: row.status,
      retell_config: JSON.parse(row.retell_config),
      twilio_config: JSON.parse(row.twilio_config),
      password: row.password,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    }));
  }

  async updateRestaurant(id: string, updateData: Partial<Restaurant>): Promise<Restaurant | null> {
    const now = new Date().toISOString();
    const fields = [];
    const values = [];
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = ?`);
        if (typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else if (value instanceof Date) {
          values.push(value.toISOString());
        } else {
          values.push(value);
        }
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updated_at = ?');
    values.push(now, id);
    
    const stmt = this.db.prepare(`UPDATE restaurants SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return this.getRestaurant(id);
  }

  // Simular conexión PostgreSQL para compatibilidad
  get pg() {
    return {
      connect: () => Promise.resolve({
        query: (sql: string, params: any[] = []) => {
          const stmt = this.db.prepare(sql);
          if (sql.trim().toUpperCase().startsWith('SELECT')) {
            return Promise.resolve({ rows: stmt.all(...params) });
          } else {
            return Promise.resolve({ rows: [] });
          }
        },
        release: () => Promise.resolve()
      }),
      query: (sql: string, params: any[] = []) => {
        const stmt = this.db.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          return Promise.resolve({ rows: stmt.all(...params) });
        } else {
          return Promise.resolve({ rows: [] });
        }
      }
    };
  }
}

// Instancia singleton
export const db = SQLiteDatabase.getInstance();
export default db;
