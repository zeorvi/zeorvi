import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verificar token para obtener userId
    const user = await authService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Hacer logout
    await authService.logout(user.id);

    return NextResponse.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
