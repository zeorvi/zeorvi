import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { retellIntegrationService } from '@/lib/services/retellIntegrationService';

// POST - Webhook principal de Retell para procesar todos los eventos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar la firma del webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    
    if (!validation.valid) {
      logger.warn('Invalid Retell webhook signature', { signature, body });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    logger.info('Retell webhook received', { 
      event: body.event, 
      callId: body.call_id,
      agentId: body.agent_id 
    });

    // Procesar el webhook automáticamente
    await retellIntegrationService.processWebhook(body);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event: body.event,
      callId: body.call_id
    });

  } catch (error) {
    logger.error('Error processing Retell webhook', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return NextResponse.json({ 
      error: 'Error processing webhook' 
    }, { status: 500 });
  }
}

// GET - Endpoint para verificar el estado del webhook
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('challenge');
    
    // Si es una verificación de webhook, responder con el challenge
    if (challenge) {
      return NextResponse.json({ challenge });
    }

    // Información del webhook
    return NextResponse.json({
      status: 'active',
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
      supported_events: [
        'call_started',
        'call_ended', 
        'call_analyzed',
        'agent_response',
        'function_called'
      ],
      last_check: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in webhook GET endpoint', { error: (error as Error).message });
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}