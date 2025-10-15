import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { alertSystem } from '@/lib/alertSystem';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/alerts - Obtener alertas activas
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

    const alerts = alertSystem.getActiveAlerts(restaurantId);
    const stats = alertSystem.getAlertStats(restaurantId);
    
    logger.info(`Retrieved ${alerts.length} active alerts for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        stats
      }
    });

  } catch (error) {
    logger.error('Error getting alerts', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener alertas'
    }, { status: 500 });
  }
}

// POST /api/alerts/acknowledge - Reconocer alerta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alert ID is required' 
      }, { status: 400 });
    }

    const acknowledged = await alertSystem.acknowledgeAlert(alertId);
    
    if (acknowledged) {
      logger.info(`Alert ${alertId} acknowledged`);
      return NextResponse.json({
        success: true,
        message: 'Alerta reconocida correctamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Alerta no encontrada'
      }, { status: 404 });
    }

  } catch (error) {
    logger.error('Error acknowledging alert', error);
    return NextResponse.json({
      success: false,
      error: 'Error al reconocer alerta'
    }, { status: 500 });
  }
}

// PUT /api/alerts/resolve - Resolver alerta
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alert ID is required' 
      }, { status: 400 });
    }

    const resolved = await alertSystem.resolveAlert(alertId);
    
    if (resolved) {
      logger.info(`Alert ${alertId} resolved`);
      return NextResponse.json({
        success: true,
        message: 'Alerta resuelta correctamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Alerta no encontrada'
      }, { status: 404 });
    }

  } catch (error) {
    logger.error('Error resolving alert', error);
    return NextResponse.json({
      success: false,
      error: 'Error al resolver alerta'
    }, { status: 500 });
  }
}
