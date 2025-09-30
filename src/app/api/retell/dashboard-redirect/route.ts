import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔗 Dashboard Redirect recibido:', JSON.stringify(body, null, 2));

    const { call_id, agent_id, restaurant_id, action, data } = body;

    // Validar parámetros requeridos
    if (!call_id || !agent_id) {
      return NextResponse.json({
        success: false,
        error: 'call_id y agent_id son requeridos'
      }, { status: 400 });
    }

    // Determinar el restaurante
    const restaurantId = restaurant_id || extractRestaurantIdFromAgentId(agent_id);
    
    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo determinar el restaurante'
      }, { status: 400 });
    }

    console.log(`🏪 Procesando acción para restaurante: ${restaurantId}`);

    // Procesar diferentes tipos de acciones
    let result;
    switch (action) {
      case 'check_availability':
        result = await handleCheckAvailability(restaurantId, data);
        break;
      
      case 'create_reservation':
        result = await handleCreateReservation(restaurantId, data);
        break;
      
      case 'update_table_status':
        result = await handleUpdateTableStatus(restaurantId, data);
        break;
      
      case 'get_client_info':
        result = await handleGetClientInfo(restaurantId, data);
        break;
      
      case 'get_agenda':
        result = await handleGetAgenda(restaurantId, data);
        break;
      
      default:
        result = {
          success: false,
          error: `Acción no reconocida: ${action}`
        };
    }

    // Registrar la acción en logs
    console.log(`📊 Acción ${action} procesada para restaurante ${restaurantId}:`, result);

    return NextResponse.json({
      success: true,
      call_id,
      agent_id,
      restaurant_id: restaurantId,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en dashboard redirect:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

async function handleCheckAvailability(restaurantId: string, data: any) {
  try {
    const { people, date, time } = data;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/check-availability?restaurantId=${restaurantId}&people=${people}&date=${date}&time=${time}`);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error checking availability:', error);
    return { success: false, error: 'Error al consultar disponibilidad' };
  }
}

async function handleCreateReservation(restaurantId: string, data: any) {
  try {
    const { customerName, phone, email, people, date, time, specialRequests } = data;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId,
        customerName,
        phone,
        email,
        people,
        date,
        time,
        specialRequests
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return { success: false, error: 'Error al crear reserva' };
  }
}

async function handleUpdateTableStatus(restaurantId: string, data: any) {
  try {
    const { tableId, status, reservationId, customerName, people } = data;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/tables`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId,
        tableId,
        status,
        reservationId,
        customerName,
        people
      }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating table status:', error);
    return { success: false, error: 'Error al actualizar estado de mesa' };
  }
}

async function handleGetClientInfo(restaurantId: string, data: any) {
  try {
    const { phone, name } = data;
    
    let url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/clients?restaurantId=${restaurantId}`;
    if (phone) url += `&phone=${phone}`;
    if (name) url += `&name=${name}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error getting client info:', error);
    return { success: false, error: 'Error al consultar información del cliente' };
  }
}

async function handleGetAgenda(restaurantId: string, data: any) {
  try {
    const { date } = data;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/agenda?restaurantId=${restaurantId}&date=${date}`);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error getting agenda:', error);
    return { success: false, error: 'Error al consultar agenda' };
  }
}

function extractRestaurantIdFromAgentId(agentId: string): string | null {
  // Extraer restaurant_id del agent_id
  const match = agentId.match(/rest_(\d+)/);
  return match ? `rest_${match[1]}` : null;
}