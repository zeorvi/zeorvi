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
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || (pathname === '/' && request.method === 'GET')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Para desarrollo, permitir acceso sin autenticación
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // En producción, verificar autenticación
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Redirigir al login
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Continuar con la request
    return NextResponse.next();

  } catch (error) {
    // Token inválido, redirigir al login
    const redirectUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('auth-token');
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

