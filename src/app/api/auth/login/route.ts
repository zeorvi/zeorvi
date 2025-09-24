/**
 * API de Login - Sistema Personalizado
 * Reemplaza Firebase Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { customAuth } from '@/lib/auth/customAuth';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.auth.checkLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos de login. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el campo no esté vacío (acepta tanto emails como usernames)
    if (email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El campo usuario no puede estar vacío' },
        { status: 400 }
      );
    }
    logger.info('Login attempt', { username: email, ip });

    // Intentar login
    const authResult = await customAuth.login({ email, password });

    if (!authResult.success) {
      logger.warn('Login failed', { username: email, error: authResult.error, ip });
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    logger.info('Login successful', { 
      userId: authResult.user?.id, 
      username: email, 
      role: authResult.user?.role,
      ip 
    });

    // Crear respuesta con token
    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user?.id,
        email: authResult.user?.email,
        name: authResult.user?.name,
        role: authResult.user?.role,
        restaurantId: authResult.user?.restaurantId,
        restaurantName: authResult.user?.restaurantName,
        permissions: authResult.user?.permissions,
        lastLogin: authResult.user?.lastLogin
      },
      token: authResult.token
    });

    // Configurar cookie segura (no httpOnly para permitir acceso desde JavaScript)
    response.cookies.set('auth-token', authResult.token!, {
      httpOnly: false, // Permitir acceso desde JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });

    return response;

  } catch (error) {
    logger.error('Login API error', { error, ip });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}