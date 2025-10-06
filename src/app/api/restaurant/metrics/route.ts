import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { productionDb } from '@/lib/database/production';

// GET /api/restaurant/metrics - Obtener métricas del restaurante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date');

    if (!restaurantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID is required' 
      }, { status: 400 });
    }

    let metrics;
    
    if (date) {
      // Obtener métricas para una fecha específica
      const historicalMetrics = await productionDb.getRestaurantMetrics(restaurantId, date);
      metrics = historicalMetrics;
    } else {
      // Obtener métricas actuales
      metrics = await productionDb.getCurrentMetrics(restaurantId);
    }
    
    logger.info(`Retrieved metrics for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    logger.error('Error getting restaurant metrics', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener métricas del restaurante'
    }, { status: 500 });
  }
}
