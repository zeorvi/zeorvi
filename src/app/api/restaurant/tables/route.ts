import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

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

    console.log('📊 [Restaurant Tables] Obteniendo mesas para:', restaurantId);
    
    // En producción, usar Google Sheets
    const tables = await GoogleSheetsService.getMesas(restaurantId);
    
    console.log(`✅ [Restaurant Tables] ${tables.length} mesas obtenidas para ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: tables
    });

  } catch (error) {
    console.error('❌ [Restaurant Tables] Error:', error);
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

    console.log('📊 [Restaurant Tables] Inicializando mesas para:', restaurantId);
    
    // En producción, las mesas vienen de Google Sheets
    console.log('⚠️ [Restaurant Tables] Mesas vienen de Google Sheets en producción');

    return NextResponse.json({
      success: true,
      message: 'Mesas inicializadas correctamente (vienen de Google Sheets)'
    });

  } catch (error) {
    console.error('❌ [Restaurant Tables] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al inicializar mesas'
    }, { status: 500 });
  }
}
