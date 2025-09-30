/**
 * API para sincronizar restaurantes en producción
 * Solo accesible para administradores
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import authService from '@/lib/auth';

// Usar SQLite en desarrollo, PostgreSQL en producción
let db: any;
if (process.env.NODE_ENV === 'development') {
  try {
    db = require('@/lib/database/sqlite').default;
  } catch (error) {
    console.error('Error loading SQLite database:', error);
    db = require('@/lib/database').db;
  }
} else {
  db = require('@/lib/database').db;
}

export async function POST(request: NextRequest) {
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para sincronizar restaurantes' },
        { status: 403 }
      );
    }

    // Solo ejecutar en producción
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: false,
        error: 'Esta función solo está disponible en producción'
      });
    }

    // Datos de restaurantes a sincronizar
    const restaurantsToSync = [
      {
        name: 'Restaurante El Buen Sabor',
        slug: 'el-buen-sabor',
        owner_email: 'admin@elbuensabor.com',
        owner_name: 'María González',
        phone: '+34123456789',
        address: 'Calle Principal 123',
        city: 'Madrid',
        retell_config: {
          agent_id: 'agent_2082fc7a622cdbd22441b22060',
          api_key: 'key_af2cbf1b9fb5a43ebc84bc56b27b',
          phone_number: '+34984175959'
        },
        twilio_config: {
          account_sid: 'TKeeaa06c4cb6cc36135a403c046fef1f2',
          auth_token: '8a1ec4fac38025b24b3945a48eb1b48d',
          phone_number: '+34984175959'
        }
      },
      {
        name: 'Restaurante La Gaviota',
        slug: 'la-gaviota',
        owner_email: 'admin@lagaviota.com',
        owner_name: 'Carlos Rodríguez',
        phone: '+34912345678',
        address: 'Avenida del Mar 45',
        city: 'Valencia',
        retell_config: {
          agent_id: 'agent_la_gaviota_001',
          api_key: 'key_la_gaviota_2024',
          phone_number: '+34912345678'
        },
        twilio_config: {
          account_sid: 'TKeeaa06c4cb6cc36135a403c046fef1f2',
          auth_token: '8a1ec4fac38025b24b3945a48eb1b48d',
          phone_number: '+34912345678'
        }
      }
    ];

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Conectar a PostgreSQL
    const client = await db.pg.connect();
    
    try {
      for (const restaurantData of restaurantsToSync) {
        try {
          // Verificar si el restaurante ya existe
          const existingResult = await client.query(
            'SELECT id FROM restaurants WHERE slug = $1',
            [restaurantData.slug]
          );
          
          if (existingResult.rows.length > 0) {
            results.skipped++;
            results.details.push({
              restaurant: restaurantData.name,
              action: 'skipped',
              reason: 'Ya existe'
            });
            continue;
          }
          
          // Insertar restaurante
          const insertResult = await client.query(`
            INSERT INTO restaurants (
              name, slug, owner_email, owner_name, phone, address, city,
              retell_config, twilio_config, status, plan
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
          `, [
            restaurantData.name,
            restaurantData.slug,
            restaurantData.owner_email,
            restaurantData.owner_name,
            restaurantData.phone,
            restaurantData.address,
            restaurantData.city,
            JSON.stringify(restaurantData.retell_config),
            JSON.stringify(restaurantData.twilio_config),
            'active',
            'basic'
          ]);
          
          const restaurantId = insertResult.rows[0].id;
          
          // Crear schema del restaurante
          await client.query('SELECT create_restaurant_schema($1)', [restaurantId]);
          
          // Insertar usuario del restaurante
          const bcrypt = require('bcryptjs');
          const passwordHash = await bcrypt.hash('restaurante123', 12);
          
          await client.query(`
            INSERT INTO restaurant_users (
              restaurant_id, email, password_hash, name, role, restaurant_name,
              permissions, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            restaurantId,
            restaurantData.owner_email,
            passwordHash,
            restaurantData.owner_name,
            'restaurant',
            restaurantData.name,
            JSON.stringify(['tables:read', 'tables:write', 'reservations:read', 'reservations:write', 'clients:read', 'clients:write', 'reports:read']),
            'active'
          ]);
          
          results.created++;
          results.details.push({
            restaurant: restaurantData.name,
            action: 'created',
            id: restaurantId
          });
          
        } catch (error) {
          results.errors++;
          results.details.push({
            restaurant: restaurantData.name,
            action: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`Error creating restaurant ${restaurantData.name}:`, error);
        }
      }
      
    } finally {
      client.release();
    }

    logger.info('Restaurants synced', { 
      userId: user.id,
      results 
    });

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${results.created} creados, ${results.skipped} omitidos, ${results.errors} errores`,
      results
    });

  } catch (error) {
    logger.error('Restaurants sync API error', { error });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
