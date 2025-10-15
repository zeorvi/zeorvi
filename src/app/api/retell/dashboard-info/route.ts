import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { laGaviotaConfig, otroRestauranteConfig } from '@/lib/restaurantConfigs';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

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

    // Simular estado actual de mesas
    const tablesWithStatus = config.tables.map((table: any) => ({
      ...table,
      status: Math.random() > 0.3 ? 'available' : 'occupied',
      lastUpdated: new Date().toISOString()
    }));

    // Calcular métricas
    const totalTables = config.tables.length;
    const availableTables = tablesWithStatus.filter(t => t.status === 'available');
    const occupiedTables = tablesWithStatus.filter(t => t.status === 'occupied');
    const reservedTables = tablesWithStatus.filter(t => t.status === 'reserved');

    // Agrupar por ubicación
    const tablesByLocation: { [key: string]: any } = {};
    config.tables.forEach((table: any) => {
      const location = table.location || 'Sin ubicación';
      if (!tablesByLocation[location]) {
        tablesByLocation[location] = {
          total: 0,
          available: 0,
          occupied: 0,
          reserved: 0,
          tables: []
        };
      }
      tablesByLocation[location].total++;
      
      const tableStatus = tablesWithStatus.find(t => t.id === table.id)?.status || 'available';
      tablesByLocation[location][tableStatus]++;
      tablesByLocation[location].tables.push({
        name: table.name,
        capacity: table.capacity,
        status: tableStatus
      });
    });

    // Generar información del dashboard
    const dashboardInfo = {
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name,
        status: restaurantData.status,
        address: restaurantData.address,
        phone: restaurantData.phone
      },
      currentStatus: {
        timestamp: new Date().toISOString(),
        totalTables,
        available: availableTables.length,
        occupied: occupiedTables.length,
        reserved: reservedTables.length,
        occupancyRate: Math.round((occupiedTables.length / totalTables) * 100)
      },
      tablesByLocation: Object.entries(tablesByLocation).map(([location, data]) => ({
        location,
        summary: `${data.available}/${data.total} mesas disponibles`,
        details: {
          total: data.total,
          available: data.available,
          occupied: data.occupied,
          reserved: data.reserved
        },
        tables: data.tables
      })),
      capacityBreakdown: {
        byCapacity: config.tables.reduce((acc: any, table: any) => {
          const capacity = table.capacity;
          if (!acc[capacity]) {
            acc[capacity] = { total: 0, available: 0 };
          }
          acc[capacity].total++;
          const tableStatus = tablesWithStatus.find(t => t.id === table.id)?.status || 'available';
          if (tableStatus === 'available') {
            acc[capacity].available++;
          }
          return acc;
        }, {})
      },
      recommendations: {
        bestTimes: ['20:00', '22:00', '13:00', '14:00'],
        peakHours: ['20:00-21:00', '13:00-14:00'],
        quietHours: ['15:00-19:00']
      },
      systemStatus: {
        isOnline: true,
        lastUpdate: new Date().toISOString(),
        aiConnected: true,
        reservationsActive: true
      }
    };

    return NextResponse.json(dashboardInfo);

  } catch (error) {
    console.error('Error getting dashboard info:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
