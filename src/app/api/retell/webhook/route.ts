import { NextRequest, NextResponse } from 'next/server';
import { RetellGoogleSheetsFunctions } from '@/lib/retellGoogleSheetsFunctions';
import { applyRateLimit } from '@/lib/middleware/rateLimitingMiddleware';
import { handleApiError } from '@/lib/errorHandling/productionErrorHandler';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Almacenar números de teléfono por call_id para usar en el análisis
// En producción, esto debería usar Redis para persistencia
const callPhoneNumbers = new Map<string, string>();

// Cache para evitar consultas repetitivas
const restaurantCache = new Map<string, { id: string; name: string }>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Aplicar rate limiting específico para webhooks
    const rateLimitResponse = await applyRateLimit(request, undefined, 'enterprise', {
      standardHeaders: true,
      onLimitReached: (req, result) => {
        logger.error('Webhook rate limit exceeded', {
          url: req.url,
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
      call_id: body.call_id 
    });

    const { event, call_id, agent_id, data } = body;

    // Validar datos requeridos (pero devolver 200 para evitar reintentos)
    if (!event || !agent_id) {
      logger.warn('⚠️ Webhook sin event o agent_id:', body);
      return NextResponse.json({ 
        success: true, 
        info: 'Campos faltantes, ignorado' 
      }, { status: 200 });
    }

    // ✅ NUEVA FUNCIÓN: Extraer restaurante desde metadata o agent_id
    const restaurantId = getRestaurantFromBody(body);
    if (!restaurantId) {
      logger.warn('No se pudo determinar el restaurante', { 
        agent_id, 
        metadata: body.metadata,
        data_metadata: body.data?.metadata 
      });
      // Devolver 200 igualmente para evitar reintentos
      return NextResponse.json({ 
        success: true, 
        info: 'No se pudo determinar restaurantId, evento ignorado' 
      }, { status: 200 });
    }

    logger.info('Restaurante identificado', { 
      restaurantId, 
      agent_id,
      method: body.metadata?.restaurantId ? 'metadata' : 'agent_id_pattern'
    });

    // Procesar evento de forma asíncrona para mejor rendimiento
    const eventHandlers = {
      'call_started': () => handleCallStarted(call_id, agent_id, restaurantId, data),
      'call_ended': () => handleCallEnded(call_id, agent_id, restaurantId, data),
      'call_analyzed': () => handleCallAnalyzed(call_id, agent_id, restaurantId, data),
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
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });
    
    return handleApiError(request, error, {
      endpoint: '/api/retell/webhook',
      method: 'POST',
    });
  }
}

// ✅ NUEVA FUNCIÓN: Extraer restaurante desde metadata o agent_id
function getRestaurantFromBody(body: any): string | null {
  // Prioridad 1: metadata.restaurantId (recomendado)
  const metaId = body?.metadata?.restaurantId || body?.data?.metadata?.restaurantId;
  if (metaId) {
    logger.info('Restaurante obtenido desde metadata', { restaurantId: metaId });
    return metaId as string;
  }

  // Prioridad 2: patrón en agent_id (fallback)
  const agentId = body?.agent_id || body?.agentId || '';
  const match = String(agentId).match(/rest_([a-zA-Z0-9_]+)_agent/);
  if (match) {
    const restaurantId = `rest_${match[1]}`;
    logger.info('Restaurante obtenido desde agent_id pattern', { agentId, restaurantId });
    return restaurantId;
  }

  // Prioridad 3: mapeo directo (compatibilidad)
  const directMapping: Record<string, string> = {
    'agent_2082fc7a622cdbd22441b22060': 'rest_003', // La Gaviota
    'agent_elbuensabor_001': 'rest_004', // El Buen Sabor
  };
  
  if (directMapping[agentId]) {
    logger.info('Restaurante obtenido desde mapeo directo', { agentId, restaurantId: directMapping[agentId] });
    return directMapping[agentId];
  }

  logger.warn('No se pudo determinar el restaurante', { agentId, metadata: body?.metadata });
  return null;
}

async function handleCallStarted(
  callId: string | undefined, 
  agentId: string, 
  restaurantId: string,
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
  console.log(`📊 Llamada iniciada para restaurante ${restaurantId} desde ${callerNumber} a las ${new Date().toISOString()}`);
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
  data: unknown
) {
  console.log(`📞 Llamada analizada - Call ID: ${callId}, Agent ID: ${agentId}, Restaurant: ${restaurantId}`);
  
  // Procesar análisis de la llamada
  const analysis = (data as { analysis?: Record<string, unknown> })?.analysis || {};
  const summary = (data as { summary?: string })?.summary || '';
  const sentiment = (data as { sentiment?: string })?.sentiment || 'neutral';
  
  console.log(`📊 Análisis para restaurante ${restaurantId}: ${JSON.stringify(analysis)}`);
  console.log(`📝 Resumen: ${summary}`);
  console.log(`😊 Sentimiento: ${sentiment}`);

  // Procesar solicitud de reserva si se detecta una
  try {
    const reservationResult = await extractReservationRequest(
      analysis, 
      summary, 
      restaurantId, 
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

    // ✅ NORMALIZAR ZONA HORARIA
    const zona = "Europe/Madrid";
    const fechaBase = new Date();
    let fechaReserva;

    const fechaTexto = String(analysis?.date || analysis?.fecha || 'mañana');
    
    if (fechaTexto === "mañana" || fechaTexto === "tomorrow") {
      const manana = new Date(fechaBase.getTime() + 24 * 60 * 60 * 1000);
      fechaReserva = manana.toLocaleDateString("es-ES", { timeZone: zona });
    } else if (fechaTexto === "hoy" || fechaTexto === "today") {
      fechaReserva = fechaBase.toLocaleDateString("es-ES", { timeZone: zona });
    } else {
      // Si viene en formato ISO, convertir a formato español
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) {
        const fecha = new Date(`${fechaTexto}T00:00:00`);
        fechaReserva = fecha.toLocaleDateString("es-ES", { timeZone: zona });
      } else {
        fechaReserva = fechaTexto;
      }
    }

    // ✅ GARANTIZAR QUE EL TELÉFONO SE CAPTURE SIEMPRE
    const telefono =
      callPhoneNumbers.get(callId) || // Prioridad 1: número de la llamada
      String(analysis?.phone || analysis?.telefono || '') ||
      String(analysis?.caller_phone_number || '') ||
      String((analysis?.call as any)?.from_number || '') ||
      String((analysis?.call as any)?.caller_number || '') ||
      String((analysis?.session as any)?.caller_phone || '') ||
      String((analysis?.session as any)?.from || '') ||
      "no_disponible";

    // ✅ NORMALIZAR ESTADO
    const estado = (analysis?.estado || "confirmada").toString().toLowerCase();

    // Extraer información de la reserva
    const customerName = String(analysis?.customer_name || analysis?.name || 'Cliente');
    const people = analysis?.people || analysis?.personas || analysis?.guests || 2;
    const time = String(analysis?.time || analysis?.hora || '20:00');
    const specialRequests = String(analysis?.requests || analysis?.solicitudes || analysis?.notes || '');

    console.log(`📞 Teléfono obtenido para restaurante ${restaurantId}: ${telefono}`);
    console.log(`📅 Fecha normalizada para restaurante ${restaurantId}: ${fechaReserva}`);

    // ✅ CREAR OBJETO DE RESERVA NORMALIZADO
    const reserva = {
      cliente: customerName,
      fecha: fechaReserva,
      hora: time,
      personas: parseInt(people.toString()),
      mesa: String(analysis?.mesa || analysis?.table || ''),
      telefono,
      estado,
      creado_en: new Date().toISOString(),
      restaurantId,
      callId
    };

    console.log("✅ Reserva normalizada:", reserva);

    // Procesar la reserva usando las nuevas funciones específicas
    try {
      // 1. Verificar disponibilidad
      const disponibilidad = await RetellGoogleSheetsFunctions.verificarDisponibilidad(
        {
          fecha: fechaReserva,
          hora: time,
          personas: parseInt(people.toString())
        },
        restaurantId,
        getRestaurantNameFromId(restaurantId)
      );

      console.log('🔍 Disponibilidad verificada para', restaurantId, ':', disponibilidad);

      // 2. Si hay disponibilidad, crear la reserva
      if (disponibilidad.disponible) {
        const reservaResult = await RetellGoogleSheetsFunctions.crearReserva(
          {
            fecha: fechaReserva,
            hora: time,
            cliente: customerName,
            telefono: telefono,
            personas: parseInt(people.toString()),
            notas: specialRequests
          },
          restaurantId,
          getRestaurantNameFromId(restaurantId)
        );

        console.log('📝 Reserva creada para', restaurantId, ':', reservaResult);
        return {
          success: true,
          message: reservaResult.mensaje,
          numeroReserva: reservaResult.numeroReserva,
          reserva: reserva
        };
      } else {
        console.log('❌ No hay disponibilidad para', restaurantId, ':', disponibilidad.mensaje);
        return {
          success: false,
          message: disponibilidad.mensaje,
          alternativas: disponibilidad.alternativas,
          reserva: reserva
        };
      }
    } catch (functionError) {
      console.error('❌ Error en funciones de Google Sheets para', restaurantId, ':', functionError);
      return {
        success: false,
        message: 'Error procesando la reserva. Por favor, inténtelo de nuevo.',
        reserva: reserva
      };
    }

  } catch (error) {
    console.error('❌ Error extrayendo solicitud de reserva para', restaurantId, ':', error);
    return null;
  }
}

function getRestaurantNameFromId(restaurantId: string): string {
  // Mapeo de IDs a nombres (en producción esto vendría de una base de datos)
  const restaurantNames: Record<string, string> = {
    'rest_003': 'La Gaviota',
    'rest_004': 'El Buen Sabor'
  };

  return restaurantNames[restaurantId] || `Restaurante ${restaurantId}`;
}
