import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved';
  notes?: string;
}

interface RestaurantTables {
  restaurantId: string;
  tables: Table[];
  lastUpdated: string;
}

// Mock data - en producción vendría de PostgreSQL
const mockRestaurantTables: RestaurantTables[] = [
  {
    restaurantId: 'rest_001',
    tables: [
      { id: 'table_1', name: 'Mesa 1', capacity: 4, location: 'Comedor 1', status: 'available' },
      { id: 'table_2', name: 'Mesa 2', capacity: 2, location: 'Comedor 1', status: 'available' },
      { id: 'table_6', name: 'Mesa 6', capacity: 6, location: 'Comedor 1', status: 'available' },
      { id: 'table_8', name: 'Mesa 8', capacity: 4, location: 'Terraza', status: 'available' },
      { id: 'table_10', name: 'Mesa 10', capacity: 4, location: 'Terraza', status: 'available' }
    ],
    lastUpdated: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    logger.info('🔍 GET /api/retell/tables', { restaurantId });

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId es requerido' },
        { status: 400 }
      );
    }

    // Buscar mesas del restaurante
    const restaurantData = mockRestaurantTables.find(r => r.restaurantId === restaurantId);
    
    if (!restaurantData) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    // Filtrar solo mesas disponibles
    const availableTables = restaurantData.tables.filter(table => table.status === 'available');

    logger.info('✅ Mesas disponibles encontradas', { 
      restaurantId, 
      totalTables: restaurantData.tables.length,
      availableTables: availableTables.length 
    });

    return NextResponse.json({
      success: true,
      restaurantId,
      tables: availableTables,
      totalTables: restaurantData.tables.length,
      availableTables: availableTables.length,
      lastUpdated: restaurantData.lastUpdated
    });

  } catch (error) {
    logger.error('❌ Error en GET /api/retell/tables', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, status, clientInfo } = body;
    
    logger.info('📝 POST /api/retell/tables', { restaurantId, tableId, status });

    if (!restaurantId || !tableId || !status) {
      return NextResponse.json(
        { error: 'restaurantId, tableId y status son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el restaurante
    const restaurantData = mockRestaurantTables.find(r => r.restaurantId === restaurantId);
    
    if (!restaurantData) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    // Buscar la mesa
    const table = restaurantData.tables.find(t => t.id === tableId);
    
    if (!table) {
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estado de la mesa
    table.status = status;
    restaurantData.lastUpdated = new Date().toISOString();

    logger.info('✅ Estado de mesa actualizado', { 
      restaurantId, 
      tableId, 
      status,
      tableName: table.name 
    });

    return NextResponse.json({
      success: true,
      message: `Mesa ${table.name} actualizada a estado ${status}`,
      table: {
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        location: table.location,
        status: table.status
      },
      lastUpdated: restaurantData.lastUpdated
    });

  } catch (error) {
    logger.error('❌ Error en POST /api/retell/tables', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}