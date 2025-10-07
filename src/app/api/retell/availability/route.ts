import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { db } from '@/lib/database';

// POST - Verificar disponibilidad (mesas libres ahora o por fecha)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, date, people, time } = body;
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    const peopleCount = parseInt(people || '2');

    // Determinar si es verificación inmediata o por fecha
    const today = new Date().toISOString().split('T')[0];
    const isImmediateCheck = !date || date === 'hoy' || date === today;

    // Obtener todas las mesas del restaurante
    const allTables = await db.getTables(restaurantId);
    
    if (isImmediateCheck) {
      // Verificación inmediata (mesas libres ahora)
      const availableTables = allTables.filter(table => 
        table.status === 'available' && table.capacity >= peopleCount
      );

      const canAccommodateNow = availableTables.length > 0;
      // const bestTableOption = availableTables.find(table => table.capacity === peopleCount) || 
      //   availableTables.find(table => table.capacity > peopleCount);

      return NextResponse.json({
        success: true,
        available: canAccommodateNow,
        message: canAccommodateNow 
          ? `¡Sí! Tenemos ${availableTables.length} mesa(s) disponible(s) para ${peopleCount} personas ahora mismo.`
          : `Lo siento, no tenemos mesas disponibles para ${peopleCount} personas en este momento.`,
        alternatives: canAccommodateNow ? null : await getAlternatives(restaurantId, peopleCount)
      });
    }

    // Verificación por fecha específica
    const requestedDate = date || today;
    const existingReservations = await db.getReservations(restaurantId, {
      date: requestedDate,
      limit: 100
    });

    // Verificar disponibilidad por turno si se especifica hora
    if (time) {
      const reservasEnTurno = existingReservations.filter(res => res.reservation_time === time);
      const mesasDisponibles = allTables.filter(table => 
        table.status === 'available' && table.capacity >= peopleCount
      ).length;
      
      const disponible = mesasDisponibles > reservasEnTurno.length;
      
      return NextResponse.json({
        success: true,
        available: disponible,
        message: disponible 
          ? `Sí, tengo mesa para ${peopleCount} personas el ${requestedDate} a las ${time}`
          : `No tengo disponibilidad para ${peopleCount} personas el ${requestedDate} a las ${time}`,
        alternatives: disponible ? null : await getAlternatives(restaurantId, peopleCount, requestedDate)
      });
    }

    // Verificar disponibilidad general para el día
    const turnos = ['13:00', '14:30', '20:00', '22:00'];
    const disponibilidad = turnos.map(hora => {
      const reservasEnTurno = existingReservations.filter(res => res.reservation_time === hora);
      const mesasDisponibles = allTables.filter(table => 
        table.status === 'available' && table.capacity >= peopleCount
      ).length;
      
      return {
        hora,
        disponible: mesasDisponibles > reservasEnTurno.length,
        mesas_libres: Math.max(0, mesasDisponibles - reservasEnTurno.length)
      };
    });

    const turnoDisponible = disponibilidad.find(t => t.disponible);
    
    return NextResponse.json({
      success: true,
      available: !!turnoDisponible,
      message: turnoDisponible 
        ? `Sí, tengo mesa para ${peopleCount} personas el ${requestedDate} a las ${turnoDisponible.hora}`
        : `No tengo disponibilidad para ${peopleCount} personas el ${requestedDate}`,
      alternatives: turnoDisponible ? null : await getAlternatives(restaurantId, peopleCount, requestedDate)
    });

  } catch (error) {
    logger.error('Error checking availability', {
      error: (error as Error).message,
      restaurantId: 'unknown'
    });
    
    return NextResponse.json({
      error: 'Error al verificar disponibilidad'
    }, { status: 500 });
  }
}

// Función auxiliar para obtener alternativas
async function getAlternatives(restaurantId: string, people: number, excludeDate?: string) {
  try {
    const allTables = await db.getTables(restaurantId);
    const availableTables = allTables.filter(table => 
      table.status === 'available' && table.capacity >= people
    );

    if (availableTables.length > 0) {
      return {
        message: `Pero tengo disponibilidad para ${people} personas en otros horarios`,
        suggestions: ['14:30', '20:00', '22:00'].filter(time => time !== excludeDate)
      };
    }

    return {
      message: `No tengo disponibilidad para ${people} personas en ningún horario`,
      suggestions: ['Revisar para mañana', 'Grupo más pequeño', 'Lista de espera']
    };

  } catch (error) {
    return {
      message: 'No puedo verificar alternativas en este momento',
      suggestions: ['Intentar más tarde', 'Llamar al restaurante directamente']
    };
  }
}
