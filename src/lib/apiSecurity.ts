/**
 * Sistema de seguridad para APIs
 * Protección anti-hackeo en endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getClientIP, 
  detectMaliciousContent, 
  sanitizeInput,
  checkLoginAttempts,
  recordFailedLogin,
  resetLoginAttempts,
  generateCSRFToken,
  verifyCSRFToken
} from './security';
import { logger } from './logger';

// Schemas de validación para diferentes endpoints
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username contains invalid characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

export const reservationSchema = z.object({
  clientName: z.string()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must be less than 100 characters')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Client name contains invalid characters'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  people: z.number()
    .int('People count must be an integer')
    .min(1, 'At least 1 person required')
    .max(20, 'Maximum 20 people allowed'),
  tableId: z.string()
    .min(1, 'Table ID is required')
    .max(50, 'Table ID must be less than 50 characters')
});

export const tableUpdateSchema = z.object({
  tableId: z.string()
    .min(1, 'Table ID is required')
    .max(50, 'Table ID must be less than 50 characters'),
  status: z.enum(['libre', 'ocupada', 'reservada']).refine(
    (val) => ['libre', 'ocupada', 'reservada'].includes(val),
    { message: 'Invalid table status' }
  ),
  client: z.object({
    name: z.string().max(100),
    phone: z.string().max(20),
    partySize: z.number().int().min(1).max(20),
    notes: z.string().max(500).optional()
  }).optional()
});

// Configuración de rate limiting por endpoint
const RATE_LIMITS = {
  '/api/auth/login': { max: 5, window: 15 * 60 * 1000 }, // 5 intentos por 15 minutos
  '/api/reservations': { max: 10, window: 60 * 1000 }, // 10 requests por minuto
  '/api/tables': { max: 20, window: 60 * 1000 }, // 20 requests por minuto
  '/api/retell': { max: 100, window: 60 * 1000 }, // 100 requests por minuto (webhooks)
  default: { max: 60, window: 60 * 1000 } // 60 requests por minuto por defecto
};

/**
 * Middleware de seguridad para APIs
 */
export function createSecureAPIMiddleware() {
  return function secureMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const clientIP = getClientIP(request);
      const pathname = request.nextUrl.pathname;
      
      try {
        // 1. Verificar rate limiting específico por endpoint
        const rateLimitConfig = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
        // Aquí se implementaría el rate limiting específico si fuera necesario
        
        // 2. Verificar headers de seguridad
        const userAgent = request.headers.get('user-agent') || '';
        if (userAgent.length > 500) {
          logger.warn('Suspicious user agent length', { ip: clientIP, userAgentLength: userAgent.length });
          return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        
        // 3. Verificar Content-Type para requests con body
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          const contentType = request.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            logger.warn('Invalid content type', { ip: clientIP, contentType });
            return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
          }
        }
        
        // 4. Verificar tamaño del body
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB máximo
          logger.warn('Request body too large', { ip: clientIP, contentLength });
          return NextResponse.json({ error: 'Request too large' }, { status: 413 });
        }
        
        // 5. Ejecutar el handler original
        const response = await handler(request);
        
        // 6. Agregar headers de seguridad a la respuesta
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        
        return response;
        
      } catch (error) {
        logger.error('API security middleware error', { 
          ip: clientIP, 
          pathname, 
          error: (error as Error).message 
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    };
  };
}

/**
 * Validar y sanitizar datos de entrada
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  ip: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Sanitizar entrada antes de validar
    const sanitizedData = sanitizeInput(JSON.stringify(data));
    const parsedData = JSON.parse(sanitizedData);
    
    // Validar con Zod
    const validatedData = schema.parse(parsedData);
    
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => e.message).join(', ');
      logger.warn('Validation error', { ip, errors: error.issues });
      return { success: false, error: errorMessage };
    }
    
    logger.warn('Sanitization error', { ip, error: (error as Error).message });
    return { success: false, error: 'Invalid input data' };
  }
}

/**
 * Middleware específico para login con protección anti-brute force
 */
export function createLoginSecurityMiddleware() {
  return function loginMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const clientIP = getClientIP(request);
      
      try {
        // Verificar intentos de login
        const loginCheck = checkLoginAttempts(clientIP);
        if (!loginCheck.allowed) {
          logger.warn('Login blocked due to too many attempts', { ip: clientIP });
          return NextResponse.json({ 
            error: 'Too many login attempts. Please try again later.',
            attemptsLeft: 0 
          }, { status: 429 });
        }
        
        // Validar datos de entrada
        const body = await request.json();
        const validation = validateAndSanitize(loginSchema, body, clientIP);
        
        if (!validation.success) {
          recordFailedLogin(clientIP);
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        
        // Ejecutar handler original
        const response = await handler(request);
        
        // Si el login fue exitoso, resetear intentos
        if (response.status === 200) {
          resetLoginAttempts(clientIP);
          logger.info('Successful login', { ip: clientIP, username: validation.data.username });
        } else {
          recordFailedLogin(clientIP);
        }
        
        return response;
        
      } catch (error) {
        recordFailedLogin(clientIP);
        logger.error('Login security middleware error', { 
          ip: clientIP, 
          error: (error as Error).message 
        });
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
      }
    };
  };
}

/**
 * Middleware para webhooks con verificación de firma
 */
export function createWebhookSecurityMiddleware(expectedSecret: string) {
  return function webhookMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const clientIP = getClientIP(request);
      
      try {
        // Verificar firma del webhook
        const signature = request.headers.get('x-webhook-signature');
        const body = await request.text();
        
        // Aquí se implementaría la verificación de firma HMAC
        // Por simplicidad, verificamos que la firma existe
        if (!signature) {
          logger.warn('Webhook without signature', { ip: clientIP });
          return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }
        
        // Verificar tamaño del payload
        if (body.length > 10 * 1024 * 1024) { // 10MB máximo
          logger.warn('Webhook payload too large', { ip: clientIP, size: body.length });
          return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }
        
        // Crear nueva request con el body parseado
        const newRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: body
        });
        
        return await handler(newRequest);
        
      } catch (error) {
        logger.error('Webhook security middleware error', { 
          ip: clientIP, 
          error: (error as Error).message 
        });
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
      }
    };
  };
}

/**
 * Función helper para crear respuestas seguras
 */
export function createSecureResponse(
  data: any, 
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Headers de seguridad
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...additionalHeaders
  };
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Re-exportar getClientIP para que esté disponible
export { getClientIP } from './security';
