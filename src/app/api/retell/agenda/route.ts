import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';

// GET - Obtener agenda del día
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Obtener datos del restaurante
    const restaurantData = await getRestaurantById(restaurantId);
    if (!restaurantData) {
      return NextResponse.json({
        success: false,
        error: 'Restaurante no encontrado'
      }, { status: 404 });
    }

    // Simular agenda del día (en producción esto vendría de la base de datos)
    const mockAgenda = [
      {
        id: 'agenda_001',
        time: '13:00',
        type: 'lunch',
        reservations: [
          {
            id: 'res_001',
            customerName: 'Carlos Ruiz',
            phone: '+34 666 111 222',
            people: 4,
            tableId: 'S2',
            tableName: 'S2',
            location: 'Salón Principal',
            status: 'confirmed',
            specialRequests: 'Mesa cerca de la ventana'
          }
        ],
        totalPeople: 4,
        availableTables: 12
      },
      {
        id: 'agenda_002',
        time: '14:00',
        type: 'lunch',
        reservations: [
          {
            id: 'res_002',
            customerName: 'Laura Sánchez',
            phone: '+34 666 333 444',
            people: 2,
            tableId: 'S3',
            tableName: 'S3',
            location: 'Salón Principal',
            status: 'confirmed',
            specialRequests: null
          },
          {
            id: 'res_003',
            customerName: 'Miguel Torres',
            phone: '+34 666 555 666',
            people: 6,
            tableId: 'T2',
            tableName: 'T2',
            location: 'Terraza',
            status: 'confirmed',
            specialRequests: 'Cumpleaños'
          }
        ],
        totalPeople: 8,
        availableTables: 10
      },
      {
        id: 'agenda_003',
        time: '20:00',
        type: 'dinner',
        reservations: [
          {
            id: 'res_004',
            customerName: 'María García',
            phone: '+34 666 123 456',
            people: 4,
            tableId: 'S1',
            tableName: 'S1',
            location: 'Salón Principal',
            status: 'confirmed',
            specialRequests: 'Sin gluten'
          },
          {
            id: 'res_005',
            customerName: 'Juan López',
            phone: '+34 666 789 012',
            people: 2,
            tableId: 'T1',
            tableName: 'T1',
            location: 'Terraza',
            status: 'confirmed',
            specialRequests: 'Mesa para fumadores'
          }
        ],
        totalPeople: 6,
        availableTables: 11
      },
      {
        id: 'agenda_004',
        time: '22:00',
        type: 'dinner',
        reservations: [
          {
            id: 'res_006',
            customerName: 'Ana Martín',
            phone: '+34 666 345 678',
            people: 6,
            tableId: 'B1',
            tableName: 'B1',
            location: 'Barra',
            status: 'confirmed',
            specialRequests: 'Celebración especial'
          }
        ],
        totalPeople: 6,
        availableTables: 12
      }
    ];

    // Calcular estadísticas del día
    const totalReservations = mockAgenda.reduce((sum, slot) => sum + slot.reservations.length, 0);
    const totalPeople = mockAgenda.reduce((sum, slot) => sum + slot.totalPeople, 0);
    const confirmedReservations = mockAgenda.reduce((sum, slot) => 
      sum + slot.reservations.filter(r => r.status === 'confirmed').length, 0
    );
    const pendingReservations = mockAgenda.reduce((sum, slot) => 
      sum + slot.reservations.filter(r => r.status === 'pending').length, 0
    );

    // Agrupar por tipo de servicio
    const lunchSlots = mockAgenda.filter(slot => slot.type === 'lunch');
    const dinnerSlots = mockAgenda.filter(slot => slot.type === 'dinner');

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name
      },
      date,
      agenda: mockAgenda,
      statistics: {
        totalReservations,
        totalPeople,
        confirmed: confirmedReservations,
        pending: pendingReservations,
        lunch: {
          slots: lunchSlots.length,
          reservations: lunchSlots.reduce((sum, slot) => sum + slot.reservations.length, 0),
          people: lunchSlots.reduce((sum, slot) => sum + slot.totalPeople, 0)
        },
        dinner: {
          slots: dinnerSlots.length,
          reservations: dinnerSlots.reduce((sum, slot) => sum + slot.reservations.length, 0),
          people: dinnerSlots.reduce((sum, slot) => sum + slot.totalPeople, 0)
        }
      },
      nextAvailableSlots: [
        { time: '13:00', available: true, type: 'lunch' },
        { time: '14:00', available: true, type: 'lunch' },
        { time: '20:00', available: true, type: 'dinner' },
        { time: '22:00', available: true, type: 'dinner' }
      ]
    });

  } catch (error) {
    console.error('Error getting agenda:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
