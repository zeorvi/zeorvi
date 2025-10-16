import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurantId') || 'rest_003';
  
  const debug: {
    timestamp: string;
    restaurantId: string;
    checks: Record<string, any>;
  } = {
    timestamp: new Date().toISOString(),
    restaurantId,
    checks: {}
  };

  try {
    // Check 1: Variables de entorno
    debug.checks.env = {
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL?.substring(0, 20) + '...'
    };

    // Check 2: Obtener spreadsheet ID
    debug.checks.spreadsheetId = {
      status: 'checking'
    };
    try {
      const sheetId = GoogleSheetsService.getSheetId(restaurantId);
      debug.checks.spreadsheetId = {
        status: 'ok',
        id: sheetId
      };
    } catch (error) {
      debug.checks.spreadsheetId = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }

    // Check 3: Obtener cliente de Google Sheets
    debug.checks.googleClient = {
      status: 'checking'
    };
    try {
      const client = await GoogleSheetsService.getClient();
      debug.checks.googleClient = {
        status: 'ok',
        hasClient: !!client
      };
    } catch (error) {
      debug.checks.googleClient = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }

    // Check 4: Leer mesas directamente
    debug.checks.mesas = {
      status: 'checking'
    };
    try {
      const mesas = await GoogleSheetsService.getMesas(restaurantId);
      debug.checks.mesas = {
        status: 'ok',
        count: mesas.length,
        mesas: mesas.slice(0, 3).map(m => ({
          ID: m.ID,
          Zona: m.Zona,
          Capacidad: m.Capacidad,
          Estado: m.Estado
        }))
      };
    } catch (error) {
      debug.checks.mesas = {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };
    }

    return NextResponse.json(debug, { status: 200 });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      ...debug,
      globalError: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

