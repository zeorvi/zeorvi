import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  getClientIP, 
  isIPBlocked, 
  checkRateLimit, 
  isSuspiciousUserAgent, 
  detectMaliciousContent,
  applySecurityHeaders,
  sanitizeInput
} from '@/lib/security';
import { logger } from '@/lib/logger';
import { 
  logAttack, 
  logSuspiciousActivity, 
  logRateLimitExceeded, 
  logMaliciousContent,
  logInvalidAccess,
  securityMonitor
} from '@/lib/securityMonitor';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';

  // 🛡️ VERIFICACIONES DE SEGURIDAD ANTI-HACKEO

  // 1. Verificar IP bloqueada (con monitoreo)
  if (isIPBlocked(clientIP) || securityMonitor.isIPBlocked(clientIP)) {
    logAttack(clientIP, pathname, 'Blocked IP attempted access');
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 2. Verificar User Agent sospechoso (con monitoreo)
  if (isSuspiciousUserAgent(userAgent)) {
    logSuspiciousActivity(clientIP, pathname, 'Suspicious user agent detected', {
      userAgent: userAgent.substring(0, 100)
    });
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 3. Verificar rate limiting (con monitoreo)
  const rateLimitResult = checkRateLimit(clientIP, pathname);
  if (!rateLimitResult.allowed) {
    logRateLimitExceeded(clientIP, pathname, 60); // Asumiendo 60 requests
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      }
    });
  }

  // 4. Verificar contenido malicioso en query parameters (con monitoreo)
  const searchParams = request.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    const maliciousCheck = detectMaliciousContent(value);
    if (maliciousCheck.isMalicious) {
      logMaliciousContent(clientIP, pathname, maliciousCheck.pattern, value);
      return new NextResponse('Bad Request', { status: 400 });
    }
  }

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/login', 
    '/change-password',
    '/setup',
    '/demo',
    '/api/twilio/webhook',
    '/api/retell/webhook',
    '/_next',
    '/favicon.ico'
  ];
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || (pathname === '/' && request.method === 'GET')
  );
  
  if (isPublicRoute) {
    // Aplicar headers de seguridad y continuar
    const response = NextResponse.next();
    const securityHeaders = applySecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Para desarrollo, permitir acceso sin autenticación (con headers de seguridad)
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    const securityHeaders = applySecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // En producción, verificar autenticación
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirigir al login
      const redirectUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(redirectUrl);
      const securityHeaders = applySecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Continuar con la request (con headers de seguridad)
    const response = NextResponse.next();
    const securityHeaders = applySecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;

  } catch (error) {
    // Token inválido, redirigir al login
    logger.warn('Invalid token detected', { ip: clientIP, error: (error as Error).message });
    const redirectUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('auth-token');
    const securityHeaders = applySecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

