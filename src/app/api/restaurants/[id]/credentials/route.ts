/**
 * API para actualizar credenciales de un restaurante
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { logger } from '@/lib/logger';
import authService from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
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

    // Solo los administradores pueden actualizar credenciales
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para actualizar credenciales' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;
    const body = await request.json();
    const { username, password } = body;

    logger.info('Restaurant credentials update request', { 
      restaurantId, 
      username: username,
      passwordProvided: !!password,
      adminUserId: user.id 
    });

    // Validar datos de entrada
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username y password son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el username no esté vacío y tenga al menos 3 caracteres
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'El username debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Conectar a la base de datos
    const client = await db.pg.connect();
    try {
      logger.info('Starting database transaction', { restaurantId, username });

      // 1. Verificar que el restaurante existe
      const restaurantCheck = await client.query(
        'SELECT id, name, owner_name FROM restaurants WHERE id = $1',
        [restaurantId]
      );

      if (restaurantCheck.rows.length === 0) {
        logger.error('Restaurant not found', { restaurantId });
        return NextResponse.json(
          { success: false, error: 'Restaurante no encontrado' },
          { status: 404 }
        );
      }

      logger.info('Restaurant found', { 
        restaurantId, 
        restaurantName: restaurantCheck.rows[0].name 
      });

      // 2. Actualizar el email del restaurante (usamos el campo owner_email para almacenar el username)
      const updateRestaurantResult = await client.query(
        'UPDATE restaurants SET owner_email = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [username, restaurantId]
      );

      logger.info('Restaurant updated', { 
        restaurantId, 
        newOwnerEmail: username 
      });

      // 3. Buscar usuario asociado al restaurante
      const userResult = await client.query(
        'SELECT id, email FROM restaurant_users WHERE restaurant_id = $1 AND role = $2 LIMIT 1',
        [restaurantId, 'restaurant']
      );

      const hashedPassword = await bcrypt.hash(password, 12);

      if (userResult.rows.length > 0) {
        // 4. Actualizar usuario existente
        logger.info('Updating existing user', { 
          userId: userResult.rows[0].id,
          oldEmail: userResult.rows[0].email,
          newUsername: username 
        });

        await client.query(
          'UPDATE restaurant_users SET email = $1, password_hash = $2, updated_at = NOW() WHERE id = $3',
          [username, hashedPassword, userResult.rows[0].id]
        );
        
        logger.info('Restaurant user credentials updated', { 
          userId: userResult.rows[0].id,
          restaurantId,
          newUsername: username
        });
      } else {
        // 5. Crear nuevo usuario si no existe
        logger.info('Creating new user', { 
          restaurantId,
          username: username 
        });

        const newUserId = randomUUID();
        await client.query(`
          INSERT INTO restaurant_users (id, restaurant_id, email, password_hash, name, role, status, permissions, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, [
          newUserId,
          restaurantId,
          username,
          hashedPassword,
          restaurantCheck.rows[0].owner_name || 'Propietario',
          'restaurant',
          'active',
          JSON.stringify(['manage_restaurant', 'view_analytics', 'manage_tables'])
        ]);
        
        logger.info('New restaurant user created', { 
          newUserId,
          restaurantId,
          username: username
        });
      }

      logger.info('Restaurant credentials updated successfully', { 
        restaurantId, 
        newUsername: username,
        adminUserId: user.id 
      });

      return NextResponse.json({
        success: true,
        message: 'Credenciales actualizadas correctamente',
        data: {
          username: username,
          restaurantId: restaurantId
        }
      });

    } catch (error) {
      logger.error('Database operation failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        restaurantId
      });
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Restaurant credentials update error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      restaurantId: (await params).id
    });
    
    // En desarrollo, mostrar el error completo
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : String(error))
      : 'Error interno del servidor';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
