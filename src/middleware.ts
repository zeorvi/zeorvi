import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Subgrupos y sus rutas protegidas - ESTRUCTURA MODULAR
  const subGroups = {
    // SECCIÓN RESTAURANTES (PROTEGIDA - NO TOCAR)
    restaurants: ['/admin', '/restaurant', '/restaurants'],
    
    // NUEVAS SECCIONES (AISLADAS)
    ai_automation: ['/ai-automation'],
    business: ['/business'],
    platform: ['/platform'],
    
    // APIs (SEPARADAS POR SECCIÓN)
    api_restaurants: ['/api/restaurants', '/api/retell', '/api/twilio'],
    api_ai: ['/api/ai'],
    api_platform: ['/api/platform']
  };

  // Verificar si la ruta pertenece a un subgrupo
  const getSubGroup = (pathname: string) => {
    for (const [group, routes] of Object.entries(subGroups)) {
      if (routes.some(route => pathname.startsWith(route))) {
        return group;
      }
    }
    return null;
  };
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || (pathname === '/' && request.method === 'GET')
  );
  
  if (isPublicRoute) {
    // Aplicar headers de seguridad básicos
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // Para desarrollo, permitir acceso sin autenticación
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  // En producción, verificar autenticación básica
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirigir al login
      const redirectUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      return response;
    }

    // Continuar con la request (con headers de seguridad)
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;

  } catch (error) {
    // Error en verificación, redirigir al login
    const redirectUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('auth-token');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
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