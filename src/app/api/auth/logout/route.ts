/**
 * API de Logout - Reemplaza Firebase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Obtener token de la cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      // Verificar token para obtener user ID
      const user = await authService.verifyToken(token);
      if (user) {
        // Invalidar sesión
        await authService.logout(user.id);
      }
    }
    
    // Crear respuesta y eliminar cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso'
    });

    // Eliminar cookie de autenticación
    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('Error en logout:', error);
    
    const response = NextResponse.json({
      success: false,
      error: 'Error en el logout'
    }, { status: 500 });

    // Eliminar cookie de todas formas
    response.cookies.delete('auth-token');

    return response;
  }
}

