/**
 * API para verificar estado de autenticación
 * Reemplaza Firebase Auth state
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      }, { status: 401 });
    }

    // Verificar token
    const user = await authService.verifyToken(token);
    
    if (!user) {
      // Token inválido, eliminar cookie
      const response = NextResponse.json({ 
        authenticated: false,
        user: null 
      }, { status: 401 });
      
      response.cookies.delete('auth-token');
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurantName,
        permissions: user.permissions
      }
    });

  } catch (error) {
    console.error('Error verificando autenticación:', error);
    
    const response = NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Error verificando autenticación'
    }, { status: 500 });
    
    response.cookies.delete('auth-token');
    return response;
  }
}

