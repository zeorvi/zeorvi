import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, restaurantId } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    const result = await authService.register({
      email,
      password,
      name,
      role: role || 'employee',
      restaurantId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}