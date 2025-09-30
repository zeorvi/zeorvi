import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { laGaviotaConfig, otroRestauranteConfig } from '@/lib/restaurantConfigs';

// GET - Obtener estado de todas las mesas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');
    const location = searchParams.get('location');

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

    // Simular estado actual de mesas (en producción esto vendría de la base de datos)
    const tablesWithStatus = config.tables.map((table: any) => ({
      ...table,
      status: Math.random() > 0.3 ? 'available' : 'occupied',
      currentReservation: Math.random() > 0.7 ? {
        id: `res_${Math.floor(Math.random() * 1000)}`,
        customerName: `Cliente ${Math.floor(Math.random() * 100)}`,
        people: table.capacity,
        time: '20:00'
      } : null,
      lastUpdated: new Date().toISOString()
    }));

    // Filtrar por estado si se especifica
    let filteredTables = tablesWithStatus;
    if (status) {
      filteredTables = tablesWithStatus.filter(t => t.status === status);
    }

    // Filtrar por ubicación si se especifica
    if (location) {
      filteredTables = filteredTables.filter(t => t.location === location);
    }

    // Agrupar por ubicación
    const tablesByLocation = filteredTables.reduce((acc: any, table) => {
      const loc = table.location || 'Sin ubicación';
      if (!acc[loc]) {
        acc[loc] = [];
      }
      acc[loc].push(table);
      return acc;
    }, {});

    // Calcular estadísticas
    const totalTables = config.tables.length;
    const availableTables = tablesWithStatus.filter(t => t.status === 'available');
    const occupiedTables = tablesWithStatus.filter(t => t.status === 'occupied');
    const reservedTables = tablesWithStatus.filter(t => t.status === 'reserved');

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name
      },
      filters: {
        status: status || 'todos los estados',
        location: location || 'todas las ubicaciones'
      },
      tables: filteredTables,
      tablesByLocation,
      statistics: {
        total: totalTables,
        available: availableTables.length,
        occupied: occupiedTables.length,
        reserved: reservedTables.length,
        occupancyRate: Math.round((occupiedTables.length / totalTables) * 100)
      }
    });

  } catch (error) {
    console.error('Error getting tables:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT - Actualizar estado de una mesa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      restaurantId, 
      tableId, 
      status, 
      reservationId, 
      customerName, 
      people 
    } = body;

    if (!restaurantId || !tableId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: restaurantId, tableId, status'
      }, { status: 400 });
    }

    // Validar estado
    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`
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

    // Buscar la mesa
    const table = config.tables.find((t: any) => t.id === tableId);
    if (!table) {
      return NextResponse.json({
        success: false,
        error: 'Mesa no encontrada'
      }, { status: 404 });
    }

    // Actualizar estado de la mesa
    const updatedTable = {
      ...table,
      status,
      currentReservation: status === 'occupied' && reservationId ? {
        id: reservationId,
        customerName: customerName || 'Cliente',
        people: people || table.capacity,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      } : null,
      lastUpdated: new Date().toISOString()
    };

    // En producción aquí se actualizaría en la base de datos
    console.log('Mesa actualizada:', updatedTable);

    // Generar mensaje de respuesta
    let message = '';
    switch (status) {
      case 'available':
        message = `Mesa ${table.name} liberada correctamente`;
        break;
      case 'occupied':
        message = `Mesa ${table.name} ocupada por ${customerName || 'cliente'}`;
        break;
      case 'reserved':
        message = `Mesa ${table.name} reservada para ${customerName || 'cliente'}`;
        break;
      case 'maintenance':
        message = `Mesa ${table.name} puesta en mantenimiento`;
        break;
    }

    return NextResponse.json({
      success: true,
      table: updatedTable,
      message
    });

  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}