import { NextRequest, NextResponse } from 'next/server';
import { realtimeNotifications, RealtimeNotification } from '@/lib/realtimeNotifications';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener notificaciones recientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    const notifications = realtimeNotifications.getRecentNotifications(restaurantId, limit);

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Enviar notificación en tiempo real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, type, data } = body;

    if (!restaurantId || !type || !data) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId, type y data son requeridos'
      }, { status: 400 });
    }

    const notification: RealtimeNotification = {
      type,
      restaurantId,
      data,
      timestamp: new Date().toISOString()
    };

    realtimeNotifications.addNotification(restaurantId, notification);

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada en tiempo real',
      notification,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
