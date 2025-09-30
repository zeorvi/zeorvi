/**
 * Sistema de cache inteligente para optimizar rendimiento
 * Sin cambiar nada visual, solo mejoras técnicas internas
 */

import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Máximo 100 items en cache

  /**
   * Obtener datos del cache si están válidos
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Guardar datos en el cache
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Limpiar cache expirado
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Si aún está lleno, eliminar los más antiguos
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.maxSize / 2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Limpiar cache específico
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // Se puede implementar si se necesita
    };
  }
}

// Instancia global del cache
export const cache = new SmartCache();

/**
 * Hook para usar cache con React
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Intentar obtener del cache primero
    const cachedData = cache.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Cache para datos de restaurante (TTL más largo)
 */
export const restaurantCache = {
  get: <T>(key: string) => cache.get<T>(`restaurant:${key}`),
  set: <T>(key: string, data: T, ttl: number = 10 * 60 * 1000) => 
    cache.set(`restaurant:${key}`, data, ttl),
  clear: (key?: string) => cache.clear(key ? `restaurant:${key}` : undefined)
};

/**
 * Cache para datos de reservas (TTL más corto)
 */
export const reservationCache = {
  get: <T>(key: string) => cache.get<T>(`reservation:${key}`),
  set: <T>(key: string, data: T, ttl: number = 2 * 60 * 1000) => 
    cache.set(`reservation:${key}`, data, ttl),
  clear: (key?: string) => cache.clear(key ? `reservation:${key}` : undefined)
};

/**
 * Cache para datos de mesas (TTL muy corto para datos en tiempo real)
 */
export const tableCache = {
  get: <T>(key: string) => cache.get<T>(`table:${key}`),
  set: <T>(key: string, data: T, ttl: number = 30 * 1000) => 
    cache.set(`table:${key}`, data, ttl),
  clear: (key?: string) => cache.clear(key ? `table:${key}` : undefined)
};
