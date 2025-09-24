/**
 * API de Registro - Sistema Personalizado
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
        { success: false, error: 'Demasiados intentos de registro. Intenta más tarde.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, role, restaurantId, restaurantName } = body;

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar rol
    if (!role || !['admin', 'restaurant'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido' },
        { status: 400 }
      );
    }

    logger.info('Registration attempt', { email, role, ip });

    // Intentar registro
    const authResult = await customAuth.register({
      email,
      password,
      name,
      role,
      restaurantId,
      restaurantName
    });

    if (!authResult.success) {
      logger.warn('Registration failed', { email, error: authResult.error, ip });
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 400 }
      );
    }

    logger.info('Registration successful', { 
      userId: authResult.user?.id, 
      email, 
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
        permissions: authResult.user?.permissions
      },
      token: authResult.token
    });

    // Configurar cookie segura
    response.cookies.set('auth-token', authResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    });

    return response;

  } catch (error) {
    logger.error('Registration API error', { error, ip });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}