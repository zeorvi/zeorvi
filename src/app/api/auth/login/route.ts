import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login API called');
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 VERCEL:', process.env.VERCEL);
    
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
    
    try {
      console.log('🔍 Step 1: Importing authService...');
      const authServiceModule = await import('@/lib/auth');
      console.log('✅ authService imported:', !!authServiceModule.default);
      
      console.log('🔍 Step 2: Calling authService.login()...');
      const result = await authServiceModule.default.login({
        email,
        password,
        restaurantSlug,
      });
      
      console.log('✅ Login successful for:', email);
      return NextResponse.json(result);
    } catch (loginError) {
      console.error('❌ Login process error:', loginError);
      console.error('❌ Error name:', loginError instanceof Error ? loginError.name : 'Unknown');
      console.error('❌ Error message:', loginError instanceof Error ? loginError.message : 'Unknown');
      console.error('❌ Error stack:', loginError instanceof Error ? loginError.stack : 'No stack');
      throw loginError;
    }
  } catch (error) {
    console.error('❌ Login API error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
