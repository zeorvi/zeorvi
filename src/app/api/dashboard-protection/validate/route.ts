import { NextRequest, NextResponse } from 'next/server';
import { validateDashboardConfig, applyStandardDashboardConfig } from '@/lib/dashboardProtection';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API Endpoint para validar configuración del dashboard
 * POST /api/dashboard-protection/validate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, config } = body;
    
    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        message: 'restaurantId es requerido'
      }, { status: 400 });
    }
    
    console.log(`🔍 [Dashboard Protection] Validando ${restaurantId}...`);
    
    // Validar configuración
    const isValid = validateDashboardConfig(restaurantId, config);
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Configuración válida',
        restaurantId,
        validatedAt: new Date().toISOString()
      });
    } else {
      // Aplicar configuración estándar si no es válida
      const standardConfig = applyStandardDashboardConfig(restaurantId);
      
      return NextResponse.json({
        success: false,
        message: 'Configuración inválida, aplicando configuración estándar',
        restaurantId,
        standardConfig,
        appliedAt: new Date().toISOString()
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ [Dashboard Protection] Error en validación:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error durante la validación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
