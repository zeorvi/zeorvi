import { POST, GET } from '../retell/reservations/route'
import { NextRequest } from 'next/server'
import { getRestaurantConfig } from '@/lib/restaurantConfigs'

// Mock dependencies
jest.mock('@/lib/restaurantConfigs')
jest.mock('@/lib/auth', () => ({
  requireAuth: (handler: Function) => handler,
  requirePermission: () => (handler: Function) => handler,
}))
jest.mock('@/lib/errorHandler', () => ({
  errorHandler: (handler: Function) => handler,
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404
    constructor(message: string) {
      super(message)
    }
  },
  ConflictError: class ConflictError extends Error {
    statusCode = 409
    constructor(message: string) {
      super(message)
    }
  },
}))

const mockGetRestaurantConfig = getRestaurantConfig as jest.MockedFunction<typeof getRestaurantConfig>

describe('/api/retell/reservations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Create Reservation', () => {
    const validReservationData = {
      restaurantId: 'rest_123',
      clientName: 'Juan Pérez',
      clientPhone: '+1234567890',
      date: '2024-01-15',
      time: '19:00',
      people: 4,
      location: 'Terraza',
      notes: 'Mesa cerca de la ventana'
    }

    const mockRestaurantConfig = {
      id: 'rest_123',
      name: 'Test Restaurant',
      tables: [
        {
          id: 'table_1',
          name: 'Mesa 1',
          capacity: 4,
          location: 'Terraza'
        },
        {
          id: 'table_2',
          name: 'Mesa 2',
          capacity: 6,
          location: 'Interior'
        }
      ]
    }

    it('should create a reservation successfully', async () => {
      mockGetRestaurantConfig.mockReturnValue(mockRestaurantConfig)

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(validReservationData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.reservation).toMatchObject({
        restaurantId: 'rest_123',
        clientName: 'Juan Pérez',
        clientPhone: '+1234567890',
        date: '2024-01-15',
        time: '19:00',
        people: 4,
        location: 'Terraza',
        status: 'confirmada'
      })
      expect(data.reservation.id).toMatch(/^res_\d+$/)
    })

    it('should return 404 for non-existent restaurant', async () => {
      mockGetRestaurantConfig.mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(validReservationData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await expect(POST(request)).rejects.toThrow('Restaurante no encontrado')
    })

    it('should return 409 when no tables available', async () => {
      const configWithoutTables = {
        ...mockRestaurantConfig,
        tables: []
      }
      mockGetRestaurantConfig.mockReturnValue(configWithoutTables)

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(validReservationData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await expect(POST(request)).rejects.toThrow('No hay mesas disponibles')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        restaurantId: 'rest_123',
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate phone number format', async () => {
      const invalidPhoneData = {
        ...validReservationData,
        clientPhone: 'invalid-phone'
      }

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(invalidPhoneData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate date format', async () => {
      const invalidDateData = {
        ...validReservationData,
        date: 'invalid-date'
      }

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(invalidDateData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await expect(POST(request)).rejects.toThrow()
    })

    it('should validate people count', async () => {
      const invalidPeopleData = {
        ...validReservationData,
        people: 0
      }

      const request = new NextRequest('http://localhost:3000/api/retell/reservations', {
        method: 'POST',
        body: JSON.stringify(invalidPeopleData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await expect(POST(request)).rejects.toThrow()
    })
  })

  describe('GET - Check Availability', () => {
    const mockRestaurantConfig = {
      id: 'rest_123',
      name: 'Test Restaurant',
      tables: [
        {
          id: 'table_1',
          name: 'Mesa 1',
          capacity: 4,
          location: 'Terraza'
        },
        {
          id: 'table_2',
          name: 'Mesa 2',
          capacity: 6,
          location: 'Interior'
        },
        {
          id: 'table_3',
          name: 'Mesa 3',
          capacity: 2,
          location: 'Terraza'
        }
      ]
    }

    it('should return availability for valid parameters', async () => {
      mockGetRestaurantConfig.mockReturnValue(mockRestaurantConfig)

      const url = new URL('http://localhost:3000/api/retell/reservations')
      url.searchParams.set('restaurantId', 'rest_123')
      url.searchParams.set('date', '2024-01-15')
      url.searchParams.set('time', '19:00')
      url.searchParams.set('people', '4')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.date).toBe('2024-01-15')
      expect(data.time).toBe('19:00')
      expect(data.people).toBe(4)
      expect(data.totalAvailable).toBe(2) // tables with capacity >= 4
      expect(data.availability).toHaveLength(2) // Terraza and Interior
    })

    it('should return 404 for non-existent restaurant', async () => {
      mockGetRestaurantConfig.mockReturnValue(null)

      const url = new URL('http://localhost:3000/api/retell/reservations')
      url.searchParams.set('restaurantId', 'invalid_rest')
      url.searchParams.set('date', '2024-01-15')
      url.searchParams.set('time', '19:00')
      url.searchParams.set('people', '4')

      const request = new NextRequest(url)
      
      await expect(GET(request)).rejects.toThrow('Restaurante no encontrado')
    })

    it('should require all parameters', async () => {
      const url = new URL('http://localhost:3000/api/retell/reservations')
      url.searchParams.set('restaurantId', 'rest_123')
      // Missing other required parameters

      const request = new NextRequest(url)
      
      await expect(GET(request)).rejects.toThrow('Missing required parameters')
    })

    it('should filter tables by capacity', async () => {
      mockGetRestaurantConfig.mockReturnValue(mockRestaurantConfig)

      const url = new URL('http://localhost:3000/api/retell/reservations')
      url.searchParams.set('restaurantId', 'rest_123')
      url.searchParams.set('date', '2024-01-15')
      url.searchParams.set('time', '19:00')
      url.searchParams.set('people', '6')

      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(data.totalAvailable).toBe(1) // Only table_2 has capacity >= 6
    })
  })
})
