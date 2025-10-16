import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';
import { laGaviotaConfig, otroRestauranteConfig } from '@/lib/restaurantConfigs';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const people = parseInt(searchParams.get('people') || '0');
    const date = searchParams.get('date'); // Formato: YYYY-MM-DD
    const time = searchParams.get('time'); // Formato: HH:MM

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    if (!people || people <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Número de personas debe ser mayor a 0'
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

    // Obtener configuración de mesas
    let config;
    if (restaurantId === 'rest_003' || restaurantData.name?.toLowerCase().includes('gaviota')) {
      config = laGaviotaConfig;
    } else if (restaurantId === 'rest_001' || restaurantData.name?.toLowerCase().includes('buen sabor') || restaurantData.name?.toLowerCase().includes('parrilla')) {
      config = otroRestauranteConfig;
    }

    if (!config?.tables) {
      return NextResponse.json({
        success: false,
        error: 'No hay mesas configuradas para este restaurante'
      }, { status: 404 });
    }

    // Obtener reservas reales desde Google Sheets para la fecha solicitada
    const requestedDate = date || new Date().toISOString().split('T')[0];
    const requestedTime = time || new Date().toTimeString().split(' ')[0].substring(0, 5);
    
    console.log(`🔍 [check-availability] Verificando disponibilidad para ${people} personas el ${requestedDate} a las ${requestedTime}`);
    
    let allReservations: any[] = [];
    try {
      allReservations = await GoogleSheetsService.getReservas(restaurantId);
      console.log(`📅 [check-availability] ${allReservations.length} reservas totales obtenidas`);
    } catch (error) {
      console.error('❌ Error obteniendo reservas:', error);
    }
    
    // Filtrar reservas de la fecha solicitada (excluyendo completadas y canceladas)
    const dayReservations = allReservations.filter((reserva: any) => {
      const reservaFecha = reserva.Fecha || '';
      const reservaEstado = (reserva.Estado || '').toLowerCase().trim();
      return reservaFecha === requestedDate && 
             reservaEstado !== 'completada' && 
             reservaEstado !== 'cancelada';
    });
    
    console.log(`📊 [check-availability] ${dayReservations.length} reservas activas para ${requestedDate}`);
    
    // Función para verificar si una mesa está disponible en el horario solicitado
    const isTableAvailable = (tableId: string): boolean => {
      // Parsear hora solicitada
      const normalizedRequestedTime = requestedTime.replace('.', ':');
      const requestTimeParts = normalizedRequestedTime.split(':');
      if (requestTimeParts.length < 2) return true; // Si no se puede parsear, asumir disponible
      
      const requestHours = parseInt(requestTimeParts[0]) || 0;
      const requestMinutes = parseInt(requestTimeParts[1]) || 0;
      const requestTimeInMinutes = requestHours * 60 + requestMinutes;
      
      // Duración estimada de la nueva reserva: 2h comida, 2.5h cena
      const isDinnerTime = requestHours >= 20 || requestHours < 2;
      const estimatedDuration = isDinnerTime ? 150 : 120;
      const newReservationEndTime = requestTimeInMinutes + estimatedDuration;
      
      // Verificar conflictos con reservas existentes
      for (const reserva of dayReservations) {
        const reservaMesa = (reserva.Mesa || '').toLowerCase().trim();
        const mesaId = tableId.toLowerCase().trim();
        
        // Si la reserva es para esta mesa
        if (reservaMesa === mesaId || reservaMesa === `mesa ${mesaId}` || reservaMesa.replace(/\s+/g, '') === mesaId.replace(/\s+/g, '')) {
          // Parsear hora de la reserva existente
          const reservaHora = (reserva.Hora || '').replace('.', ':');
          const reservaTimeParts = reservaHora.split(':');
          
          if (reservaTimeParts.length >= 2) {
            const reservaHours = parseInt(reservaTimeParts[0]) || 0;
            const reservaMinutes = parseInt(reservaTimeParts[1]) || 0;
            const reservaTimeInMinutes = reservaHours * 60 + reservaMinutes;
            
            // Duración de la reserva existente
            const reservaIsDinner = reservaHours >= 20 || reservaHours < 2;
            const reservaDuration = reservaIsDinner ? 150 : 120;
            const reservaEndTime = reservaTimeInMinutes + reservaDuration;
            
            // Verificar superposición de horarios
            // Hay conflicto si:
            // 1. La nueva reserva empieza durante una reserva existente
            // 2. La nueva reserva termina durante una reserva existente
            // 3. La nueva reserva engloba completamente una reserva existente
            const hasConflict = (
              (requestTimeInMinutes >= reservaTimeInMinutes && requestTimeInMinutes < reservaEndTime) || // Empieza durante
              (newReservationEndTime > reservaTimeInMinutes && newReservationEndTime <= reservaEndTime) || // Termina durante
              (requestTimeInMinutes <= reservaTimeInMinutes && newReservationEndTime >= reservaEndTime) // Engloba
            );
            
            if (hasConflict) {
              console.log(`❌ [check-availability] Mesa ${tableId} NO disponible - Conflicto con reserva ${reserva.ID} (${reservaHora} - ${Math.floor(reservaEndTime/60)}:${(reservaEndTime%60).toString().padStart(2,'0')})`);
              return false;
            }
          }
        }
      }
      
      return true; // No hay conflictos
    };
    
    // Obtener mesas reales desde Google Sheets
    let realTables: any[] = [];
    try {
      realTables = await GoogleSheetsService.getMesas(restaurantId);
      console.log(`🪑 [check-availability] ${realTables.length} mesas obtenidas desde Google Sheets`);
    } catch (error) {
      console.error('❌ Error obteniendo mesas:', error);
      // Fallback a configuración hardcoded
      realTables = config.tables;
    }
    
    // Filtrar mesas disponibles (capacidad suficiente y sin conflictos de horario)
    const availableTables = realTables.filter((table: any) => {
      const tableCapacity = table.Capacidad || table.capacity || 0;
      const tableId = table.ID || table.id || table.name || '';
      
      const hasCapacity = tableCapacity >= people;
      const isAvailable = isTableAvailable(tableId);
      
      if (hasCapacity && !isAvailable) {
        console.log(`⏰ [check-availability] Mesa ${tableId} tiene capacidad pero está ocupada en ese horario`);
      }
      
      return hasCapacity && isAvailable;
    });

    // Agrupar por ubicación
    const tablesByLocation: { [key: string]: any[] } = {};
    availableTables.forEach((table: any) => {
      const location = table.Zona || table.location || 'Sin ubicación';
      if (!tablesByLocation[location]) {
        tablesByLocation[location] = [];
      }
      tablesByLocation[location].push(table);
    });

    // Calcular estadísticas
    const totalTables = realTables.length;
    const availableCount = availableTables.length;
    const occupiedCount = totalTables - availableCount;
    const occupancyRate = Math.round((occupiedCount / totalTables) * 100);
    
    console.log(`✅ [check-availability] ${availableCount}/${totalTables} mesas disponibles (${occupancyRate}% ocupación)`);

    // Generar respuesta estructurada
    const response = {
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name,
        status: restaurantData.status
      },
      request: {
        people,
        date: date || 'hoy',
        time: time || 'no especificado'
      },
      availability: {
        hasAvailability: availableTables.length > 0,
        availableTables: availableTables.length,
        totalTables,
        occupancyRate: `${occupancyRate}%`
      },
      tablesByLocation: Object.entries(tablesByLocation).map(([location, tables]) => ({
        location,
        count: tables.length,
        tables: tables.map(table => ({
          name: table.ID || table.name,
          capacity: table.Capacidad || table.capacity,
          status: 'available'
        }))
      })),
      recommendations: availableTables.length > 0 ? [
        `Tenemos ${availableTables.length} mesa${availableTables.length > 1 ? 's' : ''} disponible${availableTables.length > 1 ? 's' : ''} para ${people} persona${people > 1 ? 's' : ''}`,
        availableTables.length > 1 ? 'Puedo ofrecerle varias opciones de ubicación' : 'Tenemos una mesa perfecta para usted',
        '¿Le gustaría que le confirme la reserva?'
      ] : [
        `Lamentablemente no tenemos mesas disponibles para ${people} persona${people > 1 ? 's' : ''} en este momento`,
        '¿Le gustaría que le sugiera algunos horarios alternativos?',
        'También puedo tomar sus datos para contactarle si se libera alguna mesa'
      ],
      alternativeTimes: availableTables.length === 0 ? [
        '20:00 (primer turno de cena)',
        '22:00 (segundo turno de cena)',
        '13:00 (primer turno de comida)',
        '14:00 (segundo turno de comida)'
      ] : []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
