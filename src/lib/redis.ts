import Redis from 'ioredis'
import { logger } from './logger'

// Configuración de Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}

// Cliente Redis principal
let redis: Redis | null = null

// Inicializar conexión Redis
export const initRedis = async (): Promise<Redis | null> => {
  if (redis) {
    return redis
  }

  try {
    redis = new Redis(redisConfig)

    redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    redis.on('error', (error) => {
      logger.error('Redis connection error', { error })
    })

    redis.on('close', () => {
      logger.warn('Redis connection closed')
    })

    redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...')
    })

    // Probar la conexión
    await redis.ping()
    logger.info('Redis ping successful')

    return redis
  } catch (error) {
    logger.error('Failed to initialize Redis', { error })
    redis = null
    return null
  }
}

// Obtener cliente Redis
export const getRedis = async (): Promise<Redis | null> => {
  if (!redis) {
    return initRedis()
  }
  return redis
}

// Cerrar conexión Redis
export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit()
    redis = null
    logger.info('Redis connection closed')
  }
}

// Helper para ejecutar comandos Redis con fallback
export const safeRedisExecute = async <T>(
  operation: (redis: Redis) => Promise<T>,
  fallbackValue: T
): Promise<T> => {
  try {
    const redisClient = await getRedis()
    if (!redisClient) {
      logger.warn('Redis not available, using fallback value')
      return fallbackValue
    }
    
    return await operation(redisClient)
  } catch (error) {
    logger.error('Redis operation failed, using fallback', { error })
    return fallbackValue
  }
}

export default redis
