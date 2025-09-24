import { NextRequest } from 'next/server'
import { logger } from './logger'

// Configuraciones de rate limiting
export interface RateLimitConfig {
  windowMs: number // Ventana de tiempo en milisegundos
  maxRequests: number // Máximo número de requests por ventana
  keyGenerator?: (request: NextRequest) => string // Función para generar la clave
  skipSuccessfulRequests?: boolean // No contar requests exitosos
  skipFailedRequests?: boolean // No contar requests fallidos
  message?: string // Mensaje de error personalizado
}

// Configuraciones predefinidas
export const rateLimitConfigs = {
  // API general - 100 requests por 15 minutos
  api: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many API requests, please try again later'
  },
  
  // Webhooks - 200 requests por minuto (más permisivo para servicios externos)
  webhook: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Webhook rate limit exceeded'
  },
  
  // Autenticación - 5 intentos por 15 minutos
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later'
  },
  
  // Reservas - 10 por minuto
  reservations: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many reservation requests, please try again later'
  },
  
  // Búsquedas - 50 por minuto
  search: {
    windowMs: 60 * 1000,
    maxRequests: 50,
    message: 'Too many search requests, please try again later'
  }
}

// Generadores de claves
export const keyGenerators = {
  // Por IP
  byIP: (request: NextRequest): string => {
    const ip = (request as any).ip || 
              request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown'
    return `rate_limit:ip:${ip}`
  },
  
  // Por usuario autenticado
  byUser: (request: NextRequest): string => {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    return `rate_limit:user:${userId}`
  },
  
  // Por API key
  byApiKey: (request: NextRequest): string => {
    const apiKey = request.headers.get('x-api-key') || 'no-key'
    return `rate_limit:api_key:${apiKey}`
  },
  
  // Combinado IP + User
  byIPAndUser: (request: NextRequest): string => {
    const ip = (request as any).ip || 
              request.headers.get('x-forwarded-for')?.split(',')[0] || 
              'unknown'
    const userId = request.headers.get('x-user-id') || 'anonymous'
    return `rate_limit:ip_user:${ip}:${userId}`
  },
  
  // Por endpoint específico
  byEndpoint: (endpoint: string) => (request: NextRequest): string => {
    const ip = (request as any).ip || 
              request.headers.get('x-forwarded-for')?.split(',')[0] || 
              'unknown'
    return `rate_limit:endpoint:${endpoint}:${ip}`
  }
}

// Clase principal del rate limiter
export class RateLimiter {
  private config: Required<RateLimitConfig>

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: keyGenerators.byIP,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Rate limit exceeded',
      ...config
    }
  }

  // Verificar si una request está dentro del límite
  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    totalRequests: number
  }> {
    const key = this.config.keyGenerator(request)
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    try {
      // Por ahora, implementación simple sin Redis
      // En producción deberías usar Redis para persistencia
      logger.debug('Rate limit check', {
        key,
        maxRequests: this.config.maxRequests
      })

      // Simular rate limiting básico
      // En una implementación real, esto debería usar Redis
      return {
        allowed: true, // Temporalmente permitir todo
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalRequests: 0
      }
    } catch (error) {
      logger.error('Rate limit check failed', { error, key })
      
      // En caso de error, permitir la request para no bloquear el servicio
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalRequests: 0
      }
    }
  }

  // Middleware para Next.js
  middleware() {
    return async (request: NextRequest) => {
      const result = await this.checkLimit(request)
      
      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          key: this.config.keyGenerator(request),
          totalRequests: result.totalRequests,
          maxRequests: this.config.maxRequests,
          ip: (request as any).ip,
          userAgent: request.headers.get('user-agent')
        })
        
        throw new Error(this.config.message)
      }
      
      return result
    }
  }

  // Resetear límite para una clave específica
  async resetLimit(key: string): Promise<void> {
    logger.info('Rate limit reset', { key })
  }

  // Obtener información actual del límite
  async getLimitInfo(request: NextRequest): Promise<{
    totalRequests: number
    remaining: number
    resetTime: number
  }> {
    const key = this.config.keyGenerator(request)
    const now = Date.now()
    const resetTime = now + this.config.windowMs

    return {
      totalRequests: 0,
      remaining: this.config.maxRequests,
      resetTime
    }
  }
}

// Rate limiters predefinidos
export const rateLimiters = {
  api: new RateLimiter({
    ...rateLimitConfigs.api,
    keyGenerator: keyGenerators.byIPAndUser
  }),
  
  webhook: new RateLimiter({
    ...rateLimitConfigs.webhook,
    keyGenerator: keyGenerators.byIP
  }),
  
  auth: new RateLimiter({
    ...rateLimitConfigs.auth,
    keyGenerator: keyGenerators.byIP
  }),
  
  reservations: new RateLimiter({
    ...rateLimitConfigs.reservations,
    keyGenerator: keyGenerators.byUser
  }),
  
  search: new RateLimiter({
    ...rateLimitConfigs.search,
    keyGenerator: keyGenerators.byUser
  })
}

// Helper para aplicar rate limiting a handlers de API
export const withRateLimit = (
  limiter: RateLimiter,
  handler: (request: NextRequest, ...args: unknown[]) => Promise<Response>
) => {
  return async (request: NextRequest, ...args: unknown[]) => {
    const limitResult = await limiter.checkLimit(request)
    
    if (!limitResult.allowed) {
      throw new Error('Rate limit exceeded')
    }
    
    const response = await handler(request, ...args)
    
    // Añadir headers informativos
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', limitResult.resetTime.toString())
    
    return response
  }
}

// Crear rate limiter personalizado
export const createRateLimiter = (config: RateLimitConfig): RateLimiter => {
  return new RateLimiter(config)
}

export default RateLimiter