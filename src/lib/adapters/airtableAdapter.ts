import Airtable from 'airtable'
import { logger } from '@/lib/logger'

// Configuración de Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID || '')

// Interfaces
export interface AirtableRecord<T = any> {
  id: string
  fields: T
  createdTime: string
}

export interface RestaurantRecord {
  ID: string
  Nombre: string
  Email: string
  FirebaseUID: string
  NumeroTwilio: string
  Direccion: string
  Activo: boolean
}

export interface TableRecord {
  ID: string
  Numero: number
  Capacidad: number
  Ubicacion: string
  Restaurante: string[]
  Disponible: boolean
}

export interface ReservationRecord {
  ID: string
  Fecha: string
  Hora: string
  Personas: number
  Cliente: string
  Telefono: string
  Mesa: string[]
  Estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada'
  Notas?: string
  Restaurante: string[]
  CreadoPorIA: boolean
}

export interface ClientRecord {
  ID: string
  Nombre: string
  Telefono: string
  Email?: string
  HistorialReservas?: string[]
  Restaurante: string[]
}

// Circuit breaker para Airtable
class AirtableCircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  private readonly maxFailures = 3
  private readonly retryTimeout = 60000 // 1 minuto

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.retryTimeout) {
        this.state = 'HALF_OPEN'
        logger.info('Airtable circuit breaker: transitioning to HALF_OPEN')
      } else {
        throw new Error('Airtable service temporarily unavailable (circuit breaker OPEN)')
      }
    }

    try {
      const result = await operation()
      
      if (this.state === 'HALF_OPEN') {
        this.reset()
        logger.info('Airtable circuit breaker: service recovered, transitioning to CLOSED')
      }
      
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN'
      logger.warn('Airtable circuit breaker: too many failures, transitioning to OPEN', {
        failures: this.failures
      })
    }
  }

  private reset() {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
  }

  getState() {
    return {
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      state: this.state
    }
  }
}

// Adaptador principal de Airtable
export class AirtableAdapter {
  private base: Airtable.Base
  private circuitBreaker = new AirtableCircuitBreaker()

  constructor() {
    this.base = base
  }

  // Métodos genéricos para operaciones CRUD
  private async findRecords<T>(
    tableName: string, 
    options: {
      filterByFormula?: string
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
      maxRecords?: number
      view?: string
    } = {}
  ): Promise<AirtableRecord<T>[]> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Querying Airtable records', { tableName, options })

        const records = await this.base(tableName).select({
          ...options,
          ...(options.sort && { sort: options.sort })
        }).all()

        const formattedRecords = records.map(record => ({
          id: record.id,
          fields: record.fields as T,
          createdTime: record.get('Created Time') as string || record._rawJson.createdTime
        }))

        logger.info('Airtable records retrieved', { 
          tableName, 
          count: formattedRecords.length 
        })

        return formattedRecords
      } catch (error: any) {
        logger.error('Error querying Airtable records', {
          error: error.message,
          tableName,
          options
        })
        throw new Error(`Failed to query ${tableName}: ${error.message}`)
      }
    })
  }

  private async createRecord<T>(
    tableName: string, 
    fields: Partial<T>
  ): Promise<AirtableRecord<T>> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Creating Airtable record', { tableName, fields })

        const record = await this.base(tableName).create(fields as any)

        const formattedRecord = {
          id: record.id,
          fields: record.fields as T,
          createdTime: record.get('Created Time') as string || record._rawJson.createdTime
        }

        logger.info('Airtable record created', { 
          tableName, 
          recordId: record.id 
        })

        return formattedRecord
      } catch (error: any) {
        logger.error('Error creating Airtable record', {
          error: error.message,
          tableName,
          fields
        })
        throw new Error(`Failed to create ${tableName} record: ${error.message}`)
      }
    })
  }

  private async updateRecord<T>(
    tableName: string, 
    recordId: string, 
    fields: Partial<T>
  ): Promise<AirtableRecord<T>> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Updating Airtable record', { tableName, recordId, fields })

        const record = await this.base(tableName).update(recordId, fields as any)

        const formattedRecord = {
          id: record.id,
          fields: record.fields as T,
          createdTime: record.get('Created Time') as string || record._rawJson.createdTime
        }

        logger.info('Airtable record updated', { 
          tableName, 
          recordId 
        })

        return formattedRecord
      } catch (error: any) {
        logger.error('Error updating Airtable record', {
          error: error.message,
          tableName,
          recordId,
          fields
        })
        throw new Error(`Failed to update ${tableName} record: ${error.message}`)
      }
    })
  }

  private async deleteRecord(tableName: string, recordId: string): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.base(tableName).destroy(recordId)

        logger.info('Airtable record deleted', { tableName, recordId })
      } catch (error: any) {
        logger.error('Error deleting Airtable record', {
          error: error.message,
          tableName,
          recordId
        })
        throw new Error(`Failed to delete ${tableName} record: ${error.message}`)
      }
    })
  }

  // Métodos específicos para restaurantes
  async getRestaurants(): Promise<AirtableRecord<RestaurantRecord>[]> {
    return this.findRecords<RestaurantRecord>('Restaurantes', {
      filterByFormula: '{Activo} = TRUE()',
      sort: [{ field: 'Nombre', direction: 'asc' }]
    })
  }

  async getRestaurantById(restaurantId: string): Promise<AirtableRecord<RestaurantRecord> | null> {
    const restaurants = await this.findRecords<RestaurantRecord>('Restaurantes', {
      filterByFormula: `{ID} = "${restaurantId}"`,
      maxRecords: 1
    })
    return restaurants[0] || null
  }

  async getRestaurantByTwilioNumber(twilioNumber: string): Promise<AirtableRecord<RestaurantRecord> | null> {
    const restaurants = await this.findRecords<RestaurantRecord>('Restaurantes', {
      filterByFormula: `{NumeroTwilio} = "${twilioNumber}"`,
      maxRecords: 1
    })
    return restaurants[0] || null
  }

  async createRestaurant(data: Omit<RestaurantRecord, 'ID'>): Promise<AirtableRecord<RestaurantRecord>> {
    return this.createRecord<RestaurantRecord>('Restaurantes', data)
  }

  async updateRestaurant(recordId: string, data: Partial<RestaurantRecord>): Promise<AirtableRecord<RestaurantRecord>> {
    return this.updateRecord<RestaurantRecord>('Restaurantes', recordId, data)
  }

  // Métodos específicos para mesas
  async getTables(restaurantId: string): Promise<AirtableRecord<TableRecord>[]> {
    return this.findRecords<TableRecord>('Mesas', {
      filterByFormula: `FIND("${restaurantId}", ARRAYJOIN({Restaurante}))`,
      sort: [{ field: 'Numero', direction: 'asc' }]
    })
  }

  async createTable(data: Omit<TableRecord, 'ID'>): Promise<AirtableRecord<TableRecord>> {
    return this.createRecord<TableRecord>('Mesas', data)
  }

  async updateTable(recordId: string, data: Partial<TableRecord>): Promise<AirtableRecord<TableRecord>> {
    return this.updateRecord<TableRecord>('Mesas', recordId, data)
  }

  // Métodos específicos para reservas
  async getReservations(restaurantId: string, options: {
    date?: string
    status?: string
    limit?: number
  } = {}): Promise<AirtableRecord<ReservationRecord>[]> {
    let filterFormula = `FIND("${restaurantId}", ARRAYJOIN({Restaurante}))`

    if (options.date) {
      filterFormula += ` AND {Fecha} = "${options.date}"`
    }

    if (options.status) {
      filterFormula += ` AND {Estado} = "${options.status}"`
    }

    return this.findRecords<ReservationRecord>('Reservas', {
      filterByFormula: filterFormula,
      sort: [
        { field: 'Fecha', direction: 'desc' },
        { field: 'Hora', direction: 'asc' }
      ],
      maxRecords: options.limit
    })
  }

  async createReservation(data: Omit<ReservationRecord, 'ID'>): Promise<AirtableRecord<ReservationRecord>> {
    return this.createRecord<ReservationRecord>('Reservas', data)
  }

  async updateReservation(recordId: string, data: Partial<ReservationRecord>): Promise<AirtableRecord<ReservationRecord>> {
    return this.updateRecord<ReservationRecord>('Reservas', recordId, data)
  }

  async deleteReservation(recordId: string): Promise<void> {
    return this.deleteRecord('Reservas', recordId)
  }

  // Métodos específicos para clientes
  async getClients(restaurantId: string): Promise<AirtableRecord<ClientRecord>[]> {
    return this.findRecords<ClientRecord>('Clientes', {
      filterByFormula: `FIND("${restaurantId}", ARRAYJOIN({Restaurante}))`,
      sort: [{ field: 'Nombre', direction: 'asc' }]
    })
  }

  async getClientByPhone(phone: string, restaurantId: string): Promise<AirtableRecord<ClientRecord> | null> {
    const clients = await this.findRecords<ClientRecord>('Clientes', {
      filterByFormula: `AND({Telefono} = "${phone}", FIND("${restaurantId}", ARRAYJOIN({Restaurante})))`,
      maxRecords: 1
    })
    return clients[0] || null
  }

  async createClient(data: Omit<ClientRecord, 'ID'>): Promise<AirtableRecord<ClientRecord>> {
    return this.createRecord<ClientRecord>('Clientes', data)
  }

  async updateClient(recordId: string, data: Partial<ClientRecord>): Promise<AirtableRecord<ClientRecord>> {
    return this.updateRecord<ClientRecord>('Clientes', recordId, data)
  }

  // Método para crear reserva completa (con cliente si no existe)
  async createCompleteReservation(reservationData: {
    restaurantId: string
    clientName: string
    clientPhone: string
    clientEmail?: string
    date: string
    time: string
    people: number
    notes?: string
    location?: string
    createdByAI?: boolean
  }): Promise<{
    reservation: AirtableRecord<ReservationRecord>
    client: AirtableRecord<ClientRecord>
    isNewClient: boolean
  }> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Creating complete reservation', {
          restaurantId: reservationData.restaurantId,
          clientName: reservationData.clientName,
          date: reservationData.date
        })

        // Buscar o crear cliente
        let client = await this.getClientByPhone(reservationData.clientPhone, reservationData.restaurantId)
        let isNewClient = false

        if (!client) {
          client = await this.createClient({
            Nombre: reservationData.clientName,
            Telefono: reservationData.clientPhone,
            Email: reservationData.clientEmail,
            Restaurante: [reservationData.restaurantId]
          })
          isNewClient = true
        }

        // Buscar mesa disponible (simplificado - en producción sería más complejo)
        const tables = await this.getTables(reservationData.restaurantId)
        const availableTable = tables.find(table => 
          table.fields.Capacidad >= reservationData.people &&
          (!reservationData.location || table.fields.Ubicacion === reservationData.location)
        )

        // Crear reserva
        const reservation = await this.createReservation({
          Fecha: reservationData.date,
          Hora: reservationData.time,
          Personas: reservationData.people,
          Cliente: reservationData.clientName,
          Telefono: reservationData.clientPhone,
          Mesa: availableTable ? [availableTable.id] : [],
          Estado: 'Confirmada',
          Notas: reservationData.notes,
          Restaurante: [reservationData.restaurantId],
          CreadoPorIA: reservationData.createdByAI || false
        })

        logger.info('Complete reservation created successfully', {
          reservationId: reservation.id,
          clientId: client.id,
          isNewClient
        })

        return {
          reservation,
          client,
          isNewClient
        }
      } catch (error: any) {
        logger.error('Error creating complete reservation', {
          error: error.message,
          reservationData
        })
        throw new Error(`Failed to create complete reservation: ${error.message}`)
      }
    })
  }

  // Obtener estado del servicio
  async getServiceStatus(): Promise<{
    available: boolean
    circuitBreakerState: any
    lastCheck: Date
  }> {
    try {
      // Hacer una consulta simple para verificar el estado
      await this.findRecords('Restaurantes', { maxRecords: 1 })
      
      return {
        available: true,
        circuitBreakerState: this.circuitBreaker.getState(),
        lastCheck: new Date()
      }
    } catch (error) {
      logger.error('Airtable service health check failed', { error })
      
      return {
        available: false,
        circuitBreakerState: this.circuitBreaker.getState(),
        lastCheck: new Date()
      }
    }
  }

  // Obtener métricas de un restaurante
  async getRestaurantMetrics(restaurantId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalReservations: number
    confirmedReservations: number
    cancelledReservations: number
    totalGuests: number
    averagePartySize: number
    occupancyRate: number
  }> {
    return this.circuitBreaker.execute(async () => {
      try {
        const now = new Date()
        let startDate: string

        switch (period) {
          case 'day':
            startDate = now.toISOString().split('T')[0]
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            startDate = weekAgo.toISOString().split('T')[0]
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            startDate = monthAgo.toISOString().split('T')[0]
            break
        }

        const reservations = await this.getReservations(restaurantId, {
          // Para métricas, no filtramos por fecha específica en la query
          // ya que queremos un rango
        })

        // Filtrar por período
        const filteredReservations = reservations.filter(r => r.fields.Fecha >= startDate)

        const totalReservations = filteredReservations.length
        const confirmedReservations = filteredReservations.filter(r => r.fields.Estado === 'Confirmada').length
        const cancelledReservations = filteredReservations.filter(r => r.fields.Estado === 'Cancelada').length
        const totalGuests = filteredReservations.reduce((sum, r) => sum + r.fields.Personas, 0)
        const averagePartySize = totalReservations > 0 ? totalGuests / totalReservations : 0

        // Obtener capacidad total para calcular ocupación
        const tables = await this.getTables(restaurantId)
        const totalCapacity = tables.reduce((sum, t) => sum + t.fields.Capacidad, 0)
        const occupancyRate = totalCapacity > 0 ? (totalGuests / totalCapacity) * 100 : 0

        return {
          totalReservations,
          confirmedReservations,
          cancelledReservations,
          totalGuests,
          averagePartySize: Math.round(averagePartySize * 100) / 100,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        }
      } catch (error: any) {
        logger.error('Error calculating restaurant metrics', {
          error: error.message,
          restaurantId,
          period
        })
        throw new Error(`Failed to calculate metrics: ${error.message}`)
      }
    })
  }
}

// Instancia singleton del adaptador
export const airtableAdapter = new AirtableAdapter()

export default airtableAdapter
