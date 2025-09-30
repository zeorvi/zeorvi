/**
 * Sistema de Base de Datos Propia
 * Reemplaza completamente Firebase Firestore
 */

import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { WebSocketServer } from 'ws';
import { config } from '../config';

// Tipos principales
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
  role: 'admin' | 'manager' | 'employee';
  permissions: string[];
  status: 'active' | 'inactive';
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  position_x: number;
  position_y: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Reservation {
  id: number;
  table_id?: number;
  client_id?: number;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  reservation_date: Date;
  reservation_time: string;
  duration_minutes: number;
  party_size: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'no_show' | 'completed';
  notes?: string;
  special_requests?: string;
  source: 'manual' | 'retell' | 'online' | 'phone';
  source_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  preferences: string[];
  total_visits: number;
  total_spent: number;
  last_visit?: Date;
  created_at: Date;
  updated_at: Date;
}

class RestaurantDatabase {
  public pg: Pool;
  private redis: Redis;
  private wsServer?: WebSocketServer;
  private static instance: RestaurantDatabase;

  constructor() {
    // Configuración PostgreSQL
    this.pg = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Aumentar timeout
    });

    // Manejar errores de conexión PostgreSQL
    this.pg.on('error', (error) => {
      console.warn('PostgreSQL connection error:', error.message);
    });

    // Configuración Redis (opcional para desarrollo)
    try {
      this.redis = new Redis(config.redis.url, {
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      
      this.redis.on('error', (error) => {
        console.warn('Redis connection error (continuing without cache):', error.message);
        this.redis = null as any; // Deshabilitar Redis si hay error
      });
      
      this.redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.warn('Redis initialization failed (continuing without cache):', error);
      this.redis = null as any; // Deshabilitar Redis si hay error
    }

    // Configurar WebSocket para real-time
    this.setupWebSocket();
  }

  static getInstance(): RestaurantDatabase {
    if (!RestaurantDatabase.instance) {
      RestaurantDatabase.instance = new RestaurantDatabase();
    }
    return RestaurantDatabase.instance;
  }

  // =============================================
  // GESTIÓN DE RESTAURANTES
  // =============================================

  async createRestaurant(data: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant> {
    const client = await this.pg.connect();
    
    try {
      await client.query('BEGIN');

      // Insertar restaurante
      const result = await client.query(`
        INSERT INTO restaurants (name, slug, owner_email, owner_name, phone, address, city, country, config, plan, retell_config, twilio_config)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        data.name, data.slug, data.owner_email, data.owner_name, data.phone,
        data.address, data.city, data.country, JSON.stringify(data.config),
        data.plan, JSON.stringify(data.retell_config), JSON.stringify(data.twilio_config)
      ]);

      const restaurant = result.rows[0];

      // Crear schema del restaurante
      await client.query('SELECT create_restaurant_schema($1)', [restaurant.id]);

      await client.query('COMMIT');

      // Cache del restaurante
      await this.redis.hset(`restaurant:${restaurant.id}`, {
        name: restaurant.name,
        slug: restaurant.slug,
        config: JSON.stringify(restaurant.config)
      });

      return restaurant;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRestaurant(id: string): Promise<Restaurant | null> {
    // Intentar desde cache primero (si Redis está disponible)
    if (this.redis) {
      try {
        const cached = await this.redis.hgetall(`restaurant:${id}`);
        if (cached.name) {
          return {
            id,
            name: cached.name,
            slug: cached.slug,
            config: JSON.parse(cached.config || '{}'),
            // ... otros campos desde cache
          } as Restaurant;
        }
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }

    // Si no está en cache, consultar DB
    const result = await this.pg.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;

    const restaurant = result.rows[0];
    
    // Guardar en cache (si Redis está disponible)
    if (this.redis) {
      try {
        await this.redis.hset(`restaurant:${id}`, {
          name: restaurant.name,
          slug: restaurant.slug,
          config: JSON.stringify(restaurant.config)
        });
      } catch (error) {
        console.warn('Redis cache save error:', error);
      }
    }

    return restaurant;
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    const result = await this.pg.query('SELECT * FROM restaurants WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  }

  // =============================================
  // GESTIÓN DE MESAS
  // =============================================

  async getTables(restaurantId: string): Promise<Table[]> {
    const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
    const result = await this.pg.query(`SELECT * FROM ${schemaName}.tables ORDER BY number`);
    return result.rows;
  }

  async updateTableStatus(restaurantId: string, tableId: number, status: string): Promise<void> {
    const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
    
    await this.pg.query(`
      UPDATE ${schemaName}.tables 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `, [status, tableId]);

    // Actualizar cache
    await this.redis.hset(`restaurant:${restaurantId}:tables`, tableId.toString(), status);

    // Notificar cambio en tiempo real
    this.broadcastToRestaurant(restaurantId, {
      type: 'TABLE_STATUS_CHANGE',
      tableId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  async createTable(restaurantId: string, tableData: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<Table> {
    const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
    
    const result = await this.pg.query(`
      INSERT INTO ${schemaName}.tables (number, name, capacity, location, status, position_x, position_y, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      tableData.number, tableData.name, tableData.capacity, tableData.location,
      tableData.status, tableData.position_x, tableData.position_y, tableData.notes
    ]);

    return result.rows[0];
  }

  // =============================================
  // GESTIÓN DE RESERVAS
  // =============================================

  async createReservation(restaurantId: string, reservationData: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation> {
    const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
    
    const result = await this.pg.query(`
      INSERT INTO ${schemaName}.reservations (
        table_id, client_id, client_name, client_phone, client_email,
        reservation_date, reservation_time, duration_minutes, party_size,
        status, notes, special_requests, source, source_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      reservationData.table_id, reservationData.client_id, reservationData.client_name,
      reservationData.client_phone, reservationData.client_email, reservationData.reservation_date,
      reservationData.reservation_time, reservationData.duration_minutes, reservationData.party_size,
      reservationData.status, reservationData.notes, reservationData.special_requests,
      reservationData.source, JSON.stringify(reservationData.source_data)
    ]);

    const reservation = result.rows[0];

    // Si tiene mesa asignada, actualizar estado
    if (reservation.table_id) {
      await this.updateTableStatus(restaurantId, reservation.table_id, 'reserved');
    }

    // Notificar nueva reserva
    this.broadcastToRestaurant(restaurantId, {
      type: 'NEW_RESERVATION',
      reservation,
      timestamp: new Date().toISOString()
    });

    return reservation;
  }

  async getReservations(restaurantId: string, filters: {
    date?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<Reservation[]> {
    const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
    
    let query = `SELECT * FROM ${schemaName}.reservations`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.date) {
      conditions.push(`reservation_date = $${params.length + 1}`);
      params.push(filters.date);
    }

    if (filters.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY reservation_date DESC, reservation_time DESC`;

    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }

    const result = await this.pg.query(query, params);
    return result.rows;
  }

  // =============================================
  // GESTIÓN DE CLIENTES
  // =============================================

  async createOrUpdateClient(restaurantId: string, clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
    
    // Intentar actualizar cliente existente por teléfono
    if (clientData.phone) {
      const existing = await this.pg.query(`
        SELECT * FROM ${schemaName}.clients WHERE phone = $1
      `, [clientData.phone]);

      if (existing.rows.length > 0) {
        // Actualizar cliente existente
        const result = await this.pg.query(`
          UPDATE ${schemaName}.clients 
          SET name = $1, email = $2, notes = $3, preferences = $4, total_visits = total_visits + 1, updated_at = NOW()
          WHERE phone = $5
          RETURNING *
        `, [clientData.name, clientData.email, clientData.notes, JSON.stringify(clientData.preferences), clientData.phone]);
        
        return result.rows[0];
      }
    }

    // Crear nuevo cliente
    const result = await this.pg.query(`
      INSERT INTO ${schemaName}.clients (name, phone, email, notes, preferences, total_visits)
      VALUES ($1, $2, $3, $4, $5, 1)
      RETURNING *
    `, [
      clientData.name, clientData.phone, clientData.email, 
      clientData.notes, JSON.stringify(clientData.preferences)
    ]);

    return result.rows[0];
  }

  // =============================================
  // SISTEMA REAL-TIME (Reemplaza Firebase Real-time)
  // =============================================

  private setupWebSocket() {
    if (typeof window !== 'undefined') return; // Solo en servidor

    // Intentar usar puerto disponible
    const port = config.websocket.port;
    
    try {
      this.wsServer = new WebSocketServer({ port });
      console.log(`WebSocket server started on port ${port}`);
    } catch (error) {
      console.warn(`Could not start WebSocket server on port ${port}:`, error);
      // Continuar sin WebSocket si no se puede iniciar
      return;
    }

    if (!this.wsServer) return;

    this.wsServer.on('connection', (ws, req) => {
      const url = new URL(req.url!, 'http://localhost');
      const restaurantId = url.searchParams.get('restaurantId');

      if (restaurantId) {
        (ws as any).restaurantId = restaurantId;
        console.log(`Restaurant ${restaurantId} connected to WebSocket`);

        // Enviar estado inicial
        this.sendInitialState(ws, restaurantId);
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Restaurant ${restaurantId} disconnected from WebSocket`);
      });
    });
  }

  private async sendInitialState(ws: any, restaurantId: string) {
    try {
      const tables = await this.getTables(restaurantId);
      const todayReservations = await this.getReservations(restaurantId, {
        date: new Date().toISOString().split('T')[0]
      });

      ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        data: {
          tables,
          reservations: todayReservations
        }
      }));
    } catch (error) {
      console.error('Error sending initial state:', error);
    }
  }

  private handleWebSocketMessage(ws: any, data: any) {
    // Manejar mensajes del cliente WebSocket
    switch (data.type) {
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG' }));
        break;
      
      case 'SUBSCRIBE_TABLES':
        // Suscribir a cambios de mesas
        break;
        
      case 'SUBSCRIBE_RESERVATIONS':
        // Suscribir a cambios de reservas
        break;
    }
  }

  private broadcastToRestaurant(restaurantId: string, data: any) {
    if (!this.wsServer) return;

    this.wsServer.clients.forEach((client: any) => {
      if (client.restaurantId === restaurantId && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // =============================================
  // UTILIDADES Y LIMPIEZA
  // =============================================

  // =============================================
  // GESTIÓN DE SESIONES (CACHE)
  // =============================================

  async deleteSession(userId: string): Promise<void> {
    if (!this.redis) {
      console.warn('Redis not available, session not deleted');
      return;
    }
    
    try {
      await this.redis.del(`session:${userId}`);
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      // No lanzar error, continuar sin cache
    }
  }

  async saveSession(userId: string, sessionData: any, ttlSeconds: number = 7 * 24 * 60 * 60): Promise<void> {
    if (!this.redis) {
      console.warn('Redis not available, session not cached');
      return;
    }
    
    try {
      await this.redis.setex(`session:${userId}`, ttlSeconds, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error guardando sesión:', error);
      // No lanzar error, continuar sin cache
    }
  }

  async getSession(userId: string): Promise<any | null> {
    if (!this.redis) {
      console.warn('Redis not available, no session cache');
      return null;
    }
    
    try {
      const sessionData = await this.redis.get(`session:${userId}`);
      if (!sessionData) return null;
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  }

  async closeConnections() {
    try {
      await this.pg.end();
    } catch (error) {
      console.warn('Error closing PostgreSQL connection:', error);
    }
    
    if (this.redis) {
      try {
        this.redis.disconnect();
      } catch (error) {
        console.warn('Error closing Redis connection:', error);
      }
    }
    
    if (this.wsServer) {
      try {
        this.wsServer.close();
      } catch (error) {
        console.warn('Error closing WebSocket server:', error);
      }
    }
  }
}

// Instancia singleton
export const db = RestaurantDatabase.getInstance();
export default db;
