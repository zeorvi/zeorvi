import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

// POST - Endpoint para manejar redirección automática al dashboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar la firma del webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    
    if (!validation.valid) {
      logger.warn('Invalid Retell webhook signature for dashboard redirect', { signature, body });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { restaurantId, callId, transcript, summary } = body;

    // Validar que sea para La Gaviota
    if (restaurantId !== 'rest_003') {
      return NextResponse.json({ 
        message: 'Dashboard redirect only configured for La Gaviota',
        restaurantId 
      });
    }

    logger.info('Dashboard redirect request received', { 
      restaurantId, 
      callId,
      transcriptLength: transcript?.length || 0
    });

    // Crear respuesta con información de redirección
    const redirectResponse = {
      success: true,
      action: 'redirect_to_dashboard',
      restaurantId,
      callId,
      dashboardUrl: `/restaurant/${restaurantId}`,
      restaurantName: 'La Gaviota',
      message: 'Conversación procesada. Redirigiendo al dashboard...',
      transcript: {
        summary,
        processed: true,
        timestamp: new Date().toISOString()
      },
      redirectData: {
        url: `/restaurant/${restaurantId}`,
        title: 'La Gaviota - Dashboard',
        description: 'Nueva conversación procesada por el agente de IA'
      }
    };

    // Log para seguimiento
    logger.info('Dashboard redirect processed', {
      restaurantId,
      callId,
      dashboardUrl: redirectResponse.dashboardUrl,
      transcriptProcessed: !!transcript
    });

    return NextResponse.json(redirectResponse);

  } catch (error) {
    logger.error('Error processing dashboard redirect', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return NextResponse.json({ 
      error: 'Error processing dashboard redirect' 
    }, { status: 500 });
  }
}

// GET - Endpoint para verificar estado de redirección
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const callId = searchParams.get('callId');

    if (!restaurantId || !callId) {
      return NextResponse.json({ 
        error: 'Missing restaurantId or callId parameters' 
      }, { status: 400 });
    }

    // Verificar si hay redirecciones pendientes para este restaurante
    const redirectStatus = {
      restaurantId,
      callId,
      status: 'processed',
      dashboardUrl: `/restaurant/${restaurantId}`,
      lastChecked: new Date().toISOString(),
      message: 'Dashboard redirect is active for La Gaviota'
    };

    return NextResponse.json(redirectStatus);

  } catch (error) {
    logger.error('Error checking redirect status', { error: (error as Error).message });
    return NextResponse.json({ error: 'Error checking redirect status' }, { status: 500 });
  }
}
