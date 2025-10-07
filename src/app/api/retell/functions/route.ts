import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { getRestaurantId, isValidRestaurantId } from '@/lib/retellUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Retell Functions recibido:', JSON.stringify(body, null, 2));

    const { function_name, parameters } = body;
    const restaurantId = getRestaurantId(body);

    if (!isValidRestaurantId(restaurantId)) {
      console.warn('No se pudo determinar el restaurante', { 
        metadata: body.metadata,
        data_metadata: body.data?.metadata,
        agent_id: body.agent_id
      });
      return NextResponse.json({
        success: false,
        error: 'No puedo determinar restaurantId válido. Usa metadata.restaurantId o agent_id con formato rest_XXX_agent.'
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
