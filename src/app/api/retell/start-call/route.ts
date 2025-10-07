import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, phoneNumber, testMode = true } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // ✅ CORREGIDO: Usar POST para create-agent
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const agentResponse = await fetch(`${base}/api/retell/create-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ restaurantId }),
    });
    const agentData = await agentResponse.json();

    if (!agentData.success) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo obtener información del agente'
      }, { status: 404 });
    }

    const agent = agentData.agent;

    // En producción aquí harías la llamada real a la API de Retell para iniciar la llamada
    // const callResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     agent_id: agent.agent_id,
    //     to_number: phoneNumber,
    //     from_number: '+1234567890', // Número del restaurante
    //     webhook_url: agent.webhook_url,
    //     metadata: {
    //       restaurant_id: restaurantId,
    //       test_mode: testMode
    //     }
    //   }),
    // });

    // Simular respuesta de llamada iniciada
    const mockCallResponse = {
      call_id: `call_${restaurantId}_${Date.now()}`,
      agent_id: agent.agent_id,
      to_number: phoneNumber || '+1234567890',
      from_number: '+1234567890',
      status: 'initiated',
      created_at: new Date().toISOString(),
      webhook_url: agent.webhook_url,
      metadata: {
        restaurant_id: restaurantId,
        test_mode: testMode
      }
    };

    console.log(`📞 Llamada iniciada para restaurante ${restaurantId}:`, mockCallResponse);

    return NextResponse.json({
      success: true,
      restaurantId,
      call: mockCallResponse,
      agent: {
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        restaurant_name: agent.restaurant_name
      },
      message: `Llamada iniciada exitosamente para ${agent.restaurant_name}`
    });

  } catch (error) {
    console.error('Error starting call:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
