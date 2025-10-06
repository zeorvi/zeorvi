import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { productionDb } from '@/lib/database/production';

// GET /api/restaurant/tables - Obtener mesas del restaurante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID is required' 
      }, { status: 400 });
    }

    const tables = await productionDb.getTableStates(restaurantId);
    
    logger.info(`Retrieved ${tables.length} tables for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: tables
    });

  } catch (error) {
    logger.error('Error getting restaurant tables', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener mesas del restaurante'
    }, { status: 500 });
  }
}

// POST /api/restaurant/initialize-tables - Inicializar mesas por defecto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tables } = body;

    if (!restaurantId || !tables || !Array.isArray(tables)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID and tables array are required' 
      }, { status: 400 });
    }

    await productionDb.initializeTables(restaurantId, tables);
    
    logger.info(`Initialized ${tables.length} tables for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      message: 'Mesas inicializadas correctamente'
    });

  } catch (error) {
    logger.error('Error initializing tables', error);
    return NextResponse.json({
      success: false,
      error: 'Error al inicializar mesas'
    }, { status: 500 });
  }
}
