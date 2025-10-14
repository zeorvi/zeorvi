/**
 * Sistema de caché en memoria para Google Sheets con TTL (Time To Live)
 * Reduce llamadas a la API y mejora el rendimiento del dashboard
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class GoogleSheetsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  
  // TTL por defecto: 30 segundos
  private readonly DEFAULT_TTL = 30000;
  
  // TTL para diferentes tipos de datos
  private readonly TTL_CONFIG = {
    reservas: 30000,      // 30 segundos - se actualizan frecuentemente
    horarios: 300000,     // 5 minutos - cambian poco
    mesas: 60000,         // 1 minuto - estado cambiante
    disponibilidad: 20000 // 20 segundos - crítico para reservas
  };

  /**
   * Obtener datos del caché o ejecutar la función de fetch
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    type: keyof typeof this.TTL_CONFIG = 'reservas'
  ): Promise<T> {
    const now = Date.now();
    const ttl = this.TTL_CONFIG[type];

    // 1. Verificar si hay una request pendiente para la misma clave
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`🔄 [Cache] Deduplicando request para: ${key}`);
      return pending.promise;
    }

    // 2. Verificar caché
    const cached = this.cache.get(key);
    if (cached && (now - cached.timestamp) < cached.ttl) {
      console.log(`✅ [Cache] HIT para: ${key} (edad: ${Math.round((now - cached.timestamp) / 1000)}s)`);
      return cached.data;
    }

    // 3. Cache miss - hacer fetch
    console.log(`❌ [Cache] MISS para: ${key} - Fetching...`);
    
    const fetchPromise = fetchFn()
      .then(data => {
        // Guardar en caché
        this.cache.set(key, {
          data,
          timestamp: now,
          ttl
        });
        
        // Limpiar request pendiente
        this.pendingRequests.delete(key);
        
        console.log(`💾 [Cache] Guardado: ${key} (TTL: ${ttl / 1000}s)`);
        return data;
      })
      .catch(error => {
        // Limpiar request pendiente en caso de error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Guardar como request pendiente para deduplicación
    this.pendingRequests.set(key, {
      promise: fetchPromise,
      timestamp: now
    });

    return fetchPromise;
  }

  /**
   * Invalidar caché para una clave específica
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
    console.log(`🗑️ [Cache] Invalidado: ${key}`);
  }

  /**
   * Invalidar caché por patrón (ej: 'rest_001:*')
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
        count++;
      }
    }
    
    console.log(`🗑️ [Cache] Invalidados ${count} items con patrón: ${pattern}`);
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    // Limpiar requests pendientes antiguos (más de 30 segundos)
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 [Cache] Limpiados ${cleaned} items expirados`);
    }
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log(`🗑️ [Cache] Caché completamente limpiado`);
  }
}

// Instancia singleton
export const googleSheetsCache = new GoogleSheetsCache();

// Limpiar caché expirado cada 2 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    googleSheetsCache.cleanup();
  }, 120000);
}

