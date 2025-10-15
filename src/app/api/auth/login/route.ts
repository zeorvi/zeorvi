import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login API called');
    
    const body = await request.json();
    console.log('📊 Request body:', { email: body.email, hasPassword: !!body.password });
    
    const { email, password, restaurantSlug } = body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 Attempting login for:', email);
    
    const result = await authService.login({
      email,
      password,
      restaurantSlug,
    });

    console.log('✅ Login successful for:', email);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Login API error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
