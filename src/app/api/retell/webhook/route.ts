import { NextRequest, NextResponse } from 'next/server';

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

async function handleCallStarted(callId: string, agentId: string, data: any) {
  console.log(`📞 Llamada iniciada - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  // Extraer información del restaurante del agent_id
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 Restaurante identificado: ${restaurantId}`);
    
    // Registrar inicio de llamada en logs
    // En producción aquí guardarías en la base de datos
    console.log(`📊 Llamada iniciada para restaurante ${restaurantId} a las ${new Date().toISOString()}`);
  }
}

async function handleCallEnded(callId: string, agentId: string, data: any) {
  console.log(`📞 Llamada finalizada - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 Llamada finalizada para restaurante ${restaurantId}`);
    
    // Registrar fin de llamada y estadísticas
    const duration = data?.duration || 0;
    const status = data?.status || 'unknown';
    
    console.log(`📊 Duración: ${duration}s, Estado: ${status}`);
  }
}

async function handleCallAnalyzed(callId: string, agentId: string, data: any) {
  console.log(`📞 Llamada analizada - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 Análisis de llamada para restaurante ${restaurantId}`);
    
    // Procesar análisis de la llamada
    const analysis = data?.analysis || {};
    const summary = data?.summary || '';
    const sentiment = data?.sentiment || 'neutral';
    
    console.log(`📊 Análisis: ${JSON.stringify(analysis)}`);
    console.log(`📝 Resumen: ${summary}`);
    console.log(`😊 Sentimiento: ${sentiment}`);
  }
}

async function handleLLMRequest(callId: string, agentId: string, data: any) {
  console.log(`🤖 LLM Request - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 LLM Request para restaurante ${restaurantId}`);
    
    // Procesar request del LLM
    const messages = data?.messages || [];
    const lastMessage = messages[messages.length - 1];
    
    console.log(`💬 Último mensaje: ${lastMessage?.content || 'N/A'}`);
  }
}

async function handleLLMResponse(callId: string, agentId: string, data: any) {
  console.log(`🤖 LLM Response - Call ID: ${callId}, Agent ID: ${agentId}`);
  
  const restaurantId = extractRestaurantIdFromAgentId(agentId);
  
  if (restaurantId) {
    console.log(`🏪 LLM Response para restaurante ${restaurantId}`);
    
    // Procesar respuesta del LLM
    const response = data?.response || '';
    const actions = data?.actions || [];
    
    console.log(`💬 Respuesta: ${response}`);
    console.log(`⚡ Acciones: ${JSON.stringify(actions)}`);
  }
}

function extractRestaurantIdFromAgentId(agentId: string): string | null {
  // Extraer restaurant_id del agent_id
  // Formato esperado: "restaurant_rest_003_agent" o similar
  const match = agentId.match(/rest_(\d+)/);
  return match ? `rest_${match[1]}` : null;
}