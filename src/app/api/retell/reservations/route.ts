import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { realtimeSync } from '@/lib/realtimeSync';

// POST - Crear nueva reserva desde Retell
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar webhook de Retell
    const isValid = await verifyRetellWebhook(request, body);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { 
      clientName, 
      phone, 
      email,
      date, 
      time, 
      people, 
      tablePreference,
      notes,
      restaurantId 
    } = body;

    // Usar el sistema de sincronización para actualizar TODO el dashboard
    const result = await realtimeSync.handleRetellReservation({
      clientName,
      phone,
      email,
      date,
      time,
      people: parseInt(people),
      tableId: tablePreference,
      location: tablePreference,
      status: 'confirmada', // Las reservas de Retell se confirman automáticamente
      notes: notes || '',
      source: 'retell'
    });

    if (result.success) {
      logger.info('Reservation created and synced via Retell', { 
        reservationId: result.reservation?.id,
        clientName,
        restaurantId 
      });

      return NextResponse.json({
        success: true,
        reservation: result.reservation,
        message: `Reserva creada para ${clientName} el ${date} a las ${time}. Actualizado en agenda diaria, gestión de reservas, salón y todas las secciones automáticamente.`,
        dashboardUpdated: true
      });
    } else {
      throw new Error('Error en sincronización');
    }

  } catch (error) {
    logger.error('Error creating reservation via Retell', { error });
    return NextResponse.json({ 
      error: 'Error al crear la reserva' 
    }, { status: 500 });
  }
}

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