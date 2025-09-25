/**
 * API para obtener un restaurante específico por ID
 */

import { NextRequest, NextResponse } from 'next/server';
// Usar SQLite en desarrollo, PostgreSQL en producción
let db: any;
if (process.env.NODE_ENV === 'development') {
  try {
    db = require('@/lib/database/sqlite').sqliteDb;
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    let token = request.cookies.get('auth-token')?.value;
    
    // Si no hay token en cookies, buscar en Authorization header
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

    // Solo los administradores pueden actualizar restaurantes
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para actualizar restaurantes' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;
    const body = await request.json();

    // Validar datos de entrada
    const allowedFields = [
      'name', 'slug', 'owner_email', 'owner_name', 'phone', 'address', 
      'city', 'country', 'config', 'retell_config', 'twilio_config'
    ];
    
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    // Actualizar restaurante
    const client = await db.pg.connect();
    try {
      const setClause = Object.keys(updateData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = [restaurantId, ...Object.values(updateData)];
      
      const result = await client.query(`
        UPDATE restaurants 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Restaurante no encontrado' },
          { status: 404 }
        );
      }

      const restaurant = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        slug: result.rows[0].slug,
        owner_email: result.rows[0].owner_email,
        owner_name: result.rows[0].owner_name,
        phone: result.rows[0].phone,
        address: result.rows[0].address,
        city: result.rows[0].city,
        country: result.rows[0].country,
        config: result.rows[0].config,
        plan: result.rows[0].plan,
        status: result.rows[0].status,
        retell_config: result.rows[0].retell_config,
        twilio_config: result.rows[0].twilio_config,
        created_at: result.rows[0].created_at,
        updated_at: result.rows[0].updated_at
      };

      logger.info('Restaurant updated', { 
        restaurantId, 
        updatedFields: Object.keys(updateData),
        userId: user.id 
      });

      return NextResponse.json({
        success: true,
        restaurant,
        message: 'Restaurante actualizado correctamente'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Restaurant update API error', { error, restaurantId: (await params).id }); 
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    let token = request.cookies.get('auth-token')?.value;
    
    // Si no hay token en cookies, buscar en Authorization header
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

    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;

    // Obtener restaurante
    let restaurant;
    
    if (process.env.NODE_ENV === 'development') {
      // SQLite
      restaurant = await db.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return NextResponse.json(
          { success: false, error: 'Restaurante no encontrado' },
          { status: 404 }
        );
      }
      
      // Contar usuarios del restaurante
      const user_count = await db.getUserCount(restaurantId);
      restaurant.user_count = user_count;
      
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
          WHERE r.id = $1
          GROUP BY r.id, r.name, r.slug, r.owner_email, r.owner_name, r.phone, 
                   r.address, r.city, r.country, r.config, r.plan, r.status, 
                   r.retell_config, r.twilio_config, r.created_at, r.updated_at
        `, [restaurantId]);

        if (result.rows.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Restaurante no encontrado' },
            { status: 404 }
          );
        }

        restaurant = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          slug: result.rows[0].slug,
          owner_email: result.rows[0].owner_email,
          owner_name: result.rows[0].owner_name,
          phone: result.rows[0].phone,
          address: result.rows[0].address,
          city: result.rows[0].city,
          country: result.rows[0].country,
          config: result.rows[0].config,
          plan: result.rows[0].plan,
          status: result.rows[0].status,
          retell_config: result.rows[0].retell_config,
          twilio_config: result.rows[0].twilio_config,
          created_at: result.rows[0].created_at,
          updated_at: result.rows[0].updated_at,
          user_count: parseInt(result.rows[0].user_count)
        };

      } finally {
        client.release();
      }
    }

    logger.info('Restaurant retrieved', { 
      restaurantId, 
      userId: user.id 
    });

    return NextResponse.json({
      success: true,
      restaurant
    });

  } catch (error) {
    logger.error('Restaurant get API error', { error, restaurantId: (await params).id });    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}