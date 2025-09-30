import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { db } from '@/lib/database';

// Funciones específicas para el agente de Retell
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { action, restaurantId, ...params } = body;

    switch (action) {
      case 'check_availability':
        return await checkAvailability(restaurantId, params);
      
      case 'create_reservation':
        return await createReservation(restaurantId, params);
      
      case 'cancel_reservation':
        return await cancelReservation(restaurantId, params);
      
      case 'find_reservation':
        return await findReservation(restaurantId, params);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in retell functions', { error: (error as Error).message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 1. Verificar disponibilidad
async function checkAvailability(restaurantId: string, params: any) {
  const { date, people, time } = params;
  
  try {
    // Si es para hoy y hora específica, verificar disponibilidad inmediata
    const today = new Date().toISOString().split('T')[0];
    if (date === today || date === 'hoy') {
      const allTables = await db.getTables(restaurantId);
      const availableTables = allTables.filter(table => 
        table.status === 'available' && table.capacity >= parseInt(people)
      );
      
      return NextResponse.json({
        success: true,
        available: availableTables.length > 0,
        message: availableTables.length > 0 
          ? `Sí, tenemos ${availableTables.length} mesa(s) disponible(s) para ${people} personas`
          : `No tenemos mesas disponibles para ${people} personas en este momento`,
        alternatives: availableTables.length === 0 ? await getAlternatives(restaurantId, people) : null
      });
    }

    // Para fechas futuras, usar smart-booking
    const existingReservations = await db.getReservations(restaurantId, {
      date: date,
      limit: 100
    });

    const allTables = await db.getTables(restaurantId);
    const peopleCount = parseInt(people);

    // Verificar disponibilidad por turno
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
        ? `Sí, tengo mesa para ${people} personas el ${date} a las ${turnoDisponible.hora}`
        : `No tengo disponibilidad para ${people} personas el ${date}`,
      alternatives: turnoDisponible ? null : await getAlternatives(restaurantId, people, date)
    });

  } catch (error) {
    logger.error('Error checking availability', { error, restaurantId, params });
    return NextResponse.json({ error: 'Error al verificar disponibilidad' }, { status: 500 });
  }
}

// 2. Crear reserva
async function createReservation(restaurantId: string, params: any) {
  const { date, time, people, clientName, phone, notes } = params;
  
  try {
    // Verificar disponibilidad antes de crear
    const availabilityCheck = await checkAvailability(restaurantId, { date, people, time });
    const availabilityData = await availabilityCheck.json();
    
    if (!availabilityData.available) {
      return NextResponse.json({
        success: false,
        error: 'No hay disponibilidad para la fecha y hora solicitada',
        alternatives: availabilityData.alternatives
      });
    }

    // Crear la reserva
    const reservationData = {
      client_name: clientName,
      client_phone: phone,
      client_email: '',
      reservation_date: new Date(date),
      reservation_time: time,
      party_size: parseInt(people),
      duration_minutes: 120,
      status: 'confirmed' as const,
      notes: notes || '',
      special_requests: '',
      source: 'retell' as const,
      source_data: { retell_call_id: params.call_id || '', confidence: params.confidence || 0 }
    };

    const reservation = await db.createReservation(restaurantId, reservationData);

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        clientName,
        date,
        time,
        people: parseInt(people),
        status: 'confirmada'
      },
      message: `Reserva confirmada para ${clientName} el ${date} a las ${time}`
    });

  } catch (error) {
    logger.error('Error creating reservation', { error, restaurantId, params });
    return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
  }
}

// 3. Buscar reserva
async function findReservation(restaurantId: string, params: any) {
  const { clientName, phone } = params;
  const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
  const client = await db.pg.connect();
  
  try {
    // Buscar por nombre y/o teléfono usando consulta SQL directa
    
    let query = `SELECT * FROM ${schemaName}.reservations WHERE 1=1`;
    const params: any[] = [];
    
    if (clientName) {
      query += ` AND client_name ILIKE $${params.length + 1}`;
      params.push(`%${clientName}%`);
    }
    
    if (phone) {
      query += ` AND client_phone ILIKE $${params.length + 1}`;
      params.push(`%${phone}%`);
    }
    
    query += ` ORDER BY reservation_date DESC LIMIT 10`;
    
    const result = await client.query(query, params);
    const reservations = result.rows;

    if (reservations.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No he encontrado ninguna reserva con esos datos'
      });
    }

    return NextResponse.json({
      success: true,
      reservations: reservations.map(res => ({
        id: res.id,
        clientName: res.client_name,
        date: res.reservation_date.toISOString().split('T')[0],
        time: res.reservation_time,
        people: res.party_size,
        status: res.status
      })),
      message: `He encontrado ${reservations.length} reserva(s)`
    });

  } catch (error) {
    logger.error('Error finding reservation', { error, restaurantId, params });
    return NextResponse.json({ error: 'Error al buscar la reserva' }, { status: 500 });
  } finally {
    client.release();
  }
}

// 4. Cancelar reserva
async function cancelReservation(restaurantId: string, params: any) {
  const { reservationId, reason } = params;
  const schemaName = `restaurant_${restaurantId.replace(/-/g, '_')}`;
  const client = await db.pg.connect();
  
  try {
    // Actualizar estado de la reserva usando consulta SQL directa
    await client.query(`
      UPDATE ${schemaName}.reservations 
      SET status = $1, notes = $2, updated_at = $3
      WHERE id = $4
    `, ['cancelled', `Cancelada por: ${reason || 'Cliente'}`, new Date(), reservationId]);

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada correctamente'
    });

  } catch (error) {
    logger.error('Error cancelling reservation', { error, restaurantId, params });
    return NextResponse.json({ error: 'Error al cancelar la reserva' }, { status: 500 });
  } finally {
    client.release();
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

