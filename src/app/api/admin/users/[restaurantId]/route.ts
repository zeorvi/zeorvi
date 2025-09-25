import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';

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

export async function GET(
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

    // Solo los administradores pueden ver las credenciales
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver las credenciales' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const restaurantId = resolvedParams.restaurantId;

    // Obtener usuario del restaurante
    let restaurantUser;
    
    if (process.env.NODE_ENV === 'development') {
      // SQLite - buscar usuario por restaurant_id
      const sqlite3 = require('sqlite3');
      const path = require('path');
      
      const dbPath = path.join(process.cwd(), 'restaurant_dev.db');
      const sqliteDb = new sqlite3.Database(dbPath);
      
      restaurantUser = await new Promise((resolve, reject) => {
        sqliteDb.get(
          'SELECT * FROM restaurant_users WHERE restaurant_id = ? AND status = ?',
          [restaurantId, 'active'],
          (err: any, row: any) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      sqliteDb.close();
    } else {
      // PostgreSQL
      const client = await db.pg.connect();
      try {
        const result = await client.query(`
          SELECT * FROM restaurant_users 
          WHERE restaurant_id = $1 AND status = 'active'
        `, [restaurantId]);
        
        restaurantUser = result.rows[0];
      } finally {
        client.release();
      }
    }

    if (!restaurantUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario del restaurante no encontrado' },
        { status: 404 }
      );
    }

    // Obtener información del restaurante
    const restaurant = await db.getRestaurant(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    // Retornar información del usuario (sin la contraseña hash)
    const userInfo = {
      id: restaurantUser.id,
      email: restaurantUser.email,
      name: restaurantUser.name,
      role: restaurantUser.role,
      restaurant_id: restaurantUser.restaurant_id,
      restaurant_name: restaurant.name,
      status: restaurantUser.status,
      last_login: restaurantUser.last_login,
      created_at: restaurantUser.created_at,
      updated_at: restaurantUser.updated_at
    };

    return NextResponse.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('Error getting restaurant user:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
