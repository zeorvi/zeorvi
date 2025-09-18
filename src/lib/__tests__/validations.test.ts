import { 
  loginSchema, 
  reservationSchema, 
  tableSchema, 
  restaurantSchema,
  validateData 
} from '../validations'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123'
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject short username', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123'
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('al menos 3 caracteres')
    })

    it('should reject short password', () => {
      const invalidData = {
        username: 'testuser',
        password: '12345'
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('al menos 6 caracteres')
    })

    it('should reject missing fields', () => {
      const invalidData = {
        username: 'testuser'
        // Missing password
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('reservationSchema', () => {
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

    it('should validate correct reservation data', () => {
      const result = reservationSchema.safeParse(validReservationData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone number', () => {
      const invalidData = {
        ...validReservationData,
        clientPhone: 'invalid-phone'
      }

      const result = reservationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Teléfono inválido')
    })

    it('should reject invalid date format', () => {
      const invalidData = {
        ...validReservationData,
        date: '15-01-2024'
      }

      const result = reservationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('YYYY-MM-DD')
    })

    it('should reject invalid time format', () => {
      const invalidData = {
        ...validReservationData,
        time: '7pm'
      }

      const result = reservationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('HH:MM')
    })

    it('should reject invalid people count', () => {
      const invalidData = {
        ...validReservationData,
        people: 0
      }

      const result = reservationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Mínimo 1 persona')
    })

    it('should reject too many people', () => {
      const invalidData = {
        ...validReservationData,
        people: 25
      }

      const result = reservationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Máximo 20 personas')
    })

    it('should reject too long notes', () => {
      const invalidData = {
        ...validReservationData,
        notes: 'a'.repeat(501)
      }

      const result = reservationSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('500 caracteres')
    })

    it('should accept optional fields', () => {
      const minimalData = {
        restaurantId: 'rest_123',
        clientName: 'Juan Pérez',
        clientPhone: '+1234567890',
        date: '2024-01-15',
        time: '19:00',
        people: 4
      }

      const result = reservationSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })

  describe('tableSchema', () => {
    const validTableData = {
      id: 'table_1',
      name: 'Mesa 1',
      capacity: 4,
      location: 'Terraza',
      status: 'libre' as const
    }

    it('should validate correct table data', () => {
      const result = tableSchema.safeParse(validTableData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid capacity', () => {
      const invalidData = {
        ...validTableData,
        capacity: 0
      }

      const result = tableSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Capacidad mínima de 1')
    })

    it('should reject invalid status', () => {
      const invalidData = {
        ...validTableData,
        status: 'invalid-status'
      }

      const result = tableSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept all valid statuses', () => {
      const statuses = ['libre', 'ocupada', 'reservada']
      
      statuses.forEach(status => {
        const data = {
          ...validTableData,
          status: status as any
        }
        
        const result = tableSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('restaurantSchema', () => {
    const validRestaurantData = {
      name: 'El Buen Sabor',
      email: 'info@elbuensabor.com',
      phone: '+1234567890',
      address: 'Calle Principal 123, Ciudad, País',
      type: 'restaurante' as const,
      capacity: 50,
      openingHours: {
        monday: { open: '09:00', close: '22:00' },
        tuesday: { open: '09:00', close: '22:00' }
      }
    }

    it('should validate correct restaurant data', () => {
      const result = restaurantSchema.safeParse(validRestaurantData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        ...validRestaurantData,
        email: 'invalid-email'
      }

      const result = restaurantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Email inválido')
    })

    it('should reject short address', () => {
      const invalidData = {
        ...validRestaurantData,
        address: 'Short'
      }

      const result = restaurantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Dirección completa requerida')
    })

    it('should reject invalid type', () => {
      const invalidData = {
        ...validRestaurantData,
        type: 'invalid-type'
      }

      const result = restaurantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject low capacity', () => {
      const invalidData = {
        ...validRestaurantData,
        capacity: 5
      }

      const result = restaurantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toContain('Capacidad mínima de 10')
    })
  })

  describe('validateData helper', () => {
    it('should return validated data for valid input', () => {
      const validData = {
        username: 'testuser',
        password: 'password123'
      }

      const result = validateData(loginSchema, validData)
      expect(result).toEqual(validData)
    })

    it('should throw error for invalid input', () => {
      const invalidData = {
        username: 'ab',
        password: '123'
      }

      expect(() => validateData(loginSchema, invalidData)).toThrow('Validation error')
    })

    it('should include validation details in error message', () => {
      const invalidData = {
        username: 'ab',
        password: '123'
      }

      try {
        validateData(loginSchema, invalidData)
      } catch (error) {
        expect((error as Error).message).toContain('al menos 3 caracteres')
        expect((error as Error).message).toContain('al menos 6 caracteres')
      }
    })
  })
})
