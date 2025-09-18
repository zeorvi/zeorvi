import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTToken, extractTokenFromRequest } from './lib/auth';
import { logger } from './lib/logger';

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
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === '/' && request.method === 'GET'
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Para rutas protegidas, verificar autenticación
  try {
    const token = extractTokenFromRequest(request) || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      logger.warn('No token provided for protected route', { 
        pathname, 
        userAgent: request.headers.get('user-agent') 
      });
      
      // Redirigir al login unificado
      const redirectUrl = new URL('/login', request.url);
      
      return NextResponse.redirect(redirectUrl);
    }

    // Verificar token JWT
    const user = await verifyJWTToken(token);
    
    // Verificar acceso a rutas de admin
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      logger.warn('Non-admin user attempted to access admin route', { 
        userId: user.uid, 
        role: user.role, 
        pathname 
      });
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Verificar acceso a rutas de restaurante
    if (pathname.startsWith('/dashboard') && user.role !== 'restaurant' && user.role !== 'admin') {
      logger.warn('Unauthorized user attempted to access dashboard', { 
        userId: user.uid, 
        role: user.role, 
        pathname 
      });
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Añadir headers con información del usuario para las APIs
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.uid);
    response.headers.set('x-user-role', user.role);
    if (user.restaurantId) {
      response.headers.set('x-restaurant-id', user.restaurantId);
    }

    return response;

  } catch (error) {
    logger.error('Authentication error in middleware', { 
      error: (error as Error).message, 
      pathname,
      userAgent: request.headers.get('user-agent')
    });

    // Token inválido o expirado, redirigir al login unificado
    const redirectUrl = new URL('/login', request.url);
    
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('auth-token'); // Limpiar token inválido
    
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

