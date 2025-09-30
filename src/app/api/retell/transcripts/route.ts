import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// GET - Obtener transcripts para un restaurante específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!restaurantId) {
      return NextResponse.json({ 
        error: 'Missing restaurantId parameter' 
      }, { status: 400 });
    }

    // Validar que sea para La Gaviota
    if (restaurantId !== 'rest_003') {
      return NextResponse.json({ 
        error: 'Transcripts only available for La Gaviota (rest_003)' 
      }, { status: 403 });
    }

    logger.info('Fetching transcripts', { restaurantId, limit });

    // En una implementación real, esto haría una consulta a Firestore/PostgreSQL
    // Por ahora, simulamos datos
    const mockTranscripts = [
      {
        id: '1',
        restaurantId: 'rest_003',
        callId: 'call_123',
        agentId: 'agent_2082fc7a622cdbd22441b22060',
        transcript: 'Cliente: Hola, quiero hacer una reserva para 4 personas mañana a las 20:00.\n\nAgente: ¡Hola! Perfecto, para 4 personas mañana a las 20:00. ¿Podría darme su nombre y teléfono para confirmar la reserva?\n\nCliente: Soy Juan Pérez, mi teléfono es 123-456-789.\n\nAgente: ¡Perfecto Juan! Confirmo su reserva para 4 personas mañana a las 20:00. ¿Hay alguna alergia alimentaria que deba saber?\n\nCliente: No, ninguna alergia.\n\nAgente: Excelente. Su reserva está confirmada. ¡Los esperamos en La Gaviota!',
        summary: 'Reserva confirmada para Juan Pérez, 4 personas, mañana 20:00, sin alergias',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3540000).toISOString(),
        duration: 60,
        fromNumber: '+34123456789',
        toNumber: '+34987654321',
        callStatus: 'completed',
        createdAt: new Date().toISOString(),
        processed: true
      },
      {
        id: '2',
        restaurantId: 'rest_003',
        callId: 'call_124',
        agentId: 'agent_2082fc7a622cdbd22441b22060',
        transcript: 'Cliente: Buenos días, necesito cancelar mi reserva de hoy.\n\nAgente: Buenos días. Por supuesto, ¿me puede dar su nombre o teléfono para buscar la reserva?\n\nCliente: Soy María González, teléfono 987-654-321.\n\nAgente: Encontré su reserva para 2 personas hoy a las 20:00. ¿Confirma que quiere cancelarla?\n\nCliente: Sí, por favor.\n\nAgente: Perfecto, he cancelado su reserva. Lamento que no pueda acompañarnos en La Gaviota. ¡Esperamos verle pronto!',
        summary: 'Reserva cancelada para María González, 2 personas, hoy 20:00',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 7140000).toISOString(),
        duration: 60,
        fromNumber: '+34987654321',
        toNumber: '+34987654321',
        callStatus: 'completed',
        createdAt: new Date().toISOString(),
        processed: true
      }
    ];

    // Simular filtrado por límite
    const transcripts = mockTranscripts.slice(0, limit);

    logger.info('Transcripts fetched successfully', { 
      restaurantId, 
      count: transcripts.length 
    });

    return NextResponse.json({
      success: true,
      restaurantId,
      transcripts,
      total: transcripts.length,
      limit
    });

  } catch (error) {
    logger.error('Error fetching transcripts', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return NextResponse.json({ 
      error: 'Error fetching transcripts' 
    }, { status: 500 });
  }
}

// POST - Crear nuevo transcript (usado por el webhook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, callId, transcript, summary, agentId } = body;

    if (!restaurantId || !callId || !transcript) {
      return NextResponse.json({ 
        error: 'Missing required fields: restaurantId, callId, transcript' 
      }, { status: 400 });
    }

    // Validar que sea para La Gaviota
    if (restaurantId !== 'rest_003') {
      return NextResponse.json({ 
        error: 'Transcripts only available for La Gaviota (rest_003)' 
      }, { status: 403 });
    }

    logger.info('Creating new transcript', { 
      restaurantId, 
      callId,
      transcriptLength: transcript.length 
    });

    // En una implementación real, esto guardaría en Firestore/PostgreSQL
    const newTranscript = {
      id: `transcript_${Date.now()}`,
      restaurantId,
      callId,
      agentId: agentId || 'agent_2082fc7a622cdbd22441b22060',
      transcript,
      summary: summary || 'Resumen automático',
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime,
      duration: body.duration,
      fromNumber: body.fromNumber || 'N/A',
      toNumber: body.toNumber || '+34987654321',
      callStatus: body.callStatus || 'completed',
      createdAt: new Date().toISOString(),
      processed: true
    };

    // Simular guardado exitoso
    logger.info('Transcript created successfully', { 
      restaurantId, 
      callId,
      transcriptId: newTranscript.id 
    });

    return NextResponse.json({
      success: true,
      transcript: newTranscript,
      message: 'Transcript saved successfully'
    });

  } catch (error) {
    logger.error('Error creating transcript', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return NextResponse.json({ 
      error: 'Error creating transcript' 
    }, { status: 500 });
  }
}
