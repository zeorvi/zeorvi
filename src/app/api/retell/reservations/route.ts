import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';

// GET - Listar reservas del restaurante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

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

    // Simular reservas (en producción esto vendría de la base de datos)
    const mockReservations = [
      {
        id: 'res_001',
        customerName: 'María García',
        phone: '+34 666 123 456',
        email: 'maria@email.com',
        people: 4,
        date: '2024-01-15',
        time: '20:00',
        status: 'confirmed',
        tableId: 'S1',
        tableName: 'S1',
        location: 'Salón Principal',
        specialRequests: 'Sin gluten',
        createdAt: '2024-01-14T10:30:00Z',
        updatedAt: '2024-01-14T10:30:00Z'
      },
      {
        id: 'res_002',
        customerName: 'Juan López',
        phone: '+34 666 789 012',
        email: 'juan@email.com',
        people: 2,
        date: '2024-01-15',
        time: '20:00',
        status: 'pending',
        tableId: null,
        tableName: null,
        location: null,
        specialRequests: 'Mesa cerca de la ventana',
        createdAt: '2024-01-14T11:15:00Z',
        updatedAt: '2024-01-14T11:15:00Z'
      },
      {
        id: 'res_003',
        customerName: 'Ana Martín',
        phone: '+34 666 345 678',
        email: 'ana@email.com',
        people: 6,
        date: '2024-01-15',
        time: '22:00',
        status: 'confirmed',
        tableId: 'T1',
        tableName: 'T1',
        location: 'Terraza',
        specialRequests: 'Cumpleaños',
        createdAt: '2024-01-14T09:45:00Z',
        updatedAt: '2024-01-14T09:45:00Z'
      }
    ];

    // Filtrar por fecha si se especifica
    let filteredReservations = mockReservations;
    if (date) {
      filteredReservations = mockReservations.filter(r => r.date === date);
    }

    // Filtrar por estado si se especifica
    if (status) {
      filteredReservations = filteredReservations.filter(r => r.status === status);
    }

    // Agrupar por hora
    const reservationsByTime = filteredReservations.reduce((acc: any, reservation) => {
      const time = reservation.time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(reservation);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name
      },
      filters: {
        date: date || 'todas las fechas',
        status: status || 'todos los estados'
      },
      reservations: filteredReservations,
      reservationsByTime,
      summary: {
        total: filteredReservations.length,
        confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
        pending: filteredReservations.filter(r => r.status === 'pending').length,
        cancelled: filteredReservations.filter(r => r.status === 'cancelled').length
      }
    });

  } catch (error) {
    console.error('Error getting reservations:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      restaurantId, 
      customerName, 
      phone, 
      email, 
      people, 
      date, 
      time, 
      specialRequests,
      tableId 
    } = body;

    if (!restaurantId || !customerName || !phone || !people || !date || !time) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: restaurantId, customerName, phone, people, date, time'
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

    // Generar ID único para la reserva
    const reservationId = `res_${Date.now()}`;

    // Crear la reserva
    const newReservation = {
      id: reservationId,
      customerName,
      phone,
      email: email || null,
      people: parseInt(people),
      date,
      time,
      status: 'confirmed', // Las reservas se crean como confirmadas
      tableId: tableId || null,
      tableName: tableId || null,
      location: null, // Se asignará cuando se asigne mesa
      specialRequests: specialRequests || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // En producción aquí se guardaría en la base de datos
    console.log('Nueva reserva creada:', newReservation);

    return NextResponse.json({
      success: true,
      reservation: newReservation,
      message: `Reserva confirmada para ${customerName} - ${people} persona${people > 1 ? 's' : ''} el ${date} a las ${time}`
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}