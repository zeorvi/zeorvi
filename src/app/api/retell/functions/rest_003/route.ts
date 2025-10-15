import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔔 Retell Functions para rest_003 recibido:', JSON.stringify(body, null, 2));

    const { function_name, parameters } = body;
    const restaurantId = 'rest_003'; // La Gaviota

    console.log(`🏪 Procesando función ${function_name} para restaurante ${restaurantId}`);

    let result: unknown;

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
        
        // Agregar end_call: true para que Retell cuelgue automáticamente
        result = {
          ...reservaResult,
          end_call: true,
          end_call_message: "Queda confirmada la reserva. Les esperamos en Restaurante La Gaviota. Muchas gracias."
        };
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
        try {
          const reservasParaCancelar = await GoogleSheetsService.getReservas(restaurantId);
          const reservaACancelar = reservasParaCancelar.find(r => 
            r.Cliente === parameters.cliente && 
            r.Telefono === parameters.telefono &&
            r.Estado.toLowerCase() !== 'cancelada'
          );
          
          if (reservaACancelar && reservaACancelar.ID) {
            // Actualizar el estado a cancelada en Google Sheets
            await GoogleSheetsService.updateReservationStatus(
              restaurantId,
              reservaACancelar.ID,
              'cancelada',
              reservaACancelar.Fecha
            );
            
            result = {
              success: true,
              mensaje: `Reserva de ${parameters.cliente} para el ${reservaACancelar.Fecha} a las ${reservaACancelar.Hora} cancelada exitosamente`,
              reserva_cancelada: {
                fecha: reservaACancelar.Fecha,
                hora: reservaACancelar.Hora,
                personas: reservaACancelar.Personas,
                mesa: reservaACancelar.Mesa
              },
              end_call: true,
              end_call_message: "Perfecto, su reserva queda cancelada. Muchas gracias por avisarnos. Que tenga un buen día."
            };
          } else {
            result = {
              success: false,
              mensaje: 'No se encontró una reserva activa para cancelar. Verifique el nombre y teléfono.'
            };
          }
        } catch (error) {
          console.error('Error en cancelar_reserva:', error);
          result = {
            success: false,
            mensaje: 'Error al cancelar la reserva',
            error: error instanceof Error ? error.message : 'Error desconocido'
          };
        }
        break;

      case 'modificar_reserva':
        try {
          // Buscar la reserva existente
          const reservasParaModificar = await GoogleSheetsService.getReservas(restaurantId);
          const reservaAModificar = reservasParaModificar.find(r => 
            r.Cliente === parameters.cliente && 
            r.Telefono === parameters.telefono &&
            r.Estado.toLowerCase() !== 'cancelada'
          );
          
          if (reservaAModificar && reservaAModificar.ID) {
            // Primero verificar disponibilidad para la nueva hora
            const nuevaFecha = parameters.nueva_fecha || reservaAModificar.Fecha;
            const nuevaHora = parameters.nueva_hora || reservaAModificar.Hora;
            const nuevasPersonas = parameters.nuevas_personas || reservaAModificar.Personas;
            
            const disponibilidad = await GoogleSheetsService.verificarDisponibilidad(
              restaurantId,
              nuevaFecha,
              nuevaHora,
              nuevasPersonas
            );
            
            if (!disponibilidad.disponible) {
              result = {
                success: false,
                mensaje: disponibilidad.mensaje || 'No hay disponibilidad para la nueva hora solicitada'
              };
              break;
            }
            
            // Cancelar la reserva anterior (cambiar estado)
            await GoogleSheetsService.updateReservationStatus(
              restaurantId,
              reservaAModificar.ID,
              'cancelada',
              reservaAModificar.Fecha
            );
            
            // Crear nueva reserva con los datos actualizados
            const nuevaReservaResult = await GoogleSheetsService.addReserva(restaurantId, {
              Fecha: nuevaFecha,
              Hora: nuevaHora,
              Turno: reservaAModificar.Turno,
              Cliente: parameters.cliente,
              Telefono: parameters.telefono,
              Personas: nuevasPersonas,
              Zona: reservaAModificar.Zona,
              Mesa: disponibilidad.mesa || '',
              Estado: 'confirmada',
              Notas: `Modificada desde ${reservaAModificar.Fecha} ${reservaAModificar.Hora}. ${parameters.notas || reservaAModificar.Notas || ''}`
            });
            
            result = {
              success: true,
              mensaje: `Reserva modificada exitosamente para ${nuevaFecha} a las ${nuevaHora}`,
              reserva_anterior: {
                fecha: reservaAModificar.Fecha,
                hora: reservaAModificar.Hora,
                personas: reservaAModificar.Personas
              },
              nueva_reserva: {
                fecha: nuevaFecha,
                hora: nuevaHora,
                personas: nuevasPersonas,
                mesa: disponibilidad.mesa
              },
              detalles_completos: nuevaReservaResult,
              end_call: true,
              end_call_message: "Perfecto, su reserva ha sido modificada. Les esperamos. Muchas gracias."
            };
          } else {
            result = {
              success: false,
              mensaje: 'No se encontró una reserva activa para modificar. Verifique el nombre y teléfono.'
            };
          }
        } catch (error) {
          console.error('Error en modificar_reserva:', error);
          result = {
            success: false,
            mensaje: 'Error al modificar la reserva',
            error: error instanceof Error ? error.message : 'Error desconocido'
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

      case 'finalizar_llamada':
        result = {
          success: true,
          end_call: true,
          mensaje: 'Llamada finalizada',
          motivo: parameters.motivo || 'completado'
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
