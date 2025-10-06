/**
 * API para obtener un restaurante específico por ID
 */

import { NextRequest, NextResponse } from 'next/server';
// Usar SQLite en desarrollo y producción temporalmente hasta resolver Supabase
let db: any;
try {
  db = require('@/lib/database/sqlite').sqliteDb;
} catch (error) {
  console.error('Error loading SQLite database:', error);
  // Fallback a PostgreSQL si SQLite falla
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

    // Actualizar restaurante usando SQLite
    try {
      const restaurant = await db.updateRestaurant(restaurantId, updateData);
      
      if (!restaurant) {
        return NextResponse.json(
          { success: false, error: 'Restaurante no encontrado' },
          { status: 404 }
        );
      }

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

    } catch (updateError) {
      console.error('SQLite update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Error actualizando restaurante' },
        { status: 500 }
      );
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
    console.log('🔑 User verification result:', user ? 'User found' : 'User not found');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;
    console.log('🏪 Fetching restaurant:', restaurantId);

    // Obtener restaurante usando SQLite
    let restaurant;
    
    try {
      restaurant = await db.getRestaurant(restaurantId);
      
      if (!restaurant) {
        // Si no existe el restaurante, crear uno por defecto para rest_003
        if (restaurantId === 'rest_003') {
          console.log('🔧 Creando restaurante rest_003 (La Gaviota) automáticamente...');
          
          restaurant = await db.createRestaurant({
            id: 'rest_003',
            name: 'La Gaviota',
            slug: 'la-gaviota',
            owner_email: 'info@lagaviota.com',
            owner_name: 'María García',
            phone: '+34 912 345 678',
            address: 'Paseo Marítimo, 123',
            city: 'Valencia',
            country: 'España',
            config: { theme: 'maritime', features: ['reservations', 'tables', 'menu'] },
            plan: 'premium',
            status: 'active'
          });
          
          console.log('✅ Restaurante rest_003 creado automáticamente');
        } else {
          return NextResponse.json(
            { success: false, error: 'Restaurante no encontrado' },
            { status: 404 }
          );
        }
      }
      
      // Contar usuarios del restaurante
      const user_count = await db.getUserCount(restaurantId);
      restaurant.user_count = user_count;
      
    } catch (sqliteError) {
      console.error('SQLite error:', sqliteError);
      return NextResponse.json(
        { success: false, error: 'Error accediendo a la base de datos' },
        { status: 500 }
      );
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
    console.error('Restaurant get API error:', error);
    logger.error('Restaurant get API error', { error, restaurantId: (await params).id });    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}