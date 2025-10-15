import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { db } from '@/lib/database';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener opciones de reserva inteligente
export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date');
    const people = searchParams.get('people');
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Obtener datos reales de la base de datos
    const requestedDate = date || new Date().toISOString().split('T')[0];
    const peopleCount = parseInt(people || '2');

    // Obtener todas las mesas del restaurante
    const allTables = await db.getTables(restaurantId);
    
    // Obtener reservas existentes para la fecha solicitada
    const existingReservations = await db.getReservations(restaurantId, {
      date: requestedDate,
      limit: 100
    });

    // Calcular disponibilidad por turno
    const turnos = [
      { hora: '13:00', nombre: 'Primer turno almuerzo', horario: '13:00 - 15:00' },
      { hora: '14:00', nombre: 'Segundo turno almuerzo', horario: '14:00 - 16:00' },
      { hora: '20:00', nombre: 'Primer turno cena', horario: '20:00 - 22:00' },
      { hora: '22:00', nombre: 'Segundo turno cena', horario: '22:00 - 23:30' }
    ];

    const disponibilidad = turnos.map(turno => {
      // Contar reservas existentes en este turno
      const reservasEnTurno = existingReservations.filter(res => 
        res.reservation_time === turno.hora
      );

      // Contar mesas disponibles para el número de personas
      const mesasDisponibles = allTables.filter(table => 
        table.status === 'available' && table.capacity >= peopleCount
      ).length;

      // Verificar si puede acomodar el grupo
      const puedeAcomodar = mesasDisponibles > 0;

      return {
        hora: turno.hora,
        nombre: turno.nombre,
        horario_completo: turno.horario,
        reservas_actuales: reservasEnTurno.length,
        mesas_disponibles: mesasDisponibles,
        puede_acomodar_grupo: puedeAcomodar,
        disponible: puedeAcomodar
      };
    });

    // Encontrar la mejor opción
    const mejoresOpciones = disponibilidad
      .filter(t => t.disponible)
      .sort((a, b) => a.mesas_disponibles - b.mesas_disponibles);

    const mejorOpcion = mejoresOpciones[0];
    const totalMesasDisponibles = disponibilidad.reduce((sum, t) => sum + t.mesas_disponibles, 0);

    const options = {
      fecha: requestedDate,
      restaurante_id: restaurantId,
      personas_solicitadas: peopleCount,
      comida: {
        primer_turno_13: disponibilidad.find(t => t.hora === '13:00'),
        segundo_turno_14: disponibilidad.find(t => t.hora === '14:00')
      },
      cena: {
        primer_turno_20: disponibilidad.find(t => t.hora === '20:00'),
        segundo_turno_22: disponibilidad.find(t => t.hora === '22:00')
      },
      resumen: {
        total_mesas_disponibles: totalMesasDisponibles,
        mejor_opcion: mejorOpcion ? `${mejorOpcion.hora}` : null,
        recomendacion: mejorOpcion 
          ? `Recomendamos ${mejorOpcion.nombre} a las ${mejorOpcion.hora}`
          : 'No hay disponibilidad para la fecha solicitada'
      }
    };

    return NextResponse.json({
      success: true,
      data: options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching smart booking options', {
      error: (error as Error).message,
      restaurantId: restaurantId || 'unknown',
      action: 'GET_smart_booking'
    });
    return NextResponse.json({
      error: 'Error al obtener opciones de reserva inteligente'
    }, { status: 500 });
  }
}

// POST - Procesar reserva inteligente
export async function POST(request: NextRequest) {
  let body: any = {};
  
  try {
    body = await request.json();

    // Validar webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { restaurantId, date, people, preferredTime, clientInfo } = body;

    if (!restaurantId || !date || !people) {
      return NextResponse.json({
        error: 'Restaurant ID, fecha y número de personas son requeridos'
      }, { status: 400 });
    }

    // Crear reserva real en la base de datos
    const reservationData = {
      client_name: clientInfo?.name || 'Cliente Retell',
      client_phone: clientInfo?.phone || '',
      client_email: clientInfo?.email || '',
      reservation_date: new Date(date),
      reservation_time: preferredTime || '14:00',
      party_size: parseInt(people),
      duration_minutes: 120,
      status: 'confirmed' as const,
      notes: clientInfo?.notes || '',
      special_requests: clientInfo?.specialRequests || '',
      source: 'retell' as const,
      source_data: { retell_call_id: body.call_id || '', confidence: body.confidence || 0 }
    };

    const reservation = await db.createReservation(restaurantId, reservationData);

    const bookingResult = {
      reservationId: reservation.id,
      restaurantId,
      date,
      people: parseInt(people),
      time: preferredTime || '14:00',
      status: 'confirmada',
      clientInfo,
      assignedTable: reservation.table_id || 'Por asignar',
      createdAt: reservation.created_at?.toISOString() || new Date().toISOString()
    };

    logger.info('Smart booking processed via Retell', {
      reservationId: bookingResult.reservationId,
      restaurantId,
      people,
      time: bookingResult.time
    });

    return NextResponse.json({
      success: true,
      reservation: bookingResult,
      message: 'Reserva inteligente procesada correctamente'
    });

  } catch (error) {
    logger.error('Error processing smart booking via Retell', {
      error: (error as Error).message,
      restaurantId: body?.restaurantId || 'unknown',
      action: 'POST_smart_booking'
    });
    return NextResponse.json({
      error: 'Error al procesar reserva inteligente'
    }, { status: 500 });
  }
}





