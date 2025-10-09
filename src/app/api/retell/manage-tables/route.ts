import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

// GET - Obtener información de mesas para gestión
export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Mock data de mesas
    const tables = [
      {
        id: '1',
        name: 'Mesa 1',
        capacity: 4,
        status: 'libre',
        location: 'interior',
        lastOccupied: null
      },
      {
        id: '2',
        name: 'Mesa 2', 
        capacity: 2,
        status: 'ocupada',
        location: 'terraza',
        lastOccupied: '2024-01-15T19:30:00Z'
      },
      {
        id: '3',
        name: 'Mesa 3',
        capacity: 6,
        status: 'reservada',
        location: 'interior',
        lastOccupied: null
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        tables,
        restaurantId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching tables for management', {
      error: (error as Error).message,
      restaurantId: restaurantId || 'unknown',
      action: 'GET_manage_tables'
    });
    return NextResponse.json({
      error: 'Error al obtener información de mesas'
    }, { status: 500 });
  }
}

// POST - Actualizar gestión de mesas
export async function POST(request: NextRequest) {
  let body: any = {};
  
  try {
    body = await request.json();

    // Validar webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { tableId, action, restaurantId, clientInfo } = body;

    if (!tableId || !action) {
      return NextResponse.json({
        error: 'Table ID y acción son requeridos'
      }, { status: 400 });
    }

    // Simular gestión de mesa
    const resultado = {
      tableId,
      action,
      status: 'success',
      message: `Mesa ${tableId} ${action} correctamente`,
      timestamp: new Date().toISOString()
    };

    logger.info('Table management action via Retell', {
      tableId,
      action,
      restaurantId: restaurantId || 'unknown',
      resultado: resultado.message
    });

    return NextResponse.json({
      success: true,
      ...resultado
    });

  } catch (error) {
    logger.error('Error in table management via Retell', {
      error: (error as Error).message,
      tableId: body?.tableId || 'unknown',
      restaurantId: body?.restaurantId || 'unknown',
      action: 'POST_manage_table'
    });
    return NextResponse.json({
      error: 'Error al gestionar mesa'
    }, { status: 500 });
  }
}










