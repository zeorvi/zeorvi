import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { analyticsEngine } from '@/lib/analyticsEngine';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/analytics/report - Obtener reporte de analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const period = searchParams.get('period') as 'today' | 'week' | 'month' | 'quarter' | 'year' || 'week';

    if (!restaurantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID is required' 
      }, { status: 400 });
    }

    const report = await analyticsEngine.generateAnalyticsReport(restaurantId, period);
    
    logger.info(`Analytics report generated for restaurant ${restaurantId}, period: ${period}`);

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Error generating analytics report', error);
    return NextResponse.json({
      success: false,
      error: 'Error al generar reporte de analytics'
    }, { status: 500 });
  }
}

// POST /api/analytics/clear-cache - Limpiar cache de analytics
export async function POST(request: NextRequest) {
  try {
    analyticsEngine.clearCache();
    
    logger.info('Analytics cache cleared');

    return NextResponse.json({
      success: true,
      message: 'Cache de analytics limpiado correctamente'
    });

  } catch (error) {
    logger.error('Error clearing analytics cache', error);
    return NextResponse.json({
      success: false,
      error: 'Error al limpiar cache de analytics'
    }, { status: 500 });
  }
}
