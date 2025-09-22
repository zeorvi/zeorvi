import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { realtimeSync } from '@/lib/realtimeSync';
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

    // 3. Procesar reserva con datos validados
    const result = await realtimeSync.handleRetellReservation({
      clientName,
      phone,
      email,
      date,
      time,
      people,
      tableId,
      location: tableId,
      status: 'confirmada', // Las reservas de Retell se confirman automáticamente
      notes: notes || '',
      source: 'retell'
    });

    if (result.success) {
      logger.info('Reservation created and synced via Retell', { 
        reservationId: result.reservation?.id,
        clientName,
        restaurantId,
        ip: clientIP
      });

      return createSecureResponse({
        success: true,
        reservation: result.reservation,
        message: `Reserva creada para ${clientName} el ${date} a las ${time}. Actualizado en agenda diaria, gestión de reservas, salón y todas las secciones automáticamente.`,
        dashboardUpdated: true
      });
    } else {
      throw new Error('Error en sincronización');
    }

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

// GET - Obtener reservas para Retell
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Mock data - en producción vendría de Firebase
    const reservations = [
      {
        id: 'res_001',
        clientName: 'Juan Pérez',
        phone: '+34 600 123 456',
        date: date,
        time: '20:00',
        people: 4,
        tableId: 'M5',
        status: 'confirmada'
      },
      {
        id: 'res_002',
        clientName: 'María García',
        phone: '+34 601 234 567',
        date: date,
        time: '19:30',
        people: 2,
        tableId: 'M3',
        status: 'pendiente'
      }
    ];

    // Información de mesas disponibles
    const availableTables = [
      { id: 'M1', name: 'Mesa 1', capacity: 2, location: 'Terraza', status: 'libre' },
      { id: 'M2', name: 'Mesa 2', capacity: 4, location: 'Salón Principal', status: 'libre' },
      { id: 'M4', name: 'Mesa 4', capacity: 2, location: 'Terraza', status: 'libre' },
      { id: 'M6', name: 'Mesa 6', capacity: 6, location: 'Terraza', status: 'libre' }
    ];

    return NextResponse.json({
      success: true,
      data: {
        reservations,
        availableTables,
        date,
        restaurantId,
        totalReservations: reservations.length,
        availableTablesCount: availableTables.length
      }
    });

  } catch (error) {
    logger.error('Error fetching reservations for Retell', { error });
    return NextResponse.json({ 
      error: 'Error al obtener reservas' 
    }, { status: 500 });
  }
}