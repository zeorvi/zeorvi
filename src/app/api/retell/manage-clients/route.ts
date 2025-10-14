import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

// GET - Obtener información de clientes
export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Mock data de clientes
    const clients = [
      {
        id: '1',
        name: 'Juan Pérez',
        phone: '+1234567890',
        email: 'juan@email.com',
        lastVisit: '2024-01-15',
        totalVisits: 5,
        preferences: ['mesa cerca de ventana', 'sin gluten']
      },
      {
        id: '2', 
        name: 'María García',
        phone: '+1234567891',
        email: 'maria@email.com',
        lastVisit: '2024-01-10',
        totalVisits: 3,
        preferences: ['mesa para 4 personas']
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        clients,
        restaurantId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching clients', {
      error: (error as Error).message,
      restaurantId: restaurantId || 'unknown',
      action: 'GET_clients'
    });
    return NextResponse.json({
      error: 'Error al obtener información de clientes'
    }, { status: 500 });
  }
}

// POST - Actualizar información de cliente
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

    const { clientId, clientInfo, restaurantId } = body;

    if (!clientId) {
      return NextResponse.json({
        error: 'Client ID es requerido'
      }, { status: 400 });
    }

    // Simular actualización de cliente
    const updatedClient = {
      id: clientId,
      ...clientInfo,
      updatedAt: new Date().toISOString(),
      updatedBy: 'retell-ai'
    };

    logger.info('Client updated via Retell', {
      clientId,
      restaurantId
    });

    return NextResponse.json({
      success: true,
      client: updatedClient,
      message: `Cliente ${clientId} actualizado correctamente`
    });

  } catch (error) {
    logger.error('Error updating client via Retell', {
      error: (error as Error).message,
      clientId: body?.clientId || 'unknown',
      restaurantId: body?.restaurantId || 'unknown',
      action: 'POST_update_client'
    });
    return NextResponse.json({
      error: 'Error al actualizar cliente'
    }, { status: 500 });
  }
}














