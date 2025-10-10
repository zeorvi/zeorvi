import { NextRequest, NextResponse } from 'next/server';

// GET /api/restaurant/metrics - Obtener métricas del restaurante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID is required' 
      }, { status: 400 });
    }

    console.log('📊 [Restaurant Metrics] Obteniendo métricas para:', restaurantId);
    
    // Métricas básicas hardcoded para producción
    const metrics = {
      totalTables: 8,
      occupiedTables: 0,
      freeTables: 8,
      reservedTables: 0,
      occupancyRate: 0,
      revenue: 0,
      reservations: 0,
      averageOccupancy: 0
    };
    
    console.log(`✅ [Restaurant Metrics] Métricas obtenidas para ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('❌ [Restaurant Metrics] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener métricas del restaurante'
    }, { status: 500 });
  }
}
