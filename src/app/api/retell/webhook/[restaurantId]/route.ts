import { NextRequest, NextResponse } from 'next/server';
import { RetellGoogleSheetsFunctions } from '@/lib/retellGoogleSheetsFunctions';
import { applyRateLimit } from '@/lib/middleware/rateLimitingMiddleware';
import { handleApiError } from '@/lib/errorHandling/productionErrorHandler';
import { logger } from '@/lib/logger';
import { sqliteDb } from '@/lib/database/sqlite';

// Almacenar números de teléfono por call_id para usar en el análisis
// En producción, esto debería usar Redis para persistencia
const callPhoneNumbers = new Map<string, string>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const startTime = Date.now();
  const { restaurantId } = await params;
  
  try {
    // Validar que el restaurante existe
    const restaurantData = await sqliteDb.getRestaurant(restaurantId);
    if (!restaurantData) {
      return NextResponse.json({
        success: false,
        error: `Restaurante ${restaurantId} no encontrado`
      }, { status: 404 });
    }

    // Aplicar rate limiting específico para webhooks
    const rateLimitResponse = await applyRateLimit(request, undefined, 'enterprise', {
      standardHeaders: true,
      onLimitReached: (req, result) => {
        logger.error('Webhook rate limit exceeded', {
          url: req.url,
          restaurantId,
          result,
        });
      },
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    logger.info('Retell Webhook received', { 
      event: body.event,
      agent_id: body.agent_id,
      call_id: body.call_id,
      restaurantId
    });

    const { event, call_id, agent_id, data } = body;

    // Validar datos requeridos
    if (!event || !agent_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: event, agent_id' 
      }, { status: 400 });
    }

    // Procesar evento de forma asíncrona para mejor rendimiento
    const eventHandlers = {
      'call_started': () => handleCallStarted(call_id, agent_id, restaurantId, restaurantData, data),
      'call_ended': () => handleCallEnded(call_id, agent_id, restaurantId, data),
      'call_analyzed': () => handleCallAnalyzed(call_id, agent_id, restaurantId, restaurantData, data),
      'llm_request': () => handleLLMRequest(call_id, agent_id, restaurantId, data),
      'llm_response': () => handleLLMResponse(call_id, agent_id, restaurantId, data),
    };

    const handler = eventHandlers[event as keyof typeof eventHandlers];
    
    if (handler) {
      // Ejecutar handler de forma asíncrona (no bloquear la respuesta)
      setImmediate(async () => {
        try {
          await handler();
        } catch (error) {
          logger.error('Error processing webhook event', {
            event,
            call_id,
            agent_id,
            restaurantId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    } else {
      logger.warn('Unhandled webhook event', { event, restaurantId });
    }

    const responseTime = Date.now() - startTime;
    logger.info('Webhook processed', { event, restaurantId, responseTime });

    return NextResponse.json({ 
      success: true,
      restaurantId,
      processed_at: new Date().toISOString(),
      response_time_ms: responseTime
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Webhook error', {
      restaurantId,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });
    
    return handleApiError(request, error, {
      endpoint: `/api/retell/webhook/${restaurantId}`,
      method: 'POST',
    });
  }
}

async function handleCallStarted(
  callId: string | undefined, 
  agentId: string, 
  restaurantId: string,
  restaurantData: any,
  callData?: Record<string, unknown>
) {
  console.log(`📞 Llamada iniciada - Call ID: ${callId}, Agent ID: ${agentId}, Restaurant: ${restaurantId}`);
  
  // Obtener número de teléfono del cliente automáticamente
  const callerNumber: string = String(callData?.caller_number || callData?.from_number || callData?.phone || '');
  console.log(`📞 Número del cliente: ${callerNumber}`);
  
  // Guardar el número de teléfono para usar en el análisis posterior
  if (callerNumber && callerNumber !== '' && callId) {
    callPhoneNumbers.set(callId, callerNumber);
  }
  
  // Registrar inicio de llamada en logs
  console.log(`📊 Llamada iniciada para restaurante ${restaurantData.name} (${restaurantId}) desde ${callerNumber} a las ${new Date().toISOString()}`);
}

async function handleCallEnded(callId: string, agentId: string, restaurantId: string, data: unknown) {
  console.log(`📞 Llamada finalizada - Call ID: ${callId}, Agent ID: ${agentId}, Restaurant: ${restaurantId}`);
  
  // Registrar fin de llamada y estadísticas
  const duration = (data as { duration?: number })?.duration || 0;
  const status = (data as { status?: string })?.status || 'unknown';
  
  console.log(`📊 Duración: ${duration}s, Estado: ${status} para restaurante ${restaurantId}`);
  
  // Limpiar el número de teléfono de la memoria
  callPhoneNumbers.delete(callId);
  console.log(`🧹 Limpiado número de teléfono para call_id: ${callId}`);
}

async function handleCallAnalyzed(
  callId: string, 
  agentId: string, 
  restaurantId: string,
  restaurantData: any,
  data: unknown
) {
  console.log(`📞 Llamada analizada - Call ID: ${callId}, Agent ID: ${agentId}, Restaurant: ${restaurantId}`);
  
  // Procesar análisis de la llamada
  const analysis = (data as { analysis?: Record<string, unknown> })?.analysis || {};
  const summary = (data as { summary?: string })?.summary || '';
  const sentiment = (data as { sentiment?: string })?.sentiment || 'neutral';
  
  console.log(`📊 Análisis para ${restaurantData.name}: ${JSON.stringify(analysis)}`);
  console.log(`📝 Resumen: ${summary}`);
  console.log(`😊 Sentimiento: ${sentiment}`);

  // Procesar solicitud de reserva si se detecta una
  try {
    const reservationResult = await extractReservationRequest(
      analysis, 
      summary, 
      restaurantId, 
      restaurantData, 
      callId
    );
    
    if (reservationResult) {
      console.log('🎯 Solicitud de reserva detectada, procesando...');
      
      if (reservationResult.success) {
        console.log('✅ Reserva procesada exitosamente:', reservationResult.message);
        // Aquí podrías enviar la respuesta de vuelta a Retell AI
        // para que el agente le diga al cliente que la reserva fue confirmada
      } else {
        console.log('❌ Reserva no pudo ser procesada:', reservationResult.message);
        // Aquí podrías enviar la respuesta de vuelta a Retell AI
        // para que el agente le diga al cliente que no hay disponibilidad
      }
    } else {
      console.log('ℹ️ No se detectó solicitud de reserva en esta llamada');
    }
  } catch (error) {
    console.error('❌ Error procesando solicitud de reserva:', error);
  }
}

async function handleLLMRequest(callId: string, agentId: string, restaurantId: string, data: unknown) {
  console.log(`🤖 LLM Request - Call ID: ${callId}, Agent ID: ${agentId}, Restaurant: ${restaurantId}`);
  
  // Procesar request del LLM
  const messages = (data as { messages?: Array<{ content?: string }> })?.messages || [];
  const lastMessage = messages[messages.length - 1];
  
  console.log(`💬 Último mensaje para ${restaurantId}: ${lastMessage?.content || 'N/A'}`);
}

async function handleLLMResponse(callId: string, agentId: string, restaurantId: string, data: unknown) {
  console.log(`🤖 LLM Response - Call ID: ${callId}, Agent ID: ${agentId}, Restaurant: ${restaurantId}`);
  
  // Procesar respuesta del LLM
  const response = (data as { response?: string })?.response || '';
  const actions = (data as { actions?: unknown[] })?.actions || [];
  
  console.log(`💬 Respuesta para ${restaurantId}: ${response}`);
  console.log(`⚡ Acciones: ${JSON.stringify(actions)}`);
}

async function extractReservationRequest(
  analysis: Record<string, unknown>, 
  summary: string, 
  restaurantId: string,
  restaurantData: any,
  callId: string
) {
  try {
    // Buscar patrones de reserva en el análisis y resumen
    const reservationKeywords = ['reserva', 'reservar', 'mesa', 'cita', 'appointment', 'booking', 'quiere reservar', 'necesito mesa'];
    const hasReservation = reservationKeywords.some(keyword => 
      summary.toLowerCase().includes(keyword) || 
      JSON.stringify(analysis).toLowerCase().includes(keyword)
    );

    if (!hasReservation) {
      return null;
    }

    // Extraer información de la reserva
    const customerName = String(analysis?.customer_name || analysis?.name || 'Cliente');
    // Obtener el número de teléfono del cliente automáticamente desde la llamada
    const phone = callPhoneNumbers.get(callId) || String(analysis?.phone || analysis?.telefono || '');
    const people = analysis?.people || analysis?.personas || analysis?.guests || 2;
    const date = String(analysis?.date || analysis?.fecha || new Date().toISOString().split('T')[0]);
    const time = String(analysis?.time || analysis?.hora || '20:00');
    const specialRequests = String(analysis?.requests || analysis?.solicitudes || analysis?.notes || '');

    console.log(`📞 Teléfono obtenido automáticamente para ${restaurantData.name}: ${phone}`);

    // Obtener spreadsheet ID del restaurante
    const spreadsheetId = `spreadsheet_${restaurantId}`;

    // Procesar la reserva usando las nuevas funciones específicas
    try {
      // 1. Verificar disponibilidad
      const disponibilidad = await RetellGoogleSheetsFunctions.verificarDisponibilidad(
        {
          fecha: date,
          hora: time,
          personas: parseInt(people.toString())
        },
        restaurantId,
        restaurantData.name
      );

      console.log('🔍 Disponibilidad verificada para', restaurantData.name, ':', disponibilidad);

      // 2. Si hay disponibilidad, crear la reserva
      if (disponibilidad.disponible) {
        const reservaResult = await RetellGoogleSheetsFunctions.crearReserva(
          {
            fecha: date,
            hora: time,
            cliente: customerName,
            telefono: phone,
            personas: parseInt(people.toString()),
            notas: specialRequests
          },
          restaurantId,
          restaurantData.name
        );

        console.log('📝 Reserva creada para', restaurantData.name, ':', reservaResult);
        return {
          success: true,
          message: reservaResult.mensaje,
          numeroReserva: reservaResult.numeroReserva
        };
      } else {
        console.log('❌ No hay disponibilidad para', restaurantData.name, ':', disponibilidad.mensaje);
        return {
          success: false,
          message: disponibilidad.mensaje,
          alternativas: disponibilidad.alternativas
        };
      }
    } catch (functionError) {
      console.error('❌ Error en funciones de Google Sheets para', restaurantData.name, ':', functionError);
      return {
        success: false,
        message: 'Error procesando la reserva. Por favor, inténtelo de nuevo.'
      };
    }

  } catch (error) {
    console.error('❌ Error extrayendo solicitud de reserva para', restaurantData.name, ':', error);
    return null;
  }
}
