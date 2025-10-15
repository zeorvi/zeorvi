import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Usar SQLite en desarrollo, PostgreSQL en producción
let db: any;
if (process.env.NODE_ENV === 'development') {
  try {
    db = require('@/lib/database/sqlite').sqliteDb;
  } catch (error) {
    console.error('Error loading SQLite database:', error);
    db = require('@/lib/database').db;
  }
} else {
  db = require('@/lib/database').db;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    // Verificar autenticación
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await authService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Solo los administradores pueden cambiar contraseñas
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para cambiar contraseñas' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const restaurantId = resolvedParams.restaurantId;
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Actualizar contraseña en la base de datos
    if (process.env.NODE_ENV === 'development') {
      // SQLite
      const sqlite3 = require('sqlite3');
      const path = require('path');
      
      const dbPath = path.join(process.cwd(), 'restaurant_dev.db');
      const sqliteDb = new sqlite3.Database(dbPath);
      
      await new Promise((resolve, reject) => {
        sqliteDb.run(
          'UPDATE restaurant_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE restaurant_id = ? AND status = ?',
          [passwordHash, restaurantId, 'active'],
          function(this: any, err: any) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
      
      sqliteDb.close();
    } else {
      // PostgreSQL
      const client = await db.pg.connect();
      try {
        await client.query(`
          UPDATE restaurant_users 
          SET password_hash = $1, updated_at = NOW()
          WHERE restaurant_id = $2 AND status = 'active'
        `, [passwordHash, restaurantId]);
      } finally {
        client.release();
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
