import { NextRequest, NextResponse } from 'next/server';
import { validateNewRestaurant } from '@/lib/dashboardProtection';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API Endpoint para crear nuevos restaurantes con dashboard protegido
 * POST /api/restaurants/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, phone, email, type } = body;
    
    // Validaciones básicas
    if (!name || !address || !phone || !email) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: name, address, phone, email'
      }, { status: 400 });
    }
    
    // Generar ID único para el restaurante
    const restaurantId = `rest_${Date.now().toString().padStart(3, '0')}`;
    
    console.log(`🏗️ [Restaurant Creation] Creando nuevo restaurante: ${restaurantId}`);
    
    // Crear datos del restaurante
    const restaurantData = {
      id: restaurantId,
      name,
      address,
      phone,
      email,
      type: type || 'restaurante',
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    // Aplicar protección del dashboard automáticamente
    const dashboardValid = validateNewRestaurant(restaurantId, restaurantData);
    
    if (!dashboardValid) {
      return NextResponse.json({
        success: false,
        message: 'Error aplicando configuración estándar del dashboard'
      }, { status: 500 });
    }
    
    // En producción, aquí se guardaría en la base de datos
    console.log(`✅ [Restaurant Creation] Restaurante ${restaurantId} creado con dashboard estándar`);
    
    return NextResponse.json({
      success: true,
      message: 'Restaurante creado exitosamente con dashboard estándar',
      restaurant: restaurantData,
      dashboardConfig: {
        version: '2.0-optimized',
        protected: true,
        appliedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [Restaurant Creation] Error creando restaurante:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error creando restaurante',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
