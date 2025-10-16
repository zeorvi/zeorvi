import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener mesas del restaurante
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId');
  
  try {
    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido',
        data: [],
        mesas: []
      }, { status: 400 });
    }

    const startTime = Date.now();
    console.log(`📊 [Google Sheets] Obteniendo mesas directamente para ${restaurantId}...`);
    
    try {
      // Obtener mesas de Google Sheets directamente
      const mesas = await GoogleSheetsService.getMesas(restaurantId);
      
      const duration = Date.now() - startTime;
      console.log(`✅ [Google Sheets] ${mesas.length} mesas obtenidas en ${duration}ms`);
      
      // Validar que mesas sea un array
      const mesasArray = Array.isArray(mesas) ? mesas : [];

      return NextResponse.json({
        success: true,
        data: mesasArray, // Devolver como 'data' para consistencia con el hook
        mesas: mesasArray, // Mantener también como 'mesas' por compatibilidad
        total: mesasArray.length,
        restaurantId,
        source: 'google_sheets',
        duration
      });
    } catch (sheetsError) {
      console.error('❌ [Google Sheets] Error específico:', sheetsError);
      throw sheetsError;
    }

  } catch (error) {
    console.error('❌ Error obteniendo mesas:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json({
      success: false,
      error: 'Error conectando con Google Sheets',
      details: error instanceof Error ? error.message : 'Error desconocido',
      data: [], // Siempre devolver array vacío en caso de error
      mesas: [], // Por compatibilidad
      total: 0,
      restaurantId: restaurantId || 'unknown'
    }, { status: 500 });
  }
}

