/**
 * API de Logout - Sistema Personalizado
 * Reemplaza Firebase Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    // Obtener token de la cookie para logging
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      // Aquí podrías invalidar el token en una blacklist si quisieras
      // Por ahora simplemente lo removemos de las cookies
      logger.info('User logout', { ip });
    }

    // Crear respuesta
    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

    // Limpiar cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expirar inmediatamente
      path: '/'
    });

    return response;

  } catch (error) {
    logger.error('Logout API error', { error });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}