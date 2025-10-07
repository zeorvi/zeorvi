import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { sqliteDb } from '@/lib/database/sqlite';
import { productionDb } from '@/lib/database/production';
import { occupancyPredictor } from '@/lib/occupancyPredictor';

// GET - Obtener estado completo del restaurante para el agente de IA
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Obtener datos del restaurante usando SQLite
    const restaurantData = await sqliteDb.getRestaurant(restaurantId);
    if (!restaurantData) {
      return NextResponse.json({
        success: false,
        error: 'Restaurante no encontrado'
      }, { status: 404 });
    }

    // Obtener datos reales de la base de datos
    const [tableStates, schedule, metrics, reservations] = await Promise.all([
      productionDb.getTableStates(restaurantId),
      productionDb.getRestaurantSchedule(restaurantId),
      productionDb.getCurrentMetrics(restaurantId),
      productionDb.getReservations(restaurantId, new Date().toISOString().split('T')[0])
    ]);

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Verificar si el restaurante está abierto
    const todaySchedule = schedule.find(s => s.dayOfWeek === currentDay);
    const isCurrentlyOpen = todaySchedule?.isOpen && 
      todaySchedule.openingTime && 
      todaySchedule.closingTime &&
      currentHour >= parseInt(todaySchedule.openingTime.split(':')[0]) &&
      currentHour < parseInt(todaySchedule.closingTime.split(':')[0]);

    // Calcular disponibilidad por capacidad
    const availabilityByCapacity = {
      para2Personas: tableStates.filter(t => t.status === 'libre' && t.capacity >= 2).length,
      para4Personas: tableStates.filter(t => t.status === 'libre' && t.capacity >= 4).length,
      para6Personas: tableStates.filter(t => t.status === 'libre' && t.capacity >= 6).length,
      para8Personas: tableStates.filter(t => t.status === 'libre' && t.capacity >= 8).length,
    };

    // Obtener ubicaciones únicas
    const ubicaciones = Array.from(new Set(tableStates.map(t => t.location)));
    const mesasPorUbicacion = ubicaciones.reduce((acc: any, loc) => {
      const tablesInLoc = tableStates.filter(t => t.location === loc);
      acc[loc] = {
        total: tablesInLoc.length,
        libres: tablesInLoc.filter(t => t.status === 'libre').length,
        ocupadas: tablesInLoc.filter(t => t.status === 'ocupada').length,
        reservadas: tablesInLoc.filter(t => t.status === 'reservada').length,
      };
      return acc;
    }, {});

    // Generar predicciones para las próximas horas
    const predictions = [];
    for (let hour = currentHour; hour <= 23; hour++) {
      try {
        const prediction = await occupancyPredictor.predictOccupancy(restaurantId, now, hour);
        predictions.push({
          hora: `${hour}:00`,
          ocupacionPredicha: prediction.predictedOccupancy,
          confianza: prediction.confidenceScore,
          recomendaciones: prediction.recommendations
        });
      } catch (error) {
        logger.error(`Error predicting for hour ${hour}:`, error);
      }
    }

    // Generar recomendaciones
    const recommendations = [];
    if (metrics.occupancyRate > 80) {
      recommendations.push('Alta ocupación actual - considera reservas con anticipación');
    } else if (metrics.occupancyRate < 30) {
      recommendations.push('Baja ocupación actual - ideal para nuevas reservas');
    }

    if (availabilityByCapacity.para2Personas === 0) {
      recommendations.push('No hay mesas disponibles para 2 personas');
    }
    if (availabilityByCapacity.para4Personas === 0) {
      recommendations.push('No hay mesas disponibles para 4 personas');
    }

    // Crear respuesta completa
    const dashboardInfo = {
      restaurante: {
        id: restaurantId,
        nombre: restaurantData.name,
        tipo: 'Restaurante',
        telefono: restaurantData.phone,
        email: restaurantData.owner_email,
        direccion: restaurantData.address,
      },
      estadoActual: {
        estaAbierto: isCurrentlyOpen,
        diaActual: currentDay,
        horaActual: `${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute}`,
        fechaActual: now.toLocaleDateString('es-ES'),
      },
      horario: {
        diasAbierto: schedule.filter(s => s.isOpen).map(s => s.dayOfWeek),
        horarios: schedule.reduce((acc: any, s) => {
          acc[s.dayOfWeek] = s.isOpen && s.openingTime && s.closingTime 
            ? `${s.openingTime} - ${s.closingTime}` 
            : 'Cerrado';
          return acc;
        }, {}),
        proximoCierre: todaySchedule?.closingTime || 'No disponible',
      },
      mesas: {
        total: metrics.totalTables,
        porEstado: {
          libres: metrics.freeTables,
          ocupadas: metrics.occupiedTables,
          reservadas: metrics.reservedTables,
          ocupadoTodoDia: tableStates.filter(t => t.status === 'ocupado_todo_dia').length,
        },
        porcentajeOcupacion: metrics.occupancyRate,
        detalleMesas: tableStates.map(t => ({
          nombre: t.tableName,
          capacidad: t.capacity,
          ubicacion: t.location,
          estado: t.status,
          cliente: t.clientName || null,
          telefono: t.clientPhone || null,
          personas: t.partySize || null,
          ultimaActualizacion: t.lastUpdated.toISOString(),
        })),
      },
      disponibilidad: availabilityByCapacity,
      ubicaciones: {
        total: ubicaciones.length,
        lista: ubicaciones,
        mesasPorUbicacion,
      },
      reservas: {
        totalHoy: reservations.length,
        confirmadas: reservations.filter(r => r.status === 'confirmada').length,
        pendientes: reservations.filter(r => r.status === 'pendiente').length,
        proximasReservas: reservations
          .filter(r => r.status === 'confirmada')
          .sort((a, b) => new Date(`${a.reservationDate} ${a.reservationTime}`).getTime() - new Date(`${b.reservationDate} ${b.reservationTime}`).getTime())
          .slice(0, 5)
          .map(r => ({
            cliente: r.clientName,
            telefono: r.clientPhone,
            personas: r.partySize,
            hora: r.reservationTime,
            mesa: r.tableId || 'Por asignar',
            estado: r.status
          }))
      },
      predicciones: {
        proximasHoras: predictions,
        tendencia: predictions.length > 0 ? 
          (predictions[predictions.length - 1].ocupacionPredicha > predictions[0].ocupacionPredicha ? 'creciente' : 'decreciente') : 
          'estable'
      },
      recomendaciones: recommendations,
      puedeReservar: isCurrentlyOpen && metrics.freeTables > 0,
      capacidadMaxima: Math.max(...tableStates.map(t => t.capacity)),
    };

    logger.info('Restaurant status provided to Retell', { 
      restaurantId, 
      totalTables: metrics.totalTables,
      occupancyRate: metrics.occupancyRate,
      isOpen: isCurrentlyOpen 
    });

    return NextResponse.json({
      success: true,
      data: dashboardInfo,
      timestamp: now.toISOString(),
      message: 'Información completa del estado del restaurante disponible para el agente'
    });

  } catch (error) {
    logger.error('Error providing restaurant status to Retell', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el estado del restaurante'
    }, { status: 500 });
  }
}