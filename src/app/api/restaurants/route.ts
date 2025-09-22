/**
 * API de Restaurantes - Reemplaza Firebase Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { db } from '@/lib/database';
import { z } from 'zod';

const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(3, 'Slug debe tener al menos 3 caracteres'),
  owner_email: z.string().email('Email inválido'),
  owner_name: z.string().min(2, 'Nombre del propietario requerido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('España'),
  config: z.record(z.any()).default({}),
  plan: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
  retell_config: z.record(z.any()).default({}),
  twilio_config: z.record(z.any()).default({})
});

// GET - Obtener restaurantes (solo admin)
export async function GET(request: NextRequest) {
  try {
    const user = await authService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden ver todos los restaurantes
    if (user.role !== 'admin') {
      // Usuarios normales solo ven su restaurante
      const restaurant = await db.getRestaurant(user.restaurantId);
      return NextResponse.json({
        success: true,
        restaurants: restaurant ? [restaurant] : []
      });
    }

    // Admin puede ver todos
    const result = await db.pg.query(`
      SELECT * FROM restaurants 
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      restaurants: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo restaurantes:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear restaurante
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const validatedData = createRestaurantSchema.parse(body);
    
    // Verificar que el slug no esté en uso
    const existingRestaurant = await db.getRestaurantBySlug(validatedData.slug);
    if (existingRestaurant) {
      return NextResponse.json({
        error: 'El slug ya está en uso'
      }, { status: 400 });
    }

    // Crear restaurante
    const restaurant = await db.createRestaurant(validatedData);

    // Crear usuario administrador para el restaurante
    await authService.register({
      email: validatedData.owner_email,
      password: 'temp123456', // Contraseña temporal
      name: validatedData.owner_name,
      restaurantId: restaurant.id,
      role: 'admin'
    });

    return NextResponse.json({
      success: true,
      restaurant,
      message: 'Restaurante creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando restaurante:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error creando restaurante'
    }, { status: 500 });
  }
}

