import { NextRequest, NextResponse } from 'next/server';
import { 
  getTablesByStatus, 
  updateTableStatus, 
  getTableById, 
  getRestaurantMetrics,
  completeReservationAutomatically 
} from '@/lib/restaurantData';
import { logger } from '@/lib/logger';

// GET - Consultar estado específico de mesas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'default';
    const action = searchParams.get('action'); // 'status', 'available', 'occupied', 'reserved'
    const capacity = searchParams.get('capacity');
    const location = searchParams.get('location');
    
    let resultado: any = {};
    
    switch (action) {
      case 'status':
        // Estado general de todas las mesas
        const metrics = getRestaurantMetrics();
        resultado = {
          accion: 'consulta_estado_general',
          timestamp: new Date().toISOString(),
          restaurante_id: restaurantId,
          
          resumen: {
            total_mesas: metrics.totalTables,
            libres: metrics.freeTables,
            ocupadas: metrics.occupiedTables,
            reservadas: metrics.reservedTables,
            porcentaje_ocupacion: metrics.averageOccupancy
          },
          
          mensaje_para_agente: `El restaurante tiene ${metrics.freeTables} mesa(s) libre(s) de un total de ${metrics.totalTables}. Ocupación actual: ${metrics.averageOccupancy}%.`
        };
        break;
        
      case 'available':
        // Mesas disponibles con filtros opcionales
        let mesasLibres = getTablesByStatus('libre');
        
        if (capacity) {
          const minCapacity = parseInt(capacity);
          mesasLibres = mesasLibres.filter(mesa => mesa.capacity >= minCapacity);
        }
        
        if (location) {
          mesasLibres = mesasLibres.filter(mesa => 
            mesa.location.toLowerCase().includes(location.toLowerCase())
          );
        }
        
        resultado = {
          accion: 'consulta_mesas_disponibles',
          filtros_aplicados: { capacity, location },
          
          mesas_disponibles: mesasLibres.map(mesa => ({
            id: mesa.id,
            nombre: mesa.name,
            capacidad: mesa.capacity,
            ubicacion: mesa.location,
            disponible_inmediatamente: true,
            descripcion_ubicacion: mesa.location === 'Terraza' ? 'afuera' : 
                                  mesa.location === 'Interior' ? 'adentro' : 
                                  mesa.location.toLowerCase()
          })),
          
          por_ubicacion: {
            terraza: mesasLibres.filter(m => m.location === 'Terraza').length,
            interior: mesasLibres.filter(m => m.location === 'Interior').length,
            salon_principal: mesasLibres.filter(m => m.location === 'Salón Principal').length
          },
          
          total_encontradas: mesasLibres.length,
          
          mensaje_para_agente: mesasLibres.length > 0
            ? `Encontré ${mesasLibres.length} mesa(s) disponible(s)${capacity ? ` para ${capacity} o más personas` : ''}${location ? ` en ${location}` : ''}.`
            : `No hay mesas disponibles${capacity ? ` para ${capacity} personas` : ''}${location ? ` en ${location}` : ''} en este momento.`
        };
        break;
        
      case 'occupied':
        // Mesas ocupadas con información de tiempo
        const mesasOcupadas = getTablesByStatus('ocupada');
        
        resultado = {
          accion: 'consulta_mesas_ocupadas',
          
          mesas_ocupadas: mesasOcupadas.map(mesa => {
            if (!mesa.reservation) return null;
            
            const horaReserva = mesa.reservation.time;
            const fechaReserva = new Date(mesa.reservation.date);
            const [horas, minutos] = horaReserva.split(':').map(Number);
            const tiempoLlegada = new Date(fechaReserva);
            tiempoLlegada.setHours(horas, minutos, 0, 0);
            
            const tiempoTranscurrido = new Date().getTime() - tiempoLlegada.getTime();
            const tiempoEnMinutos = Math.floor(tiempoTranscurrido / (60 * 1000));
            const tiempoRestante = 150 - tiempoEnMinutos; // 150 min = 2.5 horas
            
            return {
              id: mesa.id,
              nombre: mesa.name,
              cliente: mesa.client?.name || 'Cliente',
              telefono: mesa.client?.phone || '',
              hora_llegada: horaReserva,
              tiempo_ocupada_minutos: tiempoEnMinutos,
              tiempo_restante_minutos: Math.max(0, tiempoRestante),
              se_liberara_automaticamente: tiempoRestante <= 0,
              estado_tiempo: tiempoRestante <= 0 ? 'excedido' : 
                           tiempoRestante <= 15 ? 'critico' :
                           tiempoRestante <= 30 ? 'advertencia' : 'normal'
            };
          }).filter(Boolean),
          
          mensaje_para_agente: `Hay ${mesasOcupadas.length} mesa(s) ocupada(s). ${mesasOcupadas.filter(m => m.reservation && (150 - Math.floor((new Date().getTime() - new Date(m.reservation.date).getTime()) / (60 * 1000))) <= 30).length} se liberarán en los próximos 30 minutos.`
        };
        break;
        
      case 'reserved':
        // Mesas reservadas con información de llegada
        const mesasReservadas = getTablesByStatus('reservada');
        
        resultado = {
          accion: 'consulta_mesas_reservadas',
          
          mesas_reservadas: mesasReservadas.map(mesa => ({
            id: mesa.id,
            nombre: mesa.name,
            cliente: mesa.client?.name || 'Cliente',
            telefono: mesa.client?.phone || '',
            hora_reserva: mesa.reservation?.time || '',
            personas: mesa.reservation?.people || 0,
            estado_reserva: mesa.reservation?.status || 'pendiente',
            notas: mesa.reservation?.notes || '',
            cliente_ha_llegado: mesa.reservation?.status === 'confirmada'
          })),
          
          mensaje_para_agente: `Hay ${mesasReservadas.length} mesa(s) reservada(s). ${mesasReservadas.filter(m => m.reservation?.status === 'pendiente').length} cliente(s) aún no han llegado.`
        };
        break;
        
      default:
        // Estado completo si no se especifica acción
        const todasMesas = getTablesByStatus('all');
        resultado = {
          accion: 'consulta_completa',
          todas_las_mesas: todasMesas.map(mesa => ({
            id: mesa.id,
            nombre: mesa.name,
            capacidad: mesa.capacity,
            ubicacion: mesa.location,
            estado: mesa.status,
            cliente_actual: mesa.client?.name || null,
            telefono_cliente: mesa.client?.phone || null,
            hora_reserva: mesa.reservation?.time || null,
            personas: mesa.reservation?.people || null,
            notas: mesa.reservation?.notes || null
          }))
        };
    }
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    logger.error('Error en consulta de gestión de mesas', { error });
    return NextResponse.json(
      { error: 'Error al consultar estado de mesas' },
      { status: 500 }
    );
  }
}

// POST - Gestionar estado de mesas (liberar, ocupar, reservar)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, // 'liberar', 'ocupar', 'reservar', 'completar'
      tableId,
      clientName,
      clientPhone,
      people,
      time,
      notes,
      reason
    } = body;
    
    if (!action || !tableId) {
      return NextResponse.json(
        { error: 'action y tableId son requeridos' },
        { status: 400 }
      );
    }
    
    const mesa = getTableById(tableId);
    if (!mesa) {
      return NextResponse.json(
        { error: `Mesa ${tableId} no encontrada` },
        { status: 404 }
      );
    }
    
    let resultado: any = {};
    
    switch (action) {
      case 'liberar':
        // Liberar mesa (manual o automático)
        if (mesa.reservation) {
          const completionResult = completeReservationAutomatically(tableId);
          resultado = {
            accion: 'mesa_liberada',
            mesa_id: tableId,
            cliente_anterior: mesa.client?.name,
            razon: reason || 'Liberación manual desde Retell',
            reserva_completada: completionResult.success,
            nuevo_estado: 'libre',
            disponible_para_nuevas_reservas: true,
            mensaje_para_agente: `Mesa ${tableId} liberada correctamente. Ahora está disponible para nuevas reservas.`
          };
        } else {
          updateTableStatus(tableId, 'libre');
          resultado = {
            accion: 'mesa_liberada',
            mesa_id: tableId,
            nuevo_estado: 'libre',
            mensaje_para_agente: `Mesa ${tableId} liberada correctamente.`
          };
        }
        break;
        
      case 'ocupar':
        // Marcar mesa como ocupada
        if (!clientName) {
          return NextResponse.json(
            { error: 'clientName es requerido para ocupar mesa' },
            { status: 400 }
          );
        }
        
        const cliente = {
          id: `C${Date.now()}`,
          name: clientName,
          phone: clientPhone || '',
          totalReservations: 1,
          lastVisit: new Date()
        };
        
        const reserva = {
          id: `R${Date.now()}`,
          clientId: cliente.id,
          tableId: tableId,
          date: new Date(),
          time: time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: 150, // 2.5 horas por defecto
          people: people || 2,
          status: 'confirmada' as const,
          source: 'llamada' as const,
          notes: notes || 'Ocupación directa desde Retell',
          createdAt: new Date(),
          confirmedAt: new Date()
        };
        
        updateTableStatus(tableId, 'ocupada', cliente, reserva);
        
        resultado = {
          accion: 'mesa_ocupada',
          mesa_id: tableId,
          cliente: clientName,
          telefono: clientPhone,
          personas: people,
          hora_inicio: reserva.time,
          tiempo_limite: '2.5 horas',
          nuevo_estado: 'ocupada',
          mensaje_para_agente: `Mesa ${tableId} asignada a ${clientName} para ${people || 2} personas. Se liberará automáticamente en 2.5 horas.`
        };
        break;
        
      case 'reservar':
        // Crear reserva para mesa específica
        if (!clientName || !clientPhone || !time || !people) {
          return NextResponse.json(
            { error: 'clientName, clientPhone, time y people son requeridos para reservar' },
            { status: 400 }
          );
        }
        
        const clienteReserva = {
          id: `C${Date.now()}`,
          name: clientName,
          phone: clientPhone,
          totalReservations: 1,
          lastVisit: new Date()
        };
        
        const nuevaReserva = {
          id: `R${Date.now()}`,
          clientId: clienteReserva.id,
          tableId: tableId,
          date: new Date(),
          time: time,
          duration: 150,
          people: people,
          status: 'pendiente' as const,
          source: 'llamada' as const,
          notes: notes || 'Reserva creada desde Retell',
          createdAt: new Date()
        };
        
        updateTableStatus(tableId, 'reservada', clienteReserva, nuevaReserva);
        
        resultado = {
          accion: 'mesa_reservada',
          mesa_id: tableId,
          cliente: clientName,
          telefono: clientPhone,
          fecha: nuevaReserva.date.toLocaleDateString('es-ES'),
          hora: time,
          personas: people,
          estado_inicial: 'pendiente',
          nuevo_estado: 'reservada',
          mensaje_para_agente: `Reserva confirmada para ${clientName}, ${people} personas, ${time}. Mesa ${tableId} reservada como pendiente hasta que llegue el cliente.`
        };
        break;
        
      case 'completar':
        // Completar reserva existente
        const completionResult = completeReservationAutomatically(tableId);
        resultado = {
          accion: 'reserva_completada',
          ...completionResult,
          mesa_id: tableId,
          mensaje_para_agente: completionResult.message
        };
        break;
        
      default:
        return NextResponse.json(
          { error: `Acción '${action}' no reconocida. Acciones válidas: liberar, ocupar, reservar, completar` },
          { status: 400 }
        );
    }
    
    logger.info('Gestión de mesa desde Retell', {
      action,
      tableId,
      clientName,
      restaurantId,
      resultado: resultado.mensaje_para_agente
    });
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    logger.error('Error en gestión de mesas desde Retell', { error });
    return NextResponse.json(
      { error: 'Error al gestionar mesa' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de reserva existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tableId,
      newStatus, // 'pendiente', 'confirmada', 'cancelada', 'completada'
      reason
    } = body;
    
    if (!tableId || !newStatus) {
      return NextResponse.json(
        { error: 'tableId y newStatus son requeridos' },
        { status: 400 }
      );
    }
    
    const mesa = getTableById(tableId);
    if (!mesa) {
      return NextResponse.json(
        { error: `Mesa ${tableId} no encontrada` },
        { status: 404 }
      );
    }
    
    let nuevoEstadoMesa: 'libre' | 'ocupada' | 'reservada' = mesa.status;
    let mensaje = '';
    
    switch (newStatus) {
      case 'pendiente':
        nuevoEstadoMesa = 'reservada';
        mensaje = `Reserva de mesa ${tableId} marcada como pendiente. Cliente aún no ha llegado.`;
        break;
        
      case 'confirmada':
        nuevoEstadoMesa = 'ocupada';
        mensaje = `Cliente llegó y confirmó. Mesa ${tableId} ahora ocupada.`;
        break;
        
      case 'cancelada':
        nuevoEstadoMesa = 'libre';
        mensaje = `Reserva cancelada. Mesa ${tableId} liberada y disponible para nuevas reservas.`;
        break;
        
      case 'completada':
        nuevoEstadoMesa = 'libre';
        mensaje = `Reserva completada. Mesa ${tableId} liberada y disponible.`;
        break;
        
      default:
        return NextResponse.json(
          { error: `Estado '${newStatus}' no válido` },
          { status: 400 }
        );
    }
    
    // Actualizar estado de la mesa
    updateTableStatus(tableId, nuevoEstadoMesa, mesa.client, mesa.reservation);
    
    const resultado = {
      accion: 'estado_actualizado',
      mesa_id: tableId,
      estado_anterior: mesa.status,
      estado_nuevo: nuevoEstadoMesa,
      estado_reserva: newStatus,
      razon: reason || 'Actualización desde Retell',
      timestamp: new Date().toISOString(),
      mensaje_para_agente: mensaje
    };
    
    logger.info('Estado de reserva actualizado desde Retell', {
      tableId,
      estadoAnterior: mesa.status,
      estadoNuevo: nuevoEstadoMesa,
      estadoReserva: newStatus,
      reason
    });
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    logger.error('Error al actualizar estado de reserva desde Retell', { error });
    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    );
  }
}
