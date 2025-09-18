import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-retell-signature') || '';
    
    // Verificar webhook de Retell
    const validation = verifyRetellWebhook(signature, body);
    
    if (!validation.isValid) {
      console.error('❌ Webhook inválido:', validation.error);
      return NextResponse.json(
        { error: 'Webhook signature invalid' },
        { status: 401 }
      );
    }

    const data = JSON.parse(body);
    
    console.log('🎯 Webhook de Retell recibido:', {
      event: data.event,
      call_id: data.call_id,
      timestamp: new Date().toISOString()
    });

    // Procesar diferentes tipos de eventos
    switch (data.event) {
      case 'call_started':
        await handleCallStarted(data);
        break;
        
      case 'call_ended':
        await handleCallEnded(data);
        break;
        
      case 'call_analyzed':
        await handleCallAnalyzed(data);
        break;
        
      default:
        console.log('📝 Evento no procesado:', data.event);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook procesado correctamente' 
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function handleCallStarted(data: any) {
  console.log('📞 Llamada iniciada:', {
    call_id: data.call_id,
    from_number: data.from_number,
    to_number: data.to_number,
    timestamp: data.timestamp
  });

  // Aquí puedes agregar lógica para:
  // - Registrar la llamada en la base de datos
  // - Notificar al dashboard en tiempo real
  // - Preparar contexto del restaurante
}

async function handleCallEnded(data: any) {
  console.log('📞 Llamada finalizada:', {
    call_id: data.call_id,
    duration: data.duration_ms,
    disconnect_reason: data.disconnect_reason,
    timestamp: data.timestamp
  });

  // Aquí puedes agregar lógica para:
  // - Actualizar estadísticas de llamadas
  // - Procesar resultado de la reserva
  // - Enviar notificaciones al equipo
}

async function handleCallAnalyzed(data: any) {
  console.log('🤖 Llamada analizada:', {
    call_id: data.call_id,
    transcript: data.transcript,
    summary: data.summary,
    sentiment: data.sentiment,
    timestamp: data.timestamp
  });

  // Aquí puedes agregar lógica para:
  // - Guardar transcripción completa
  // - Analizar satisfacción del cliente
  // - Generar reportes automáticos
  // - Entrenar el modelo con conversaciones exitosas
}

// Endpoint GET para verificar que el webhook está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'Webhook activo',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/retell/webhook - Recibe eventos de Retell'
    ]
  });
}