/**
 * API para listar restaurantes
 */

import { NextRequest, NextResponse } from 'next/server';
// Usar SQLite en desarrollo, PostgreSQL en producción
let db: any;
if (process.env.NODE_ENV === 'development') {
  try {
    db = require('@/lib/database/sqlite').default;
  } catch (error) {
    console.error('Error loading SQLite database:', error);
    // Fallback a PostgreSQL si SQLite falla
    db = require('@/lib/database').db;
  }
} else {
  db = require('@/lib/database').db;
}
import { logger } from '@/lib/logger';
import authService from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación - buscar token en cookies o header Authorization
    let token = request.cookies.get('auth-token')?.value;
    
    // Si no hay token en cookies, buscar en header Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remover 'Bearer '
        console.log('🔑 Token obtenido del header Authorization');
      }
    } else {
      console.log('🍪 Token obtenido de las cookies');
    }
    
    if (!token) {
      console.log('❌ No se encontró token de autenticación');
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

    // Solo los administradores pueden listar todos los restaurantes
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para listar restaurantes' },
        { status: 403 }
      );
    }

    // Obtener todos los restaurantes
    let restaurants;

    if (process.env.NODE_ENV === 'development') {
      // SQLite
      restaurants = await db.getAllRestaurants();
      
      // Agregar user_count para cada restaurante
      for (const restaurant of restaurants) {
        const userCountStmt = db.db.prepare('SELECT COUNT(*) as count FROM restaurant_users WHERE restaurant_id = ? AND status = ?');
        const userCountResult = userCountStmt.get(restaurant.id, 'active');
        restaurant.user_count = userCountResult ? userCountResult.count : 0;
      }
    } else {
      // PostgreSQL
      const client = await db.pg.connect();
      try {
        const result = await client.query(`
          SELECT 
            r.id,
            r.name,
            r.slug,
            r.owner_email,
            r.owner_name,
            r.phone,
            r.address,
            r.city,
            r.country,
            r.config,
            r.plan,
            r.status,
            r.retell_config,
            r.twilio_config,
            r.created_at,
            r.updated_at,
            COUNT(ru.id) as user_count
          FROM restaurants r
          LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.status = 'active'
          GROUP BY r.id, r.name, r.slug, r.owner_email, r.owner_name, r.phone, 
                   r.address, r.city, r.country, r.config, r.plan, r.status, 
                   r.retell_config, r.twilio_config, r.created_at, r.updated_at
          ORDER BY r.created_at DESC
        `);

        restaurants = result.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          owner_email: row.owner_email,
          owner_name: row.owner_name,
          phone: row.phone,
          address: row.address,
          city: row.city,
          country: row.country,
          config: row.config,
          plan: row.plan,
          status: row.status,
          retell_config: row.retell_config,
          twilio_config: row.twilio_config,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user_count: parseInt(row.user_count)
        }));
      } finally {
        client.release();
      }
    }

    logger.info('Restaurants listed', { 
      count: restaurants.length, 
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      restaurants
    });

  } catch (error) {
    logger.error('Restaurants list API error', { error });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}