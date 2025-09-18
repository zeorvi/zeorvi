import React from 'react'
import { logger } from './logger'

// Configuración de performance monitoring
export interface PerformanceConfig {
  enableMetrics: boolean
  enableWebVitals: boolean
  sampleRate: number // 0-1, porcentaje de requests a medir
}

const defaultConfig: PerformanceConfig = {
  enableMetrics: process.env.NODE_ENV === 'production',
  enableWebVitals: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
}

// Métricas de performance
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

// Cache en memoria para métricas
const metricsCache = new Map<string, PerformanceMetric[]>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const MAX_METRICS_PER_KEY = 100

// Clase para medir performance
export class PerformanceTracker {
  private startTime: number
  private name: string
  private labels: Record<string, string>

  constructor(name: string, labels: Record<string, string> = {}) {
    this.name = name
    this.labels = labels
    this.startTime = performance.now()
  }

  // Finalizar medición
  end(additionalLabels: Record<string, string> = {}): number {
    const duration = performance.now() - this.startTime
    
    // Combinar labels
    const allLabels = { ...this.labels, ...additionalLabels }
    
    // Registrar métrica
    recordMetric({
      name: this.name,
      value: duration,
      timestamp: Date.now(),
      labels: allLabels
    })

    return duration
  }
}

// Registrar métrica de performance
export const recordMetric = (metric: PerformanceMetric): void => {
  if (!defaultConfig.enableMetrics) return
  
  // Sampling
  if (Math.random() > defaultConfig.sampleRate) return

  const key = `${metric.name}:${JSON.stringify(metric.labels || {})}`
  
  // Obtener métricas existentes
  let metrics = metricsCache.get(key) || []
  
  // Limpiar métricas antiguas
  const now = Date.now()
  metrics = metrics.filter(m => now - m.timestamp < CACHE_TTL)
  
  // Añadir nueva métrica
  metrics.push(metric)
  
  // Limitar tamaño del cache
  if (metrics.length > MAX_METRICS_PER_KEY) {
    metrics = metrics.slice(-MAX_METRICS_PER_KEY)
  }
  
  metricsCache.set(key, metrics)
  
  // Log para análisis
  logger.info('Performance metric recorded', {
    name: metric.name,
    value: metric.value,
    labels: metric.labels
  })
}

// Crear tracker de performance
export const createPerformanceTracker = (
  name: string, 
  labels: Record<string, string> = {}
): PerformanceTracker => {
  return new PerformanceTracker(name, labels)
}

// Decorador para medir funciones async
export const measureAsync = <T extends any[], R>(
  name: string,
  labels: Record<string, string> = {}
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T): Promise<R> {
      const tracker = createPerformanceTracker(name, {
        ...labels,
        method: propertyKey,
        class: target.constructor.name
      })

      try {
        const result = await originalMethod.apply(this, args)
        tracker.end({ status: 'success' })
        return result
      } catch (error) {
        tracker.end({ status: 'error' })
        throw error
      }
    }

    return descriptor
  }
}

// Helper para medir operaciones de base de datos
export const measureDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationType: string,
  tableName?: string
): Promise<T> => {
  const tracker = createPerformanceTracker('database_operation', {
    operation: operationType,
    ...(tableName && { table: tableName })
  })

  try {
    const result = await operation()
    tracker.end({ status: 'success' })
    return result
  } catch (error) {
    tracker.end({ status: 'error' })
    throw error
  }
}

// Helper para medir llamadas a APIs externas
export const measureExternalAPI = async <T>(
  operation: () => Promise<T>,
  serviceName: string,
  endpoint?: string
): Promise<T> => {
  const tracker = createPerformanceTracker('external_api', {
    service: serviceName,
    ...(endpoint && { endpoint })
  })

  try {
    const result = await operation()
    tracker.end({ status: 'success' })
    return result
  } catch (error) {
    tracker.end({ status: 'error' })
    throw error
  }
}

// Obtener métricas agregadas
export const getAggregatedMetrics = (
  metricName: string,
  timeRange: number = CACHE_TTL
): {
  count: number
  avg: number
  min: number
  max: number
  p95: number
  p99: number
} => {
  const now = Date.now()
  const cutoff = now - timeRange
  
  // Obtener todas las métricas que coincidan
  const allMetrics: PerformanceMetric[] = []
  
  for (const [key, metrics] of metricsCache.entries()) {
    if (key.startsWith(metricName + ':')) {
      const recentMetrics = metrics.filter(m => m.timestamp > cutoff)
      allMetrics.push(...recentMetrics)
    }
  }
  
  if (allMetrics.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 }
  }
  
  const values = allMetrics.map(m => m.value).sort((a, b) => a - b)
  const count = values.length
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / count
  const min = values[0]
  const max = values[count - 1]
  const p95 = values[Math.floor(count * 0.95)]
  const p99 = values[Math.floor(count * 0.99)]
  
  return { count, avg, min, max, p95, p99 }
}

// Middleware para medir performance de APIs
export const withPerformanceTracking = (
  handler: Function,
  name?: string
) => {
  return async (request: any, ...args: any[]) => {
    const tracker = createPerformanceTracker(
      name || 'api_request',
      {
        method: request.method,
        path: new URL(request.url).pathname
      }
    )

    try {
      const response = await handler(request, ...args)
      tracker.end({ 
        status: response.status?.toString() || 'unknown'
      })
      return response
    } catch (error) {
      tracker.end({ status: 'error' })
      throw error
    }
  }
}

// Optimizaciones de bundle y código
export const preloadResource = (href: string, as: 'script' | 'style' | 'font' | 'image') => {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (as === 'font') {
      link.crossOrigin = 'anonymous'
    }
    document.head.appendChild(link)
  }
}

// Lazy loading para componentes pesados
export const createLazyComponent = <T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn)
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : null}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Debounce para optimizar eventos frecuentes
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): T => {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }) as T
}

// Throttle para limitar frecuencia de ejecución
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T => {
  let inThrottle = false
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

// Memoización para funciones costosas
export const memoize = <T extends (...args: unknown[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = func(...args)
    cache.set(key, result)
    
    return result
  }) as T
}

// Limpiar cache de métricas
export const clearMetricsCache = (): void => {
  metricsCache.clear()
  logger.info('Performance metrics cache cleared')
}

// Obtener estadísticas del cache
export const getCacheStats = () => {
  const totalKeys = metricsCache.size
  let totalMetrics = 0
  
  for (const metrics of metricsCache.values()) {
    totalMetrics += metrics.length
  }
  
  return {
    totalKeys,
    totalMetrics,
    memoryUsage: process.memoryUsage()
  }
}

// Importar React para lazy loading
import React from 'react'

export default {
  createPerformanceTracker,
  measureAsync,
  measureDatabaseOperation,
  measureExternalAPI,
  getAggregatedMetrics,
  withPerformanceTracking,
  preloadResource,
  createLazyComponent,
  debounce,
  throttle,
  memoize,
  clearMetricsCache,
  getCacheStats
}
