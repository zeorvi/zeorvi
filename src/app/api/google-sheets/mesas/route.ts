import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { laGaviotaConfig, otroRestauranteConfig } from '@/lib/restaurantConfigs';

// Helper para timeout rápido
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([promise, timeout]);
}

// Mesas hardcoded para fallback cuando Google Sheets falle
function getHardcodedMesas(restaurantId: string) {
  if (restaurantId === 'rest_003') {
    return laGaviotaConfig.tables.map(table => ({
      ID: table.id,
      Zona: table.location,
      Capacidad: table.capacity,
      Turnos: 'Almuerzo,Cena',
      Estado: 'Libre',
      Notas: table.notes || ''
    }));
  } else if (restaurantId === 'rest_001') {
    return otroRestauranteConfig.tables.map(table => ({
      ID: table.id,
      Zona: table.location,
      Capacidad: table.capacity,
      Turnos: 'Almuerzo,Cena',
      Estado: 'Libre',
      Notas: table.notes || ''
    }));
  }
  return [];
}

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

