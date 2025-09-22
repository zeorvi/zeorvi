/**
 * API de Registro - Reemplaza Firebase Auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  restaurantId: z.string().uuid('ID de restaurante inválido'),
  role: z.enum(['admin', 'manager', 'employee']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = registerSchema.parse(body);
    
    // Registrar usuario
    const { user, token } = await authService.register(validatedData);
    
    // Crear respuesta con cookie segura
    const response = NextResponse.json({
      success: true,
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

    // Establecer cookie HTTP-only para el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 días
    });

    return response;

  } catch (error) {
    console.error('Error en registro:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error en el registro'
    }, { status: 400 });
  }
}

