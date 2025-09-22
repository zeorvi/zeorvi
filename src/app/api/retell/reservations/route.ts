import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { db } from '@/lib/database';
import { createSecureAPIMiddleware, validateAndSanitize, reservationSchema, createSecureResponse, getClientIP } from '@/lib/apiSecurity';

// POST - Crear nueva reserva desde Retell (PROTEGIDO CON SEGURIDAD ANTI-HACKEO)
const securePOST = createSecureAPIMiddleware()(async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  try {
    const body = await request.json();
    
    // 🛡️ VALIDACIÓN DE SEGURIDAD ANTI-HACKEO
    
    // 1. Validar webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    if (!validation.valid) {
      logger.warn('Invalid Retell webhook signature', { ip: clientIP, signature: signature.substring(0, 20) });
      return createSecureResponse({ error: 'Invalid webhook signature' }, 401);
    }

    // 2. Validar y sanitizar datos de entrada
    const dataValidation = validateAndSanitize(reservationSchema, {
      clientName: body.clientName,
      phone: body.phone,
      email: body.email,
      date: body.date,
      time: body.time,
      people: parseInt(body.people),
      tableId: body.tablePreference
    }, clientIP);

    if (!dataValidation.success) {
      logger.warn('Invalid reservation data', { ip: clientIP, error: dataValidation.error });
      return createSecureResponse({ error: dataValidation.error }, 400);
    }

    const validatedData = dataValidation.data;
    const { 
      clientName, 
      phone, 
      email,
      date, 
      time, 
      people, 
      tableId,
      notes,
      restaurantId 
    } = { ...validatedData, notes: body.notes, restaurantId: body.restaurantId };

    // 3. Procesar reserva con datos validados usando nuestra DB
    const reservation = await db.createReservation(restaurantId, {
      client_name: clientName,
      client_phone: phone,
      client_email: email,
      reservation_date: new Date(date),
      reservation_time: time,
      party_size: people,
      table_id: tableId ? parseInt(tableId) : undefined,
      duration_minutes: 120,
      status: 'confirmed', // Las reservas de Retell se confirman automáticamente
      notes: notes || '',
      special_requests: '',
      source: 'retell',
      source_data: { retell_call_id: body.call_id || '', confidence: body.confidence || 0 }
    });

    logger.info('Reservation created via Retell', { 
      reservationId: reservation.id,
      clientName,
      restaurantId,
      ip: clientIP
    });

    return createSecureResponse({
      success: true,
      reservation,
      message: `Reserva creada para ${clientName} el ${date} a las ${time}. Actualizado en todas las secciones automáticamente.`,
      dashboardUpdated: true
    });

  } catch (error) {
    logger.error('Error creating reservation via Retell', { 
      error: (error as Error).message,
      ip: clientIP 
    });
    return createSecureResponse({ 
      error: 'Error al crear la reserva' 
    }, 500);
  }
});

// Exportar la función protegida
export { securePOST as POST };

// GET - Obtener reservas para Retell usando nuestra DB
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Obtener reservas del día desde nuestra DB
    const reservations = await db.getReservations(restaurantId, {
      date: date,
      limit: 50
    });

    // Obtener mesas disponibles
    const allTables = await db.getTables(restaurantId);
    const availableTables = allTables.filter(table => 
      table.status === 'available' || table.status === 'reserved'
    );

    // Formatear reservas para Retell
    const formattedReservations = reservations.map(res => ({
      id: res.id.toString(),
      clientName: res.client_name,
      phone: res.client_phone || '',
      email: res.client_email || '',
      date: res.reservation_date.toISOString().split('T')[0],
      time: res.reservation_time,
      people: res.party_size,
      tableId: res.table_id?.toString() || '',
      status: res.status,
      notes: res.notes || '',
      source: res.source
    }));

    // Formatear mesas para Retell
    const formattedTables = availableTables.map(table => ({
      id: table.id.toString(),
      number: table.number,
      name: table.name || `Mesa ${table.number}`,
      capacity: table.capacity,
      location: table.location || 'Principal',
      status: table.status === 'available' ? 'libre' : 'reservada'
    }));

    return NextResponse.json({
      success: true,
      data: {
        reservations: formattedReservations,
        availableTables: formattedTables,
        date,
        restaurantId,
        totalReservations: formattedReservations.length,
        availableTablesCount: formattedTables.filter(t => t.status === 'libre').length
      }
    });

  } catch (error) {
    logger.error('Error fetching reservations for Retell', { error });
    return NextResponse.json({ 
      error: 'Error al obtener reservas' 
    }, { status: 500 });
  }
}