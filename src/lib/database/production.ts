import { Pool } from 'pg';
import { logger } from '@/lib/logger';

// Interfaces para el sistema de producción
export interface TableState {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  capacity: number;
  location: string;
  status: 'libre' | 'ocupada' | 'reservada' | 'ocupado_todo_dia' | 'mantenimiento';
  currentReservationId?: string;
  clientName?: string;
  clientPhone?: string;
  partySize?: number;
  notes?: string;
  occupiedAt?: Date;
  lastUpdated: Date;
  createdAt: Date;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  tableId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  status: 'pendiente' | 'confirmada' | 'ocupada' | 'cancelada' | 'completada';
  specialRequests?: string;
  locationPreference?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  notes?: string;
}

export interface RestaurantSchedule {
  id: string;
  restaurantId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openingTime?: string;
  closingTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantMetrics {
  id: string;
  restaurantId: string;
  date: string;
  hour: number;
  totalTables: number;
  occupiedTables: number;
  reservedTables: number;
  freeTables: number;
  occupancyRate: number;
  revenue?: number;
  averageTableTime?: number;
  createdAt: Date;
}

export interface OccupancyPrediction {
  id: string;
  restaurantId: string;
  predictionDate: string;
  predictionHour: number;
  predictedOccupancy: number;
  confidenceScore: number;
  factors?: any;
  createdAt: Date;
}

export interface SystemEvent {
  id: string;
  restaurantId: string;
  eventType: string;
  eventData: any;
  userId?: string;
  source: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  email?: string;
  preferences?: any;
  totalVisits: number;
  lastVisit?: string;
  createdAt: Date;
  updatedAt: Date;
}

class ProductionDatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  // ===== GESTIÓN DE MESAS =====

  async getTableStates(restaurantId: string): Promise<TableState[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM table_states WHERE restaurant_id = $1 ORDER BY table_name',
        [restaurantId]
      );
      return result.rows.map(this.mapTableState);
    } finally {
      client.release();
    }
  }

  async getTableState(restaurantId: string, tableId: string): Promise<TableState | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM table_states WHERE restaurant_id = $1 AND table_id = $2',
        [restaurantId, tableId]
      );
      return result.rows.length > 0 ? this.mapTableState(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  async updateTableState(
    restaurantId: string,
    tableId: string,
    status: TableState['status'],
    clientData?: {
      name?: string;
      phone?: string;
      partySize?: number;
      notes?: string;
    }
  ): Promise<TableState> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Actualizar estado de la mesa
      const updateQuery = `
        UPDATE table_states 
        SET 
          status = $3,
          client_name = $4,
          client_phone = $5,
          party_size = $6,
          notes = $7,
          occupied_at = CASE WHEN $3 IN ('ocupada', 'ocupado_todo_dia') THEN CURRENT_TIMESTAMP ELSE occupied_at END,
          last_updated = CURRENT_TIMESTAMP
        WHERE restaurant_id = $1 AND table_id = $2
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        restaurantId,
        tableId,
        status,
        clientData?.name || null,
        clientData?.phone || null,
        clientData?.partySize || null,
        clientData?.notes || null
      ]);

      if (result.rows.length === 0) {
        throw new Error(`Mesa ${tableId} no encontrada en restaurante ${restaurantId}`);
      }

      // Registrar evento del sistema
      await this.logSystemEvent(restaurantId, 'table_status_changed', {
        tableId,
        status,
        clientData,
        timestamp: new Date().toISOString()
      }, 'dashboard');

      await client.query('COMMIT');
      return this.mapTableState(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async initializeTables(restaurantId: string, tables: Array<{
    id: string;
    name: string;
    capacity: number;
    location: string;
  }>): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Eliminar mesas existentes
      await client.query('DELETE FROM table_states WHERE restaurant_id = $1', [restaurantId]);

      // Insertar nuevas mesas
      for (const table of tables) {
        await client.query(`
          INSERT INTO table_states (
            restaurant_id, table_id, table_name, capacity, location, status
          ) VALUES ($1, $2, $3, $4, $5, 'libre')
        `, [restaurantId, table.id, table.name, table.capacity, table.location]);
      }

      await client.query('COMMIT');
      logger.info(`Inicializadas ${tables.length} mesas para restaurante ${restaurantId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== GESTIÓN DE RESERVAS =====

  async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO reservations (
          restaurant_id, table_id, client_name, client_phone, client_email,
          party_size, reservation_date, reservation_time, status,
          special_requests, location_preference, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        reservation.restaurantId,
        reservation.tableId,
        reservation.clientName,
        reservation.clientPhone,
        reservation.clientEmail,
        reservation.partySize,
        reservation.reservationDate,
        reservation.reservationTime,
        reservation.status,
        reservation.specialRequests,
        reservation.locationPreference,
        reservation.notes
      ]);

      const newReservation = this.mapReservation(result.rows[0]);

      // Registrar evento
      await this.logSystemEvent(reservation.restaurantId, 'reservation_created', {
        reservationId: newReservation.id,
        clientName: reservation.clientName,
        partySize: reservation.partySize,
        date: reservation.reservationDate,
        time: reservation.reservationTime
      }, 'retell');

      return newReservation;
    } finally {
      client.release();
    }
  }

  async getReservations(
    restaurantId: string,
    date?: string,
    status?: string
  ): Promise<Reservation[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM reservations WHERE restaurant_id = $1';
      const params: any[] = [restaurantId];

      if (date) {
        query += ' AND reservation_date = $2';
        params.push(date);
      }

      if (status) {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      query += ' ORDER BY reservation_date, reservation_time';

      const result = await client.query(query, params);
      return result.rows.map(this.mapReservation);
    } finally {
      client.release();
    }
  }

  // ===== GESTIÓN DE HORARIOS =====

  async getRestaurantSchedule(restaurantId: string): Promise<RestaurantSchedule[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM restaurant_schedules WHERE restaurant_id = $1 ORDER BY day_of_week',
        [restaurantId]
      );
      return result.rows.map(this.mapRestaurantSchedule);
    } finally {
      client.release();
    }
  }

  async updateRestaurantSchedule(
    restaurantId: string,
    schedules: Array<{
      dayOfWeek: RestaurantSchedule['dayOfWeek'];
      isOpen: boolean;
      openingTime?: string;
      closingTime?: string;
    }>
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const schedule of schedules) {
        await client.query(`
          INSERT INTO restaurant_schedules (restaurant_id, day_of_week, is_open, opening_time, closing_time)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (restaurant_id, day_of_week)
          DO UPDATE SET
            is_open = EXCLUDED.is_open,
            opening_time = EXCLUDED.opening_time,
            closing_time = EXCLUDED.closing_time,
            updated_at = CURRENT_TIMESTAMP
        `, [
          restaurantId,
          schedule.dayOfWeek,
          schedule.isOpen,
          schedule.openingTime,
          schedule.closingTime
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== MÉTRICAS =====

  async getRestaurantMetrics(
    restaurantId: string,
    date?: string
  ): Promise<RestaurantMetrics[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM restaurant_metrics WHERE restaurant_id = $1';
      const params: any[] = [restaurantId];

      if (date) {
        query += ' AND date = $2';
        params.push(date);
      }

      query += ' ORDER BY date DESC, hour DESC';

      const result = await client.query(query, params);
      return result.rows.map(this.mapRestaurantMetrics);
    } finally {
      client.release();
    }
  }

  async getCurrentMetrics(restaurantId: string): Promise<{
    totalTables: number;
    occupiedTables: number;
    reservedTables: number;
    freeTables: number;
    occupancyRate: number;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_tables,
          COUNT(*) FILTER (WHERE status = 'ocupada') as occupied_tables,
          COUNT(*) FILTER (WHERE status = 'reservada') as reserved_tables,
          COUNT(*) FILTER (WHERE status = 'libre') as free_tables,
          ROUND(
            (COUNT(*) FILTER (WHERE status IN ('ocupada', 'reservada'))::DECIMAL / COUNT(*)) * 100, 
            2
          ) as occupancy_rate
        FROM table_states 
        WHERE restaurant_id = $1
      `, [restaurantId]);

      const row = result.rows[0];
      return {
        totalTables: parseInt(row.total_tables),
        occupiedTables: parseInt(row.occupied_tables),
        reservedTables: parseInt(row.reserved_tables),
        freeTables: parseInt(row.free_tables),
        occupancyRate: parseFloat(row.occupancy_rate)
      };
    } finally {
      client.release();
    }
  }

  // ===== PREDICCIONES =====

  async createOccupancyPrediction(prediction: Omit<OccupancyPrediction, 'id' | 'createdAt'>): Promise<OccupancyPrediction> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO occupancy_predictions (
          restaurant_id, prediction_date, prediction_hour, 
          predicted_occupancy, confidence_score, factors
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (restaurant_id, prediction_date, prediction_hour)
        DO UPDATE SET
          predicted_occupancy = EXCLUDED.predicted_occupancy,
          confidence_score = EXCLUDED.confidence_score,
          factors = EXCLUDED.factors
        RETURNING *
      `, [
        prediction.restaurantId,
        prediction.predictionDate,
        prediction.predictionHour,
        prediction.predictedOccupancy,
        prediction.confidenceScore,
        JSON.stringify(prediction.factors)
      ]);

      return this.mapOccupancyPrediction(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getOccupancyPredictions(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<OccupancyPrediction[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM occupancy_predictions 
        WHERE restaurant_id = $1 
        AND prediction_date BETWEEN $2 AND $3
        ORDER BY prediction_date, prediction_hour
      `, [restaurantId, startDate, endDate]);

      return result.rows.map(this.mapOccupancyPrediction);
    } finally {
      client.release();
    }
  }

  // ===== EVENTOS DEL SISTEMA =====

  async logSystemEvent(
    restaurantId: string,
    eventType: string,
    eventData: any,
    source: string,
    userId?: string
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO system_events (restaurant_id, event_type, event_data, user_id, source)
        VALUES ($1, $2, $3, $4, $5)
      `, [restaurantId, eventType, JSON.stringify(eventData), userId, source]);
    } finally {
      client.release();
    }
  }

  async getSystemEvents(
    restaurantId: string,
    eventType?: string,
    limit: number = 100
  ): Promise<SystemEvent[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM system_events WHERE restaurant_id = $1';
      const params: any[] = [restaurantId];

      if (eventType) {
        query += ' AND event_type = $2';
        params.push(eventType);
      }

      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await client.query(query, params);
      return result.rows.map(this.mapSystemEvent);
    } finally {
      client.release();
    }
  }

  // ===== CLIENTES =====

  async createOrUpdateClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const dbClient = await this.pool.connect();
    try {
      const result = await dbClient.query(`
        INSERT INTO clients (restaurant_id, name, phone, email, preferences, total_visits, last_visit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (restaurant_id, phone)
        DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          preferences = EXCLUDED.preferences,
          total_visits = clients.total_visits + 1,
          last_visit = EXCLUDED.last_visit,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        client.restaurantId,
        client.name,
        client.phone,
        client.email,
        JSON.stringify(client.preferences),
        client.totalVisits,
        client.lastVisit
      ]);

      return this.mapClient(result.rows[0]);
    } finally {
      dbClient.release();
    }
  }

  async getClient(restaurantId: string, phone: string): Promise<Client | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM clients WHERE restaurant_id = $1 AND phone = $2',
        [restaurantId, phone]
      );
      return result.rows.length > 0 ? this.mapClient(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  // ===== MÉTODOS DE MAPEO =====

  private mapTableState(row: any): TableState {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      tableId: row.table_id,
      tableName: row.table_name,
      capacity: row.capacity,
      location: row.location,
      status: row.status,
      currentReservationId: row.current_reservation_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      partySize: row.party_size,
      notes: row.notes,
      occupiedAt: row.occupied_at,
      lastUpdated: row.last_updated,
      createdAt: row.created_at
    };
  }

  private mapReservation(row: any): Reservation {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      tableId: row.table_id,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      partySize: row.party_size,
      reservationDate: row.reservation_date,
      reservationTime: row.reservation_time,
      status: row.status,
      specialRequests: row.special_requests,
      locationPreference: row.location_preference,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      confirmedAt: row.confirmed_at,
      cancelledAt: row.cancelled_at,
      notes: row.notes
    };
  }

  private mapRestaurantSchedule(row: any): RestaurantSchedule {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      dayOfWeek: row.day_of_week,
      isOpen: row.is_open,
      openingTime: row.opening_time,
      closingTime: row.closing_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRestaurantMetrics(row: any): RestaurantMetrics {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      date: row.date,
      hour: row.hour,
      totalTables: row.total_tables,
      occupiedTables: row.occupied_tables,
      reservedTables: row.reserved_tables,
      freeTables: row.free_tables,
      occupancyRate: parseFloat(row.occupancy_rate),
      revenue: row.revenue,
      averageTableTime: row.average_table_time,
      createdAt: row.created_at
    };
  }

  private mapOccupancyPrediction(row: any): OccupancyPrediction {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      predictionDate: row.prediction_date,
      predictionHour: row.prediction_hour,
      predictedOccupancy: parseFloat(row.predicted_occupancy),
      confidenceScore: parseFloat(row.confidence_score),
      factors: row.factors,
      createdAt: row.created_at
    };
  }

  private mapSystemEvent(row: any): SystemEvent {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      eventType: row.event_type,
      eventData: row.event_data,
      userId: row.user_id,
      source: row.source,
      createdAt: row.created_at
    };
  }

  private mapClient(row: any): Client {
    return {
      id: row.id,
      restaurantId: row.restaurant_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      preferences: row.preferences,
      totalVisits: row.total_visits,
      lastVisit: row.last_visit,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ===== UTILIDADES =====

  async close(): Promise<void> {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
}

// Instancia singleton
export const productionDb = new ProductionDatabaseService();
export default productionDb;
