import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsSyncService } from '@/lib/sync/googleSheetsSync';
import { AutoTableReleaseService } from '@/lib/autoTableRelease';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * CRON Job para sincronización automática Y liberación de mesas
 * GET /api/cron/sync-google-sheets
 * 
 * Este endpoint debe ser llamado cada 3 minutos por Vercel Cron
 * 
 * Funciones:
 * 1. Sincronizar Google Sheets → Base de Datos
 * 2. Liberar mesas automáticamente después de 2 horas
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar autorización (solo cron puede llamar)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ [Cron] Intento de acceso no autorizado');
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    console.log('⏰ [Cron] Iniciando tareas automáticas...');

    // Lista de restaurantes activos
    const restaurantIds = [
      'rest_001', // El Buen Sabor
      'rest_003', // La Gaviota
    ];

    // 1. Sincronizar Google Sheets → DB en paralelo
    console.log('🔄 [Cron] Sincronizando datos...');
    const syncResults = await Promise.all(
      restaurantIds.map(id => GoogleSheetsSyncService.syncIfNeeded(id))
    );

    // 2. Liberar mesas expiradas (después de 2 horas) en paralelo
    console.log('🕐 [Cron] Liberando mesas expiradas...');
    const releaseResults = await Promise.all(
      restaurantIds.map(id => AutoTableReleaseService.releaseExpiredTables(id))
    );

    const totalDuration = Date.now() - startTime;
    const syncedCount = syncResults.filter(r => r.synced).length;
    const totalReleased = releaseResults.reduce((acc, r) => acc + r.released, 0);

    console.log(`✅ [Cron] Tareas completadas en ${totalDuration}ms`);
    console.log(`   - Restaurantes sincronizados: ${syncedCount}/${restaurantIds.length}`);
    console.log(`   - Mesas liberadas automáticamente: ${totalReleased}`);

    return NextResponse.json({
      success: true,
      syncedRestaurants: syncedCount,
      totalRestaurants: restaurantIds.length,
      tablesReleased: totalReleased,
      duration: totalDuration,
      syncResults,
      releaseResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] Error en tareas automáticas:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error during automatic tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 });
  }
}

