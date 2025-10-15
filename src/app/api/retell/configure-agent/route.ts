import { NextRequest, NextResponse } from 'next/server';
import { getCompleteAgentConfig } from '@/lib/retellConfig';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Configurar agente real de Retell AI con prompt específico
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

    // Obtener configuración completa del agente
    const completeConfig = getCompleteAgentConfig(restaurantId);
    
    if (!completeConfig) {
      return NextResponse.json({
        success: false,
        error: `No hay configuración disponible para el restaurante ${restaurantId}`
      }, { status: 404 });
    }

    // Configuración para enviar a Retell AI
    const retellConfig = {
      agent_id: completeConfig.agent.agent_id,
      agent_name: completeConfig.agent.agent_name,
      voice_id: completeConfig.agent.voice_id,
      language: completeConfig.agent.language,
      voice_speed: completeConfig.agent.voice_speed,
      voice_temperature: completeConfig.agent.voice_temperature,
      interruption_threshold: completeConfig.agent.interruption_threshold,
      enable_backchannel: completeConfig.agent.enable_backchannel,
      enable_webhook: completeConfig.agent.enable_webhook,
      webhook_url: completeConfig.agent.webhook_url,
      webhook_events: completeConfig.agent.webhook_events,
      redirect_webhook_url: completeConfig.agent.redirect_webhook_url,
      llm_websocket_url: completeConfig.agent.llm_websocket_url,
      llm_websocket_api_key: completeConfig.agent.llm_websocket_api_key,
      
      // Prompt específico del restaurante
      system_prompt: completeConfig.prompt,
      
      // Variables dinámicas
      custom_llm_dynamic_variables: completeConfig.dynamic_variables,
      
      // Configuración adicional
      enable_transfer_call: false,
      enable_recording: true,
      enable_transcription: true,
      max_talk_time: 300, // 5 minutos máximo
      silence_timeout: 5000, // 5 segundos de silencio
      
      // Configuración específica del restaurante
      restaurant_context: {
        id: completeConfig.restaurant.restaurantId,
        name: completeConfig.restaurant.restaurantName,
        type: completeConfig.restaurant.restaurantType,
        specialty: completeConfig.restaurant.restaurantSpecialty,
        ambiance: completeConfig.restaurant.restaurantAmbiance,
        phone: completeConfig.restaurant.phone,
        email: completeConfig.restaurant.email,
        address: completeConfig.restaurant.address,
        schedule: completeConfig.restaurant.schedule,
        locations: completeConfig.restaurant.locations,
        tables: completeConfig.restaurant.tables,
        available_times: completeConfig.restaurant.availableTimes,
        specialties: completeConfig.restaurant.specialties
      }
    };

    // En producción, aquí harías la llamada real a la API de Retell AI
    // const retellResponse = await fetch('https://api.retellai.com/v2/update-agent', {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${completeConfig.agent.llm_websocket_api_key}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(retellConfig),
    // });

    // Simular respuesta de Retell AI
    const mockRetellResponse = {
      success: true,
      agent_id: completeConfig.agent.agent_id,
      agent_name: completeConfig.agent.agent_name,
      status: 'active',
      updated_at: new Date().toISOString(),
      configuration: retellConfig
    };

    console.log(`🤖 Agente Retell configurado para ${completeConfig.restaurant.restaurantName}:`, mockRetellResponse);

    return NextResponse.json({
      success: true,
      restaurantId,
      agent: mockRetellResponse,
      configuration: retellConfig,
      restaurant: completeConfig.restaurant,
      prompt: completeConfig.prompt,
      apis: completeConfig.apis,
      message: `Agente Retell configurado exitosamente para ${completeConfig.restaurant.restaurantName}`
    });

  } catch (error) {
    console.error('Error configuring Retell agent:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET - Obtener configuración del agente
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

    // Obtener configuración completa del agente
    const completeConfig = getCompleteAgentConfig(restaurantId);
    
    if (!completeConfig) {
      return NextResponse.json({
        success: false,
        error: `No hay configuración disponible para el restaurante ${restaurantId}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurantId,
      configuration: completeConfig,
      message: `Configuración del agente obtenida para ${completeConfig.restaurant.restaurantName}`
    });

  } catch (error) {
    console.error('Error getting agent configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
