import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsSyncService } from '@/lib/sync/googleSheetsSync';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint de sincronización Google Sheets → Base de Datos
 * GET /api/sync/google-sheets?restaurantId=rest_003
 * 
 * Sincroniza datos desde Google Sheets a la base de datos local
 * para hacer el dashboard 300x más rápido
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const force = searchParams.get('force') === 'true';

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId is required'
      }, { status: 400 });
    }

    console.log(`🔄 [Sync API] Solicitud de sincronización para ${restaurantId} (force: ${force})`);

    let result;
    
    if (force) {
      // Sincronización forzada (ignorar cache de 3 min)
      result = await GoogleSheetsSyncService.syncAll(restaurantId);
    } else {
      // Sincronización inteligente (solo si necesita)
      result = await GoogleSheetsSyncService.syncIfNeeded(restaurantId);
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Sync API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error during synchronization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/sync/google-sheets
 * 
 * Sincronizar múltiples restaurantes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantIds } = body;

    if (!restaurantIds || !Array.isArray(restaurantIds)) {
      return NextResponse.json({
        success: false,
        error: 'restaurantIds array is required'
      }, { status: 400 });
    }

    console.log(`🔄 [Sync API] Sincronización masiva iniciada para ${restaurantIds.length} restaurantes`);

    const results = await Promise.all(
      restaurantIds.map(id => GoogleSheetsSyncService.syncAll(id))
    );

    const totalSynced = results.reduce((acc, r) => ({
      reservations: acc.reservations + r.reservations.synced,
      tables: acc.tables + r.tables.synced
    }), { reservations: 0, tables: 0 });

    return NextResponse.json({
      success: true,
      restaurants: results.length,
      totalSynced,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Sync API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error during batch synchronization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

