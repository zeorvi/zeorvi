import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { getRestaurantId, isValidRestaurantId } from '@/lib/retellUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Retell Functions recibido:', JSON.stringify(body, null, 2));
    console.log('🔍 Headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    console.log('🔍 URL:', request.url);
    console.log('🔍 Method:', request.method);

    // Extraer function_name de diferentes posibles formatos
    const function_name = body.function_name || body.name || body.tool_call?.function?.name;
    const parameters = body.parameters || body.arguments || body.tool_call?.function?.arguments || {};
    
    console.log('🔍 Function name extraído:', function_name);
    console.log('🔍 Parameters extraídos:', parameters);
    
    let restaurantId = getRestaurantId(body);

    // Si no se puede determinar el restaurante, intentar extraer del URL o usar rest_003 por defecto
    if (!isValidRestaurantId(restaurantId)) {
      // Intentar extraer del URL de la request
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const urlRestaurantId = pathParts.find(part => part.startsWith('rest_'));
      
      if (urlRestaurantId && isValidRestaurantId(urlRestaurantId)) {
        restaurantId = urlRestaurantId;
        console.log(`📍 RestaurantId desde URL: ${restaurantId}`);
      } else {
        console.warn('No se pudo determinar el restaurante, usando rest_003 por defecto', { 
          metadata: body.metadata,
          data_metadata: body.data?.metadata,
          agent_id: body.agent_id,
          url: request.url
        });
        restaurantId = 'rest_003'; // La Gaviota por defecto
      }
    }

    if (!function_name) {
      console.error('❌ No se encontró function_name en el request:', body);
      return NextResponse.json({
        success: false,
        error: 'No se encontró function_name en el request',
        received_body: body
      }, { status: 400 });
    }

    console.log(`🏪 Procesando función ${function_name} para restaurante ${restaurantId}`);

    let result: any;

    switch (function_name) {
      case 'verificar_disponibilidad':
        result = await GoogleSheetsService.verificarDisponibilidad(
          restaurantId,
          parameters.fecha,
          parameters.hora,
          parameters.personas,
          parameters.zona
        );
        break;

      case 'crear_reserva':
        const reservaResult = await GoogleSheetsService.addReserva(restaurantId, {
          Fecha: parameters.fecha,
          Hora: parameters.hora,
          Turno: parameters.turno || 'Cena',
          Cliente: parameters.cliente,
          Telefono: parameters.telefono,
          Personas: parameters.personas,
          Zona: parameters.zona,
          Mesa: parameters.mesa,
          Estado: 'confirmada',
          Notas: parameters.notas || ''
        });
        
        result = {
          success: reservaResult.success,
          mensaje: reservaResult.success ? 
            `Reserva confirmada para ${parameters.cliente} en mesa ${parameters.mesa}` : 
            'Error creando la reserva',
          numeroReserva: reservaResult.ID
        };
        break;

      case 'modificar_reserva':
        const updateResult = await GoogleSheetsService.updateReserva(
          restaurantId,
          parameters.ID,
          {
            Fecha: parameters.fecha,
            Hora: parameters.hora,
            Turno: parameters.turno,
            Cliente: parameters.cliente,
            Telefono: parameters.telefono,
            Personas: parameters.personas,
            Zona: parameters.zona,
            Mesa: parameters.mesa,
            Estado: parameters.estado,
            Notas: parameters.notas
          }
        );
        
        result = {
          success: updateResult.success,
          mensaje: updateResult.success ? 
            `Reserva ${parameters.ID} actualizada correctamente` : 
            'Error actualizando la reserva'
        };
        break;

      case 'cancelar_reserva':
        const cancelResult = await GoogleSheetsService.updateReserva(
          restaurantId,
          parameters.ID,
          { Estado: 'cancelada' }
        );
        
        result = {
          success: cancelResult.success,
          mensaje: cancelResult.success ? 
            `Reserva ${parameters.ID} cancelada correctamente` : 
            'Error cancelando la reserva'
        };
        break;

      case 'buscar_reserva':
        const reserva = await GoogleSheetsService.buscarReserva(
          restaurantId,
          parameters.cliente,
          parameters.telefono
        );
        
        result = {
          success: !!reserva,
          reserva: reserva,
          mensaje: reserva ? 
            `Reserva encontrada para ${parameters.cliente}` : 
            'No se encontró ninguna reserva'
        };
        break;

      case 'obtener_estadisticas':
        const estadisticas = await GoogleSheetsService.getEstadisticas(restaurantId);
        result = {
          success: true,
          estadisticas: estadisticas,
          mensaje: `Estadísticas del restaurante ${restaurantId}`
        };
        break;

      case 'consultar_reservas_dia':
        const reservas = await GoogleSheetsService.getReservas(restaurantId);
        const reservasDelDia = reservas.filter(r => r.Fecha === parameters.fecha);
        
        result = {
          success: true,
          reservas: reservasDelDia,
          total: reservasDelDia.length,
          mensaje: `${reservasDelDia.length} reservas encontradas para ${parameters.fecha}`
        };
        break;

      case 'obtener_horarios_y_dias_cerrados':
        const diasCerrados = await GoogleSheetsService.getDiasCerrados(restaurantId);
        const horarios = await GoogleSheetsService.getHorarios(restaurantId);
        
        result = {
          success: true,
          diasCerrados: diasCerrados,
          horarios: horarios,
          mensaje: `Días cerrados: ${diasCerrados.join(', ')}. Horarios disponibles.`
        };
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
      restaurantId,
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
