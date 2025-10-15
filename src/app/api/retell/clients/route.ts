import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/database/sqlite';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener información de clientes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');

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

    // Simular base de datos de clientes (en producción esto vendría de la base de datos)
    const mockClients = [
      {
        id: 'client_001',
        name: 'María García',
        phone: '+34 666 123 456',
        email: 'maria@email.com',
        totalReservations: 12,
        lastVisit: '2024-01-10',
        favoriteTable: 'S1',
        preferences: {
          location: 'Salón Principal',
          time: '20:00',
          specialRequests: 'Sin gluten'
        },
        notes: 'Cliente VIP, siempre pide mesa cerca de la ventana',
        createdAt: '2023-06-15T10:30:00Z'
      },
      {
        id: 'client_002',
        name: 'Juan López',
        phone: '+34 666 789 012',
        email: 'juan@email.com',
        totalReservations: 8,
        lastVisit: '2024-01-12',
        favoriteTable: 'T1',
        preferences: {
          location: 'Terraza',
          time: '22:00',
          specialRequests: 'Mesa para fumadores'
        },
        notes: 'Prefiere terraza, viene con frecuencia los viernes',
        createdAt: '2023-08-20T14:15:00Z'
      },
      {
        id: 'client_003',
        name: 'Ana Martín',
        phone: '+34 666 345 678',
        email: 'ana@email.com',
        totalReservations: 25,
        lastVisit: '2024-01-14',
        favoriteTable: 'B1',
        preferences: {
          location: 'Barra',
          time: '19:30',
          specialRequests: 'Cumpleaños'
        },
        notes: 'Cliente frecuente, celebra cumpleaños aquí cada año',
        createdAt: '2023-03-10T09:45:00Z'
      }
    ];

    // Filtrar por teléfono si se especifica
    let filteredClients = mockClients;
    if (phone) {
      filteredClients = mockClients.filter(c => c.phone.includes(phone));
    }

    // Filtrar por nombre si se especifica
    if (name) {
      filteredClients = filteredClients.filter(c => 
        c.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    // Calcular estadísticas
    const totalClients = mockClients.length;
    const vipClients = mockClients.filter(c => c.totalReservations >= 10);
    const newClients = mockClients.filter(c => {
      const createdAt = new Date(c.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt > thirtyDaysAgo;
    });

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name
      },
      filters: {
        phone: phone || 'todos los teléfonos',
        name: name || 'todos los nombres'
      },
      clients: filteredClients,
      statistics: {
        total: totalClients,
        vip: vipClients.length,
        newThisMonth: newClients.length,
        averageReservations: Math.round(mockClients.reduce((sum, c) => sum + c.totalReservations, 0) / totalClients)
      }
    });

  } catch (error) {
    console.error('Error getting clients:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear o actualizar cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      restaurantId, 
      name, 
      phone, 
      email, 
      preferences, 
      notes 
    } = body;

    if (!restaurantId || !name || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: restaurantId, name, phone'
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

    // Generar ID único para el cliente
    const clientId = `client_${Date.now()}`;

    // Crear el cliente
    const newClient = {
      id: clientId,
      name,
      phone,
      email: email || null,
      totalReservations: 0,
      lastVisit: null,
      favoriteTable: null,
      preferences: preferences || {},
      notes: notes || null,
      createdAt: new Date().toISOString()
    };

    // En producción aquí se guardaría en la base de datos
    console.log('Nuevo cliente creado:', newClient);

    return NextResponse.json({
      success: true,
      client: newClient,
      message: `Cliente ${name} agregado a la base de datos`
    });

  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
