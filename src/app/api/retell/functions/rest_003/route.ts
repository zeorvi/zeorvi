import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Retell Functions para rest_003 recibido:', JSON.stringify(body, null, 2));

    const { function_name, parameters } = body;
    const restaurantId = 'rest_003'; // La Gaviota

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
        result = reservaResult;
        break;

      case 'buscar_reserva':
        const reservas = await GoogleSheetsService.getReservas(restaurantId);
        const reservasCliente = reservas.filter(r => 
          r.Cliente === parameters.cliente && 
          r.Telefono === parameters.telefono
        );
        result = {
          success: true,
          reservas: reservasCliente,
          total: reservasCliente.length,
          mensaje: `${reservasCliente.length} reservas encontradas para ${parameters.cliente}`
        };
        break;

      case 'cancelar_reserva':
        const reservasParaCancelar = await GoogleSheetsService.getReservas(restaurantId);
        const reservaACancelar = reservasParaCancelar.find(r => 
          r.Cliente === parameters.cliente && 
          r.Telefono === parameters.telefono
        );
        
        if (reservaACancelar) {
          result = {
            success: true,
            mensaje: `Reserva de ${parameters.cliente} cancelada exitosamente`,
            reserva: reservaACancelar
          };
        } else {
          result = {
            success: false,
            mensaje: 'No se encontró la reserva para cancelar'
          };
        }
        break;

      case 'modificar_reserva':
        const reservasParaModificar = await GoogleSheetsService.getReservas(restaurantId);
        const reservaAModificar = reservasParaModificar.find(r => 
          r.Cliente === parameters.cliente && 
          r.Telefono === parameters.telefono
        );
        
        if (reservaAModificar) {
          result = {
            success: true,
            mensaje: `Reserva de ${parameters.cliente} modificada exitosamente`,
            reserva_original: reservaAModificar,
            nueva_fecha: parameters.nueva_fecha,
            nueva_hora: parameters.nueva_hora,
            nuevas_personas: parameters.nuevas_personas
          };
        } else {
          result = {
            success: false,
            mensaje: 'No se encontró la reserva para modificar'
          };
        }
        break;

      case 'consultar_reservas_dia':
        const reservasDelDia = await GoogleSheetsService.getReservas(restaurantId);
        const reservasDelDiaFiltradas = reservasDelDia.filter(r => r.Fecha === parameters.fecha);
        
        result = {
          success: true,
          reservas: reservasDelDiaFiltradas,
          total: reservasDelDiaFiltradas.length,
          mensaje: `${reservasDelDiaFiltradas.length} reservas encontradas para ${parameters.fecha}`
        };
        break;

      case 'obtener_horarios_y_dias_cerrados':
        const diasCerrados = await GoogleSheetsService.getDiasCerrados(restaurantId);
        const horarios = await GoogleSheetsService.getHorarios(restaurantId);
        
        result = {
          success: true,
          diasCerrados,
          horarios,
          mensaje: `Días cerrados: ${diasCerrados.join(', ')}. Horarios disponibles.`
        };
        break;

      case 'transferir_llamada':
        result = {
          success: true,
          transferir: true,
          mensaje: 'Transferencia solicitada',
          motivo: parameters.motivo
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Función ${function_name} no reconocida`
        }, { status: 400 });
    }

    console.log(`✅ Función ${function_name} ejecutada exitosamente para ${restaurantId}:`, result);

    return NextResponse.json({
      success: true,
      function_name,
      restaurantId,
      result
    });

  } catch (error) {
    console.error('❌ Error en retell functions para rest_003:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
