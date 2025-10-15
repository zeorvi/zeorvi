import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { sqliteDb } from '@/lib/database/sqlite';
import { GoogleSheetsSyncService } from '@/lib/sync/googleSheetsSync';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/restaurant/tables - Obtener mesas del restaurante (OPTIMIZADO)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const forceSync = searchParams.get('sync') === 'true';

    if (!restaurantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID is required' 
      }, { status: 400 });
    }

    const startTime = Date.now();
    let source = 'database';
    
    console.log('⚡ [Restaurant Tables OPTIMIZED] Obteniendo mesas de DB local para:', restaurantId);
    
    // Sincronizar en background si es necesario (sin bloquear)
    if (forceSync || await GoogleSheetsSyncService.needsSync(restaurantId, 'tables')) {
      GoogleSheetsSyncService.syncTables(restaurantId)
        .then(() => console.log(`✅ Background sync de mesas completado para ${restaurantId}`))
        .catch(err => console.error(`❌ Background sync error:`, err));
    }
    
    // Leer de DB (instantáneo)
    let tables = await sqliteDb.getTables(restaurantId);
    
    // Si DB está vacía, hacer primera sincronización
    if (tables.length === 0) {
      console.log(`⚠️ DB vacía, sincronizando mesas desde Google Sheets (primera vez)...`);
      source = 'google_sheets_first_sync';
      const syncResult = await GoogleSheetsSyncService.syncTables(restaurantId);
      if (syncResult.success) {
        tables = await sqliteDb.getTables(restaurantId);
      } else {
        // Fallback a Google Sheets si sync falla
        tables = await GoogleSheetsService.getMesas(restaurantId);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [Restaurant Tables] ${tables.length} mesas obtenidas de ${source} en ${duration}ms`);

    return NextResponse.json({
      success: true,
      data: tables,
      source,
      duration,
      optimized: source === 'database'
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
