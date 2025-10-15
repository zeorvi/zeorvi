import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsCache } from '@/lib/cache/googleSheetsCache';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/cache/invalidate
 * Endpoint para invalidar manualmente el caché de Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, type } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Invalidar caché según el tipo
    switch (type) {
      case 'reservas':
        googleSheetsCache.invalidate(`reservas:${restaurantId}`);
        break;
      case 'horarios':
        googleSheetsCache.invalidate(`horarios:${restaurantId}`);
        break;
      case 'mesas':
        googleSheetsCache.invalidate(`mesas:${restaurantId}`);
        break;
      case 'all':
        // Invalidar todo el caché del restaurante
        googleSheetsCache.invalidatePattern(`*:${restaurantId}*`);
        break;
      default:
        // Por defecto, invalidar solo reservas
        googleSheetsCache.invalidate(`reservas:${restaurantId}`);
    }

    console.log(`🗑️ [API] Caché invalidado para ${restaurantId} (tipo: ${type || 'reservas'})`);

    return NextResponse.json({
      success: true,
      message: `Caché invalidado correctamente para ${restaurantId}`,
      type: type || 'reservas'
    });

  } catch (error) {
    console.error('❌ [API] Error invalidando caché:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

/**
 * GET /api/cache/invalidate
 * Obtener estadísticas del caché
 */
export async function GET() {
  try {
    const stats = googleSheetsCache.getStats();

    return NextResponse.json({
      success: true,
      stats,
      message: 'Estadísticas del caché obtenidas correctamente'
    });

  } catch (error) {
    console.error('❌ [API] Error obteniendo estadísticas del caché:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

