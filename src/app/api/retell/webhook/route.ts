import { NextRequest, NextResponse } from 'next/server';
import { RetellGoogleSheetsFunctions } from '@/lib/retellGoogleSheetsFunctions';

// Almacenar números de teléfono por call_id para usar en el análisis
const callPhoneNumbers = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Retell Webhook recibido:', JSON.stringify(body, null, 2));

    const { event, call_id, agent_id, data } = body;

    switch (event) {
      case 'call_started':
        await handleCallStarted(call_id, agent_id, data);
        break;
      
      case 'call_ended':
        await handleCallEnded(call_id, agent_id, data);
        break;
      
      case 'call_analyzed':
        await handleCallAnalyzed(call_id, agent_id, data);
        break;
      
      case 'llm_request':
        await handleLLMRequest(call_id, agent_id, data);
        break;
      
      case 'llm_response':
        await handleLLMResponse(call_id, agent_id, data);
        break;
      
      default:
        console.log(`⚠️ Evento no manejado: ${event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error en webhook de Retell:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

async function handleCallStarted(callId: string | undefined, agentId: string, callData?: Record<string, unknown>) {
  console.log(`📞 Llamada iniciada - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  // Extraer información del restaurante del agent_id
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 Restaurante identificado: ${restaurantId}`);
    
    // Obtener número de teléfono del cliente automáticamente
    const callerNumber: string = String(callData?.caller_number || callData?.from_number || callData?.phone || '');
    console.log(`📞 Número del cliente: ${callerNumber}`);
    
    // Guardar el número de teléfono para usar en el análisis posterior
    if (callerNumber && callerNumber !== '' && callId) {
      callPhoneNumbers.set(callId, callerNumber);
    }
    
    // Registrar inicio de llamada en logs
    // En producción aquí guardarías en la base de datos
    console.log(`📊 Llamada iniciada para restaurante ${restaurantId} desde ${callerNumber} a las ${new Date().toISOString()}`);
  }
}

async function handleCallEnded(callId: string, agentId: string, data: unknown) {
  console.log(`📞 Llamada finalizada - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 Llamada finalizada para restaurante ${restaurantId}`);
    
    // Registrar fin de llamada y estadísticas
    const duration = (data as { duration?: number })?.duration || 0;
    const status = (data as { status?: string })?.status || 'unknown';
    
    console.log(`📊 Duración: ${duration}s, Estado: ${status}`);
  }
  
  // Limpiar el número de teléfono de la memoria
  callPhoneNumbers.delete(callId);
  console.log(`🧹 Limpiado número de teléfono para call_id: ${callId}`);
}

async function handleCallAnalyzed(callId: string, agentId: string, data: unknown) {
  console.log(`📞 Llamada analizada - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 Análisis de llamada para restaurante ${restaurantId}`);
    
    // Procesar análisis de la llamada
    const analysis = (data as { analysis?: Record<string, unknown> })?.analysis || {};
    const summary = (data as { summary?: string })?.summary || '';
    const sentiment = (data as { sentiment?: string })?.sentiment || 'neutral';
    
    console.log(`📊 Análisis: ${JSON.stringify(analysis)}`);
    console.log(`📝 Resumen: ${summary}`);
    console.log(`😊 Sentimiento: ${sentiment}`);

    // Procesar solicitud de reserva si se detecta una
    try {
      const reservationResult = await extractReservationRequest(analysis, summary, agentId, callId);
      
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
}

async function handleLLMRequest(callId: string, agentId: string, data: unknown) {
  console.log(`🤖 LLM Request - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 LLM Request para restaurante ${restaurantId}`);
    
    // Procesar request del LLM
    const messages = (data as { messages?: Array<{ content?: string }> })?.messages || [];
    const lastMessage = messages[messages.length - 1];
    
    console.log(`💬 Último mensaje: ${lastMessage?.content || 'N/A'}`);
  }
}

async function handleLLMResponse(callId: string, agentId: string, data: unknown) {
  console.log(`🤖 LLM Response - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 LLM Response para restaurante ${restaurantId}`);
    
    // Procesar respuesta del LLM
    const response = (data as { response?: string })?.response || '';
    const actions = (data as { actions?: unknown[] })?.actions || [];
    
    console.log(`💬 Respuesta: ${response}`);
    console.log(`⚡ Acciones: ${JSON.stringify(actions)}`);
  }
}

function extractRestaurantIdFromAgentId(agentId: string): string | null {
  // Extraer restaurant_id del agent_id
  // Formato esperado: "rest_1234567890_agent" o similar
  const match = agentId.match(/rest_([a-zA-Z0-9_]+)_agent/);
  return match ? `rest_${match[1]}` : null;
}

function getRestaurantNameFromAgentId(agentId: string): string | null {
  // Extraer nombre del restaurante del agent_id
  // Formato esperado: "rest_003_agent" -> "La Gaviota"
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  if (!restaurantId) return null;

  // Mapeo de IDs a nombres (en producción esto vendría de una base de datos)
  const restaurantNames: Record<string, string> = {
    'rest_003': 'La Gaviota',
    'rest_004': 'El Buen Sabor'
  };

  return restaurantNames[restaurantId] || `Restaurante ${restaurantId}`;
}

async function extractReservationRequest(analysis: Record<string, unknown>, summary: string, agentId: string, callId: string) {
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

    // Obtener información del restaurante
    const restaurantId = extractRestaurantIdFromAgentId(agentId);
    const restaurantName = getRestaurantNameFromAgentId(agentId);

    if (!restaurantId || !restaurantName) {
      console.log('❌ No se pudo identificar el restaurante del agent ID');
      return null;
    }

    // Obtener spreadsheet ID del restaurante
    const spreadsheetId = `spreadsheet_${restaurantId}`;

    console.log(`📞 Teléfono obtenido automáticamente: ${phone}`);

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
        restaurantName,
        spreadsheetId
      );

      console.log('🔍 Disponibilidad verificada:', disponibilidad);

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
          restaurantName,
          spreadsheetId
        );

        console.log('📝 Reserva creada:', reservaResult);
        return {
          success: true,
          message: reservaResult.mensaje,
          numeroReserva: reservaResult.numeroReserva
        };
      } else {
        console.log('❌ No hay disponibilidad:', disponibilidad.mensaje);
        return {
          success: false,
          message: disponibilidad.mensaje,
          alternativas: disponibilidad.alternativas
        };
      }
    } catch (functionError) {
      console.error('❌ Error en funciones de Google Sheets:', functionError);
      return {
        success: false,
        message: 'Error procesando la reserva. Por favor, inténtelo de nuevo.'
      };
    }

  } catch (error) {
    console.error('❌ Error extrayendo solicitud de reserva:', error);
    return null;
  }
}