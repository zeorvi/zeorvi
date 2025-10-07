import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

class RestaurantRateLimiter {
  private stores: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();
  private defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100, // 100 requests por ventana
  };

  // Configuraciones específicas por tipo de endpoint
  private endpointConfigs: Map<string, RateLimitConfig> = new Map([
    ['/api/retell/webhook', {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 1000, // 1000 requests por minuto
    }],
    ['/api/retell/functions', {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 500, // 500 requests por minuto
    }],
    ['/api/restaurants', {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 200, // 200 requests por 15 minutos
    }],
    ['/api/admin', {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 50, // 50 requests por 15 minutos
    }],
  ]);

  // Configuraciones por plan de restaurante
  private planConfigs: Map<string, RateLimitConfig> = new Map([
    ['basic', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    }],
    ['premium', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 500,
    }],
    ['enterprise', {
      windowMs: 15 * 60 * 1000,
      maxRequests: 2000,
    }],
  ]);

  public checkLimit(
    restaurantId: string,
    endpoint: string,
    plan: string = 'basic',
    customKey?: string
  ): RateLimitResult {
    const key = customKey || this.generateKey(restaurantId, endpoint);
    const config = this.getConfig(endpoint, plan);
    
    const now = Date.now();
    const resetTime = now + config.windowMs;
    
    // Inicializar store si no existe
    if (!this.stores.has(endpoint)) {
      this.stores.set(endpoint, new Map());
    }
    
    const store = this.stores.get(endpoint)!;
    const current = store.get(key);
    
    // Si no existe o ya expiró, crear nuevo registro
    if (!current || now > current.resetTime) {
      store.set(key, { count: 1, resetTime });
      this.cleanup();
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
        totalRequests: 1,
      };
    }
    
    // Verificar si excede el límite
    if (current.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        totalRequests: current.count,
      };
    }
    
    // Incrementar contador
    current.count++;
    store.set(key, current);
    
    return {
      allowed: true,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime,
      totalRequests: current.count,
    };
  }

  private generateKey(restaurantId: string, endpoint: string): string {
    return `${restaurantId}:${endpoint}`;
  }

  private getConfig(endpoint: string, plan: string): RateLimitConfig {
    // Prioridad: endpoint específico > plan > default
    return this.endpointConfigs.get(endpoint) || 
           this.planConfigs.get(plan) || 
           this.defaultConfig;
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Limpiar entradas expiradas cada 100 requests
    if (Math.random() < 0.01) {
      for (const [endpoint, store] of this.stores) {
        for (const [key, data] of store) {
          if (now > data.resetTime) {
            store.delete(key);
          }
        }
        
        // Eliminar stores vacíos
        if (store.size === 0) {
          this.stores.delete(endpoint);
        }
      }
    }
  }

  // Métodos para monitoreo y administración
  public getStats(): {
    totalStores: number;
    totalKeys: number;
    endpoints: string[];
    memoryUsage: number;
  } {
    let totalKeys = 0;
    const endpoints: string[] = [];
    
    for (const [endpoint, store] of this.stores) {
      endpoints.push(endpoint);
      totalKeys += store.size;
    }
    
    return {
      totalStores: this.stores.size,
      totalKeys,
      endpoints,
      memoryUsage: JSON.stringify(this.stores).length,
    };
  }

  public clearRestaurant(restaurantId: string): void {
    for (const [endpoint, store] of this.stores) {
      for (const key of store.keys()) {
        if (key.startsWith(`${restaurantId}:`)) {
          store.delete(key);
        }
      }
    }
    
    logger.info('Rate limit cleared for restaurant', { restaurantId });
  }

  public clearEndpoint(endpoint: string): void {
    this.stores.delete(endpoint);
    logger.info('Rate limit cleared for endpoint', { endpoint });
  }

  public clearAll(): void {
    this.stores.clear();
    logger.info('All rate limits cleared');
  }

  // Método para obtener información de un restaurante específico
  public getRestaurantInfo(restaurantId: string): {
    totalRequests: number;
    endpoints: { endpoint: string; requests: number; resetTime: number }[];
  } {
    const endpoints: { endpoint: string; requests: number; resetTime: number }[] = [];
    let totalRequests = 0;
    
    for (const [endpoint, store] of this.stores) {
      for (const [key, data] of store) {
        if (key.startsWith(`${restaurantId}:`)) {
          endpoints.push({
            endpoint,
            requests: data.count,
            resetTime: data.resetTime,
          });
          totalRequests += data.count;
        }
      }
    }
    
    return {
      totalRequests,
      endpoints,
    };
  }

  // Método para ajustar límites dinámicamente
  public updateEndpointConfig(endpoint: string, config: RateLimitConfig): void {
    this.endpointConfigs.set(endpoint, config);
    logger.info('Rate limit config updated', { endpoint, config });
  }

  public updatePlanConfig(plan: string, config: RateLimitConfig): void {
    this.planConfigs.set(plan, config);
    logger.info('Plan rate limit config updated', { plan, config });
  }

  // Método para verificar si un restaurante está siendo limitado
  public isRestaurantLimited(restaurantId: string): boolean {
    for (const [endpoint, store] of this.stores) {
      for (const [key, data] of store) {
        if (key.startsWith(`${restaurantId}:`) && data.count > 0) {
          const config = this.getConfig(endpoint, 'basic');
          if (data.count >= config.maxRequests) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

// Singleton instance
export const restaurantRateLimiter = new RestaurantRateLimiter();
export default restaurantRateLimiter;
