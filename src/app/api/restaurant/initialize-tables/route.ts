import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { productionDb } from '@/lib/database/production';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
