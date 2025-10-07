import { NextRequest, NextResponse } from 'next/server';
import { restaurantRateLimiter } from '@/lib/rateLimiting/restaurantRateLimiter';
import { logger } from '@/lib/logger';

export interface RateLimitOptions {
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: NextRequest, result: any) => void;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    restaurantId?: string,
    plan?: string
  ): Promise<NextResponse | null> {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname;
      
      // Extraer restaurantId del path si no se proporciona
      if (!restaurantId) {
        const pathParts = endpoint.split('/');
        const restaurantIndex = pathParts.findIndex(part => part === 'restaurant' || part === 'restaurants');
        if (restaurantIndex !== -1 && pathParts[restaurantIndex + 1]) {
          restaurantId = pathParts[restaurantIndex + 1];
        }
      }
      
      // Si no hay restaurantId, usar IP como fallback
      const key = restaurantId || getClientIP(request);
      
      // Verificar límite
      const result = restaurantRateLimiter.checkLimit(
        key,
        endpoint,
        plan || 'basic'
      );
      
      // Configurar headers
      const headers = new Headers();
      
      if (options.standardHeaders) {
        headers.set('RateLimit-Limit', result.totalRequests.toString());
        headers.set('RateLimit-Remaining', result.remaining.toString());
        headers.set('RateLimit-Reset', new Date(result.resetTime).toISOString());
      }
      
      if (options.legacyHeaders) {
        headers.set('X-RateLimit-Limit', result.totalRequests.toString());
        headers.set('X-RateLimit-Remaining', result.remaining.toString());
        headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      }
      
      // Si se excede el límite
      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          restaurantId: key,
          endpoint,
          plan,
          totalRequests: result.totalRequests,
          resetTime: new Date(result.resetTime).toISOString(),
        });
        
        if (options.onLimitReached) {
          options.onLimitReached(request, result);
        }
        
        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
          { status: 429, headers }
        );
        
        response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
        
        return response;
      }
      
      // Agregar headers a la respuesta exitosa
      if (options.standardHeaders || options.legacyHeaders) {
        // Esto se manejará en el response interceptor
        (request as any).__rateLimitHeaders = headers;
      }
      
      return null; // Continuar con la request
      
    } catch (error) {
      logger.error('Rate limiting middleware error', error);
      // En caso de error, permitir la request
      return null;
    }
  };
}

// Función helper para obtener IP del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // NextRequest doesn't have an ip property, so we return unknown as fallback
  return 'unknown';
}

// Middleware específico para diferentes tipos de endpoints
export const webhookRateLimit = createRateLimitMiddleware({
  standardHeaders: true,
  onLimitReached: (req, result) => {
    logger.error('Webhook rate limit exceeded', {
      url: req.url,
      result,
    });
  },
});

export const apiRateLimit = createRateLimitMiddleware({
  standardHeaders: true,
  legacyHeaders: true,
  onLimitReached: (req, result) => {
    logger.warn('API rate limit exceeded', {
      url: req.url,
      result,
    });
  },
});

export const adminRateLimit = createRateLimitMiddleware({
  standardHeaders: true,
  onLimitReached: (req, result) => {
    logger.error('Admin API rate limit exceeded', {
      url: req.url,
      result,
    });
  },
});

// Función para aplicar rate limiting en cualquier API route
export async function applyRateLimit(
  request: NextRequest,
  restaurantId?: string,
  plan?: string,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const middleware = createRateLimitMiddleware(options);
  return await middleware(request, restaurantId, plan);
}

// Función para obtener estadísticas de rate limiting
export function getRateLimitStats(restaurantId?: string) {
  if (restaurantId) {
    return restaurantRateLimiter.getRestaurantInfo(restaurantId);
  }
  return restaurantRateLimiter.getStats();
}

// Función para limpiar rate limits de un restaurante específico
export function clearRestaurantRateLimit(restaurantId: string) {
  restaurantRateLimiter.clearRestaurant(restaurantId);
}

// Función para verificar si un restaurante está limitado
export function isRestaurantRateLimited(restaurantId: string): boolean {
  return restaurantRateLimiter.isRestaurantLimited(restaurantId);
}

// Exportar el rate limiter para uso directo
export { restaurantRateLimiter };
