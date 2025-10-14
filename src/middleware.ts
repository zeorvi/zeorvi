import { NextRequest, NextResponse } from 'next/server';
import { dashboardProtectionMiddleware } from './lib/dashboardProtection';

// Middleware existente + protección del dashboard
export function middleware(request: NextRequest) {
  // Aplicar protección del dashboard primero
  const dashboardResponse = dashboardProtectionMiddleware(request);
  if (dashboardResponse) {
    return dashboardResponse;
  }

  // Middleware existente (mantener funcionalidad actual)
  const url = request.nextUrl;
  
  // Verificar si es una ruta de API
  if (url.pathname.startsWith('/api/')) {
    // Rate limiting básico para APIs
    const rateLimitKey = request.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100; // máximo 100 requests por ventana
    
    // Simulación de rate limiting (en producción usar Redis)
    const requestCount = getRequestCount(rateLimitKey, now, windowMs);
    
    if (requestCount > maxRequests) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }
    
    incrementRequestCount(rateLimitKey, now);
  }
  
  // Verificar autenticación para rutas protegidas
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Headers de seguridad
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Simulación de rate limiting (en producción usar Redis)
const requestCounts: { [key: string]: { count: number; windowStart: number } } = {};

function getRequestCount(key: string, now: number, windowMs: number): number {
  const data = requestCounts[key];
  
  if (!data || now - data.windowStart > windowMs) {
    return 0;
  }
  
  return data.count;
}

function incrementRequestCount(key: string, now: number): void {
  const data = requestCounts[key];
  const windowMs = 15 * 60 * 1000;
  
  if (!data || now - data.windowStart > windowMs) {
    requestCounts[key] = { count: 1, windowStart: now };
  } else {
    data.count++;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};