import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// GET - Obtener mesas del restaurante
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId');
  
  try {
    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    const startTime = Date.now();
    console.log(`📊 Obteniendo mesas de Google Sheets para ${restaurantId}...`);
    
    // Obtener mesas de Google Sheets (sin timeout, dejar que Vercel maneje el límite)
    const mesas = await GoogleSheetsService.getMesas(restaurantId);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Mesas obtenidas de Google Sheets en ${duration}ms (${mesas.length} mesas)`);

    return NextResponse.json({
      success: true,
      mesas,
      restaurantId,
      source: 'google_sheets',
      duration
    });

  } catch (error) {
    console.error('❌ Error obteniendo mesas de Google Sheets:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json({
      success: false,
      error: 'Error conectando con Google Sheets',
      details: error instanceof Error ? error.message : 'Error desconocido',
      restaurantId: restaurantId || 'unknown'
    }, { status: 500 });
  }
}

