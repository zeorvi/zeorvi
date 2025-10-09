import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword } from '@/lib/auth/hardcodedUsers';

export async function POST() {
  try {
    console.log('🧪 Testing hardcoded authentication...');
    
    const email = 'admin@lagaviota.com';
    const password = 'admin123';
    
    // Buscar usuario
    const user = await findUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado',
        email
      }, { status: 404 });
    }
    
    console.log('✅ Usuario encontrado:', user.email);
    
    // Verificar contraseña
    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Contraseña incorrecta',
        hash: user.passwordHash
      }, { status: 401 });
    }
    
    console.log('✅ Contraseña válida');
    
    return NextResponse.json({
      success: true,
      message: 'Autenticación hardcoded funciona correctamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurantName
      }
    });
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    return NextResponse.json({
      success: false,
      error: 'Error en el test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

