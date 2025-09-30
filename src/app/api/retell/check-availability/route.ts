import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { laGaviotaConfig, otroRestauranteConfig } from '@/lib/restaurantConfigs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const people = parseInt(searchParams.get('people') || '0');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    if (!people || people <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Número de personas debe ser mayor a 0'
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

    // Simular estado de mesas (en producción esto vendría de la base de datos)
    const tablesWithStatus = config.tables.map((table: any) => ({
      ...table,
      status: Math.random() > 0.3 ? 'available' : 'occupied', // 70% disponibles
      lastUpdated: new Date().toISOString()
    }));

    // Filtrar mesas disponibles que puedan acomodar al número de personas
    const availableTables = tablesWithStatus.filter((table: any) => 
      table.status === 'available' && table.capacity >= people
    );

    // Agrupar por ubicación
    const tablesByLocation: { [key: string]: any[] } = {};
    availableTables.forEach((table: any) => {
      const location = table.location || 'Sin ubicación';
      if (!tablesByLocation[location]) {
        tablesByLocation[location] = [];
      }
      tablesByLocation[location].push(table);
    });

    // Calcular estadísticas
    const totalTables = config.tables.length;
    const availableCount = availableTables.length;
    const occupiedCount = totalTables - availableCount;
    const occupancyRate = Math.round((occupiedCount / totalTables) * 100);

    // Generar respuesta estructurada
    const response = {
      success: true,
      restaurant: {
        id: restaurantData.id,
        name: restaurantData.name,
        status: restaurantData.status
      },
      request: {
        people,
        date: date || 'hoy',
        time: time || 'no especificado'
      },
      availability: {
        hasAvailability: availableTables.length > 0,
        availableTables: availableTables.length,
        totalTables,
        occupancyRate: `${occupancyRate}%`
      },
      tablesByLocation: Object.entries(tablesByLocation).map(([location, tables]) => ({
        location,
        count: tables.length,
        tables: tables.map(table => ({
          name: table.name,
          capacity: table.capacity,
          status: table.status
        }))
      })),
      recommendations: availableTables.length > 0 ? [
        `Tenemos ${availableTables.length} mesa${availableTables.length > 1 ? 's' : ''} disponible${availableTables.length > 1 ? 's' : ''} para ${people} persona${people > 1 ? 's' : ''}`,
        availableTables.length > 1 ? 'Puedo ofrecerle varias opciones de ubicación' : 'Tenemos una mesa perfecta para usted',
        '¿Le gustaría que le confirme la reserva?'
      ] : [
        `Lamentablemente no tenemos mesas disponibles para ${people} persona${people > 1 ? 's' : ''} en este momento`,
        '¿Le gustaría que le sugiera algunos horarios alternativos?',
        'También puedo tomar sus datos para contactarle si se libera alguna mesa'
      ],
      alternativeTimes: availableTables.length === 0 ? [
        '20:00 (primer turno de cena)',
        '22:00 (segundo turno de cena)',
        '13:00 (primer turno de comida)',
        '14:00 (segundo turno de comida)'
      ] : []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
