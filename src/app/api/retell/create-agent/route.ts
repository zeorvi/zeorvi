import { NextRequest, NextResponse } from 'next/server';
import { getRetellAgentConfig, createRetellAgent } from '@/lib/retellConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Obtener configuración del agente
    const config = getRetellAgentConfig(restaurantId);
    if (!config) {
      return NextResponse.json({
        success: false,
        error: `No hay configuración disponible para el restaurante ${restaurantId}`
      }, { status: 404 });
    }

    // Crear configuración del agente para Retell
    const agentConfig = await createRetellAgent(config);

    // En producción aquí harías la llamada real a la API de Retell
    // const retellResponse = await fetch('https://api.retellai.com/v2/create-agent', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${config.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(agentConfig),
    // });

    // Simular respuesta de Retell
    const mockRetellResponse = {
      agent_id: `retell_agent_${restaurantId}_${Date.now()}`,
      agent_name: agentConfig.agent_name,
      status: 'active',
      created_at: new Date().toISOString(),
      webhook_url: agentConfig.webhook_url,
      llm_websocket_url: agentConfig.llm_websocket_url
    };

    console.log(`🤖 Agente Retell creado para restaurante ${restaurantId}:`, mockRetellResponse);

    return NextResponse.json({
      success: true,
      restaurantId,
      agent: mockRetellResponse,
      config: {
        webhook_url: agentConfig.webhook_url,
        redirect_webhook_url: agentConfig.redirect_webhook_url,
        llm_websocket_url: agentConfig.llm_websocket_url
      },
      message: `Agente Retell creado exitosamente para ${config.restaurantName}`
    });

  } catch (error) {
    console.error('Error creating Retell agent:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Obtener configuración del agente
    const config = getRetellAgentConfig(restaurantId);
    if (!config) {
      return NextResponse.json({
        success: false,
        error: `No hay configuración disponible para el restaurante ${restaurantId}`
      }, { status: 404 });
    }

    // Simular información del agente existente
    const mockAgentInfo = {
      agent_id: `retell_agent_${restaurantId}`,
      agent_name: `${config.restaurantName} - Agente de Reservas`,
      status: 'active',
      restaurant_id: restaurantId,
      restaurant_name: config.restaurantName,
      webhook_url: `${config.baseUrl}/api/retell/webhook`,
      redirect_webhook_url: `${config.baseUrl}/api/retell/dashboard-redirect`,
      llm_websocket_url: 'wss://api.retellai.com/v2/llm/stream',
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      restaurantId,
      agent: mockAgentInfo,
      config: {
        voice_id: config.voiceId,
        language: config.language,
        base_url: config.baseUrl
      }
    });

  } catch (error) {
    console.error('Error getting Retell agent:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
