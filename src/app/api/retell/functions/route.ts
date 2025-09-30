import { NextRequest, NextResponse } from 'next/server';
import { RetellGoogleSheetsFunctions } from '@/lib/retellGoogleSheetsFunctions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Retell Functions recibido:', JSON.stringify(body, null, 2));

    const { function_name, parameters, agent_id, call_id } = body;

    // Extraer información del restaurante del agent_id
    const restaurantId = extractRestaurantIdFromAgentId(agent_id);
    const restaurantName = getRestaurantNameFromAgentId(agent_id);

    if (!restaurantId || !restaurantName) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo identificar el restaurante del agent ID'
      }, { status: 400 });
    }

    // Obtener spreadsheet ID del restaurante
    const spreadsheetId = `spreadsheet_${restaurantId}`;

    console.log(`🏪 Procesando función ${function_name} para restaurante ${restaurantId}`);

    let result: any;

    switch (function_name) {
      case 'verificar_disponibilidad':
        result = await RetellGoogleSheetsFunctions.verificarDisponibilidad(
          {
            fecha: parameters.fecha,
            hora: parameters.hora,
            personas: parameters.personas
          },
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        break;

      case 'crear_reserva':
        result = await RetellGoogleSheetsFunctions.crearReserva(
          {
            fecha: parameters.fecha,
            hora: parameters.hora,
            cliente: parameters.cliente,
            telefono: parameters.telefono,
            personas: parameters.personas,
            notas: parameters.notas || ''
          },
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        break;

      case 'buscar_reserva':
        result = await RetellGoogleSheetsFunctions.buscarReserva(
          {
            cliente: parameters.cliente,
            telefono: parameters.telefono
          },
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        break;

      case 'cancelar_reserva':
        result = await RetellGoogleSheetsFunctions.cancelarReserva(
          {
            cliente: parameters.cliente,
            telefono: parameters.telefono
          },
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        break;

      case 'obtener_reservas_hoy':
        const reservasHoy = await RetellGoogleSheetsFunctions.obtenerReservasHoy(
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        result = {
          reservas: reservasHoy,
          total: reservasHoy.length
        };
        break;

      case 'obtener_estadisticas':
        const estadisticas = await RetellGoogleSheetsFunctions.obtenerEstadisticas(
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        result = estadisticas;
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Función ${function_name} no reconocida`
        }, { status: 400 });
    }

    console.log(`✅ Función ${function_name} ejecutada exitosamente:`, result);

    return NextResponse.json({
      success: true,
      function_name,
      result
    });

  } catch (error) {
    console.error('❌ Error en Retell Functions:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

function extractRestaurantIdFromAgentId(agentId: string): string | null {
  // Extraer restaurant_id del agent_id
  // Formato esperado: "rest_003_agent" o similar
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
