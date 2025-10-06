import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

// POST - Crear nuevo restaurante
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      owner_email,
      owner_name,
      phone,
      address,
      city,
      country,
      config,
      plan = 'basic',
      retell_config,
      twilio_config,
      // Datos del usuario administrador
      admin_email,
      admin_password,
      admin_name
    } = body;

    // Validaciones básicas
    if (!name || !owner_email || !admin_email || !admin_password) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: name, owner_email, admin_email, admin_password'
      }, { status: 400 });
    }

    // Generar ID único para el restaurante
    const restaurantId = `rest_${Date.now()}`;
    const restaurantSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    // Crear el restaurante
    const restaurantData = {
      id: restaurantId,
      name,
      slug: restaurantSlug,
      owner_email,
      owner_name,
      phone,
      address,
      city,
      country,
      config: config || {},
      plan,
      status: 'active' as const,
      retell_config: retell_config || {},
      twilio_config: twilio_config || {}
    };

    const restaurant = await sqliteDb.createRestaurant(restaurantData);
    
    if (!restaurant) {
      return NextResponse.json({
        success: false,
        error: 'Error creando el restaurante'
      }, { status: 500 });
    }

    // Crear usuario administrador del restaurante
    const passwordHash = await bcrypt.hash(admin_password, 12);
    const userId = `user_${Date.now()}`;
    
    const userData = {
      id: userId,
      restaurant_id: restaurantId,
      email: admin_email,
      password_hash: passwordHash,
      name: admin_name || owner_name,
      role: 'restaurant' as const,
      permissions: ['admin', 'manage_reservations', 'manage_tables', 'view_analytics'],
      status: 'active' as const
    };

    const user = await sqliteDb.createUser(userData);
    
    if (!user) {
      // Si falla la creación del usuario, eliminar el restaurante
      // TODO: Implementar función de eliminación
      return NextResponse.json({
        success: false,
        error: 'Error creando el usuario administrador'
      }, { status: 500 });
    }

    logger.info('Restaurant created successfully', {
      restaurantId,
      restaurantName: name,
      adminEmail: admin_email
    });

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        owner_email: restaurant.owner_email,
        plan: restaurant.plan,
        status: restaurant.status
      },
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'Restaurante creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating restaurant:', error);
    logger.error('Restaurant creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Listar todos los restaurantes (solo para administradores)
export async function GET(request: NextRequest) {
  try {
    const restaurants = await sqliteDb.getAllRestaurants();
    
    return NextResponse.json({
      success: true,
      restaurants: restaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        owner_email: restaurant.owner_email,
        owner_name: restaurant.owner_name,
        phone: restaurant.phone,
        address: restaurant.address,
        city: restaurant.city,
        country: restaurant.country,
        plan: restaurant.plan,
        status: restaurant.status,
        created_at: restaurant.created_at,
        updated_at: restaurant.updated_at
      })),
      total: restaurants.length
    });

  } catch (error) {
    console.error('Error getting restaurants:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}