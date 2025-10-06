import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword, newEmail } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'email y newPassword son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el usuario por email
    const user = await sqliteDb.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar en SQLite
    const updateData: any = {
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    };

    if (newEmail) {
      updateData.email = newEmail;
    }

    const success = await sqliteDb.updateUser(user.id, updateData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Credenciales actualizadas correctamente'
      });
    } else {
      return NextResponse.json(
        { error: 'Error actualizando las credenciales' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
