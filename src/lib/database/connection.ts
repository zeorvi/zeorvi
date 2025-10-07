/**
 * Conexión centralizada a la base de datos
 * Maneja PostgreSQL y SQLite según el entorno
 */

import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { logger } from '@/lib/logger';

// Configuración de PostgreSQL
const pgConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Configuración de SQLite
const sqliteConfig = {
  path: path.join(process.cwd(), 'restaurant_dev.db')
};

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pgPool?: Pool;
  private sqliteDb?: sqlite3.Database;
  private isConnected = false;

  private constructor() {
    this.initializeConnection();
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private async initializeConnection() {
    try {
      if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
        await this.initializePostgreSQL();
      } else {
        await this.initializeSQLite();
      }
      this.isConnected = true;
      logger.info('Database connection initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database connection', error);
      throw error;
    }
  }

  private async initializePostgreSQL() {
    this.pgPool = new Pool(pgConfig);
    
    this.pgPool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    // Test connection
    const client = await this.pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    
    logger.info('PostgreSQL connection established');
  }

  private async initializeSQLite() {
    this.sqliteDb = new sqlite3.Database(sqliteConfig.path);
    await this.setupSQLiteTables();
    
    logger.info('SQLite connection established');
  }

  private async setupSQLiteTables() {
    if (!this.sqliteDb) return;

    const run = promisify(this.sqliteDb.run.bind(this.sqliteDb));
    
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

      logger.info('SQLite tables created successfully');
    } catch (error) {
      logger.error('Error creating SQLite tables', error);
      throw error;
    }
  }

  // Métodos públicos para obtener conexiones
  getPostgreSQLPool(): Pool | null {
    return this.pgPool || null;
  }

  getSQLiteDB(): sqlite3.Database | null {
    return this.sqliteDb || null;
  }

  isPostgreSQL(): boolean {
    return !!this.pgPool;
  }

  isSQLite(): boolean {
    return !!this.sqliteDb;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.pgPool) {
        const client = await this.pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
      } else if (this.sqliteDb) {
        const get = promisify(this.sqliteDb.get.bind(this.sqliteDb));
        await get('SELECT 1');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.pgPool) {
        await this.pgPool.end();
        this.pgPool = undefined;
      }
      
      if (this.sqliteDb) {
        return new Promise((resolve, reject) => {
          this.sqliteDb!.close((err) => {
            if (err) reject(err);
            else {
              this.sqliteDb = undefined;
              resolve();
            }
          });
        });
      }
      
      this.isConnected = false;
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections', error);
      throw error;
    }
  }
}

// Instancia singleton
export const dbConnection = DatabaseConnection.getInstance();
export default dbConnection;
