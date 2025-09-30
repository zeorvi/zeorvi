/**
 * Sistema de Cache en Memoria
 * Reemplaza Redis para desarrollo
 */

interface CacheItem {
  value: any;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  private static instance: MemoryCache;

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    const hashKey = `${key}:${field}`;
    await this.set(hashKey, value, 3600);
  }

  async hget(key: string, field: string): Promise<any | null> {
    const hashKey = `${key}:${field}`;
    return await this.get(hashKey);
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    const prefix = `${key}:`;
    
    for (const [cacheKey, item] of this.cache.entries()) {
      if (cacheKey.startsWith(prefix)) {
        const field = cacheKey.substring(prefix.length);
        if (Date.now() <= item.expiresAt) {
          result[field] = item.value;
        } else {
          this.cache.delete(cacheKey);
        }
      }
    }
    
    return result;
  }

  async setex(key: string, ttlSeconds: number, value: any): Promise<void> {
    await this.set(key, value, ttlSeconds);
  }

  // Limpiar cache expirado
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Limpiar todo el cache
  clear(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const memoryCache = MemoryCache.getInstance();

// Limpiar cache expirado cada 5 minutos
setInterval(() => {
  memoryCache.cleanup();
}, 5 * 60 * 1000);

export default memoryCache;
