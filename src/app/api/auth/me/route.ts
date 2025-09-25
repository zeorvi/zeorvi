/**
 * API para obtener información del usuario actual
 * Reemplaza Firebase Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar token
    const user = await authService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    logger.info('User info requested', { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurantName,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    logger.error('User info API error', { error });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}