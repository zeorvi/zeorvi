import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Convierte referencias de días/fechas en formato YYYY-MM-DD
 * Maneja: "hoy", "mañana", "lunes", "martes", etc.
 */
function parseRelativeDate(dateInput: string): string {
  console.log(`🔍 [parseRelativeDate] Input recibido: "${dateInput}"`);
  const normalized = dateInput.toLowerCase().trim();
  console.log(`🔍 [parseRelativeDate] Normalizado: "${normalized}"`);
  const today = new Date();
  
  // Si ya es una fecha en formato YYYY-MM-DD, devolverla
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    console.log(`✅ [parseRelativeDate] Es fecha ISO: "${normalized}"`);
    return normalized;
  }
  
  // Función para normalizar quitando acentos
  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  
  const normalizedNoAccents = removeAccents(normalized);
  console.log(`🔍 [parseRelativeDate] Normalizado sin acentos: "${normalizedNoAccents}"`);
  
  // Mapeo de días de la semana (con y sin acentos)
  const daysMap: Record<string, number> = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,   // Sin acento
    'miércoles': 3,   // Con acento
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,      // Sin acento
    'sábado': 6       // Con acento
  };
  
  // También intentar buscar la palabra exacta
  if (daysMap[normalized] !== undefined) {
    const dayIndex = daysMap[normalized];
    const currentDayIndex = today.getDay();
    const daysNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    console.log(`✅ [parseRelativeDate] Día encontrado: "${normalized}" → ${daysNames[dayIndex]}`);
    
    let daysToAdd = dayIndex - currentDayIndex;
    
    // Si el día ya pasó esta semana, ir a la próxima semana
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`✅ [parseRelativeDate] ${normalized} → ${result} (en ${daysToAdd} días)`);
    return result;
  }
  
  // Si no se encontró con acentos, intentar sin acentos
  if (daysMap[normalizedNoAccents] !== undefined) {
    const dayIndex = daysMap[normalizedNoAccents];
    const currentDayIndex = today.getDay();
    const daysNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    console.log(`✅ [parseRelativeDate] Día encontrado sin acentos: "${normalizedNoAccents}" → ${daysNames[dayIndex]}`);
    
    let daysToAdd = dayIndex - currentDayIndex;
    
    // Si el día ya pasó esta semana, ir a la próxima semana
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    const result = targetDate.toISOString().split('T')[0];
    console.log(`✅ [parseRelativeDate] ${normalizedNoAccents} → ${result} (en ${daysToAdd} días)`);
    return result;
  }
  
  // Manejar "hoy"
  if (normalized === 'hoy') {
    const result = today.toISOString().split('T')[0];
    console.log(`✅ [parseRelativeDate] Es "hoy": "${result}"`);
    return result;
  }
  
  // Manejar "mañana"
  if (normalized === 'mañana' || normalizedNoAccents === 'manana') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = tomorrow.toISOString().split('T')[0];
    console.log(`✅ [parseRelativeDate] Es "mañana": "${result}"`);
    return result;
  }
  
  // Manejar "pasado mañana"
  if (normalized === 'pasado mañana' || normalized === 'pasadomañana' || normalizedNoAccents === 'pasado manana' || normalizedNoAccents === 'pasadomanana') {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const result = dayAfterTomorrow.toISOString().split('T')[0];
    console.log(`✅ [parseRelativeDate] Es "pasado mañana": "${result}"`);
    return result;
  }
  
  // Si no se pudo parsear, devolver fecha inválida para que se maneje el error
  console.error(`❌ [parseRelativeDate] No se pudo parsear: "${dateInput}"`);
  throw new Error(`Fecha inválida: ${dateInput}`);
}

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
        try {
          console.log(`📅 Fecha recibida original: "${parameters.fecha}"`);
          const fechaParsed = parseRelativeDate(parameters.fecha);
          console.log(`📅 Fecha convertida: "${fechaParsed}"`);
          result = await GoogleSheetsService.verificarDisponibilidad(
            restaurantId,
            fechaParsed,
            parameters.hora,
            parameters.personas,
            parameters.zona
          );
        } catch (error) {
          console.error('❌ Error en parseRelativeDate:', error);
          result = {
            disponible: false,
            error: error instanceof Error ? error.message : 'Error procesando fecha',
            mensaje: 'No pude entender la fecha. Por favor, indique la fecha en formato día de la semana, "mañana", o "hoy".'
          };
        }
        break;

      case 'crear_reserva':
        try {
          console.log(`📅 [crear_reserva] Fecha recibida original: "${parameters.fecha}"`);
          const fechaParsed = parseRelativeDate(parameters.fecha);
          console.log(`📅 [crear_reserva] Fecha convertida: "${fechaParsed}"`);
          
          const reservaResult = await GoogleSheetsService.addReserva(restaurantId, {
            Fecha: fechaParsed,
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
        
          console.log(`✅ [crear_reserva] Reserva creada exitosamente:`, reservaResult);
          
          // Agregar end_call: true para que Retell cuelgue automáticamente
          result = {
            ...reservaResult,
            end_call: true,
            end_call_message: "Queda confirmada la reserva. Les esperamos en Restaurante La Gaviota. Muchas gracias."
          };
        } catch (error) {
          console.error('❌ [crear_reserva] Error:', error);
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Error procesando la reserva',
            mensaje: 'No se pudo crear la reserva. Por favor, verifique la fecha y vuelva a intentarlo.'
          };
        }
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
            // Parsear la nueva fecha si fue proporcionada
            let nuevaFecha = reservaAModificar.Fecha;
            if (parameters.nueva_fecha) {
              nuevaFecha = parseRelativeDate(parameters.nueva_fecha);
            }
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
        try {
          const fechaParsed = parseRelativeDate(parameters.fecha);
          const reservasDelDia = await GoogleSheetsService.getReservas(restaurantId);
          const reservasDelDiaFiltradas = reservasDelDia.filter(r => r.Fecha === fechaParsed);
          
          result = {
            success: true,
            reservas: reservasDelDiaFiltradas,
            total: reservasDelDiaFiltradas.length,
            mensaje: `${reservasDelDiaFiltradas.length} reservas encontradas para ${fechaParsed}`
          };
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Error procesando fecha',
            mensaje: 'No pude entender la fecha. Por favor, indique la fecha en formato día de la semana, "mañana", o "hoy".'
          };
        }
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
