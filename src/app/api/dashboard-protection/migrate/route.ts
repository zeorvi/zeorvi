import { NextRequest, NextResponse } from 'next/server';
import { migrateRestaurantsToStandardDashboard } from '@/lib/dashboardProtection';

/**
 * API Endpoint para migrar restaurantes existentes al dashboard estándar
 * POST /api/dashboard-protection/migrate
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Dashboard Protection] Iniciando migración desde API...');
    
    // Ejecutar migración
    migrateRestaurantsToStandardDashboard();
    
    return NextResponse.json({
      success: true,
      message: 'Migración a dashboard estándar completada',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Dashboard Protection] Error en migración:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error durante la migración',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
