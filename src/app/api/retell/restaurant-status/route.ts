import { NextRequest, NextResponse } from 'next/server';
import { getTablesByStatus, getRestaurantMetrics, getReservationsByDate } from '@/lib/restaurantData';
import { logger } from '@/lib/logger';

// GET - Obtener estado completo del restaurante para Retell
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'default';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // Obtener todas las mesas por estado
    const mesasLibres = getTablesByStatus('libre');
    const mesasOcupadas = getTablesByStatus('ocupada');
    const mesasReservadas = getTablesByStatus('reservada');
    const todasLasMesas = getTablesByStatus('all');
    
    // Obtener métricas del restaurante
    const metrics = getRestaurantMetrics();
    
    // Obtener reservas del día
    const reservasHoy = getReservationsByDate(new Date(date));
    
    // Analizar disponibilidad por turnos
    const turnos = {
      almuerzo: {
        primer_turno: { horario: '13:00-15:00', disponible: true, mesas_libres: 0 },
        segundo_turno: { horario: '14:00-16:00', disponible: true, mesas_libres: 0 }
      },
      cena: {
        primer_turno: { horario: '20:00-22:00', disponible: true, mesas_libres: 0 },
        segundo_turno: { horario: '22:00-23:30', disponible: true, mesas_libres: 0 }
      }
    };
    
    // Calcular disponibilidad por turno
    ['13:00', '14:00', '20:00', '22:00'].forEach(hora => {
      const reservasEnHora = reservasHoy.filter(r => r.time === hora && r.status !== 'cancelada');
      const mesasDisponibles = todasLasMesas.length - reservasEnHora.length;
      
      if (hora === '13:00') {
        turnos.almuerzo.primer_turno.mesas_libres = mesasDisponibles;
        turnos.almuerzo.primer_turno.disponible = mesasDisponibles > 0;
      } else if (hora === '14:00') {
        turnos.almuerzo.segundo_turno.mesas_libres = mesasDisponibles;
        turnos.almuerzo.segundo_turno.disponible = mesasDisponibles > 0;
      } else if (hora === '20:00') {
        turnos.cena.primer_turno.mesas_libres = mesasDisponibles;
        turnos.cena.primer_turno.disponible = mesasDisponibles > 0;
      } else if (hora === '22:00') {
        turnos.cena.segundo_turno.mesas_libres = mesasDisponibles;
        turnos.cena.segundo_turno.disponible = mesasDisponibles > 0;
      }
    });
    
    // Respuesta estructurada para Retell
    const response = {
      restaurante: {
        id: restaurantId,
        fecha_consulta: date,
        estado_general: {
          total_mesas: metrics.totalTables,
          mesas_libres: metrics.freeTables,
          mesas_ocupadas: metrics.occupiedTables,
          mesas_reservadas: metrics.reservedTables,
          ocupacion_porcentaje: metrics.averageOccupancy
        }
      },
      
      mesas_por_estado: {
        libres: mesasLibres.map(mesa => ({
          id: mesa.id,
          nombre: mesa.name,
          capacidad: mesa.capacity,
          ubicacion: mesa.location,
          disponible_para_reserva: true
        })),
        
        ocupadas: mesasOcupadas.map(mesa => ({
          id: mesa.id,
          nombre: mesa.name,
          capacidad: mesa.capacity,
          ubicacion: mesa.location,
          cliente: mesa.client?.name || 'Cliente',
          telefono: mesa.client?.phone || '',
          tiempo_ocupada: mesa.reservation?.duration || 120,
          hora_reserva: mesa.reservation?.time || ''
        })),
        
        reservadas: mesasReservadas.map(mesa => ({
          id: mesa.id,
          nombre: mesa.name,
          capacidad: mesa.capacity,
          ubicacion: mesa.location,
          cliente: mesa.client?.name || 'Cliente',
          telefono: mesa.client?.phone || '',
          hora_reserva: mesa.reservation?.time || '',
          personas: mesa.reservation?.people || 0,
          estado_reserva: mesa.reservation?.status || 'pendiente',
          notas: mesa.reservation?.notes || ''
        }))
      },
      
      turnos_disponibilidad: turnos,
      
      reservas_hoy: {
        total: reservasHoy.length,
        por_estado: {
          pendientes: reservasHoy.filter(r => r.status === 'pendiente').length,
          confirmadas: reservasHoy.filter(r => r.status === 'confirmada').length,
          canceladas: reservasHoy.filter(r => r.status === 'cancelada').length,
          completadas: reservasHoy.filter(r => r.status === 'completada').length
        },
        por_turno: {
          almuerzo_13: reservasHoy.filter(r => r.time === '13:00' && r.status !== 'cancelada').length,
          almuerzo_14: reservasHoy.filter(r => r.time === '14:00' && r.status !== 'cancelada').length,
          cena_20: reservasHoy.filter(r => r.time === '20:00' && r.status !== 'cancelada').length,
          cena_22: reservasHoy.filter(r => r.time === '22:00' && r.status !== 'cancelada').length
        }
      },
      
      recomendaciones_para_retell: {
        turno_menos_ocupado: (() => {
          const ocupacionTurnos = [
            { turno: 'almuerzo 13:00', ocupadas: reservasHoy.filter(r => r.time === '13:00' && r.status !== 'cancelada').length },
            { turno: 'almuerzo 14:00', ocupadas: reservasHoy.filter(r => r.time === '14:00' && r.status !== 'cancelada').length },
            { turno: 'cena 20:00', ocupadas: reservasHoy.filter(r => r.time === '20:00' && r.status !== 'cancelada').length },
            { turno: 'cena 22:00', ocupadas: reservasHoy.filter(r => r.time === '22:00' && r.status !== 'cancelada').length }
          ];
          return ocupacionTurnos.sort((a, b) => a.ocupadas - b.ocupadas)[0];
        })(),
        
        capacidades_disponibles: mesasLibres.reduce((acc, mesa) => {
          acc[mesa.capacity] = (acc[mesa.capacity] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        
        ubicaciones_disponibles: mesasLibres.reduce((acc, mesa) => {
          acc[mesa.location] = (acc[mesa.location] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
    
    logger.info('Estado del restaurante consultado por Retell', {
      restaurantId,
      date,
      totalMesas: metrics.totalTables,
      mesasLibres: metrics.freeTables
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('Error al obtener estado del restaurante para Retell', { error });
    return NextResponse.json(
      { error: 'Error al consultar estado del restaurante' },
      { status: 500 }
    );
  }
}
