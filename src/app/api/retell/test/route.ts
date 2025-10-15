import { NextRequest, NextResponse } from 'next/server';
import { RetellGoogleSheetsFunctions } from '@/lib/retellGoogleSheetsFunctions';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test endpoint llamado');
    
    // Parámetros de prueba
    const testParams = {
      restaurantId: 'rest_003',
      restaurantName: 'La Gaviota',
      spreadsheetId: 'spreadsheet_rest_003'
    };

    // Test 1: Verificar disponibilidad
    console.log('🔍 Probando verificar_disponibilidad...');
    const disponibilidad = await RetellGoogleSheetsFunctions.verificarDisponibilidad(
      {
        fecha: '2024-01-15',
        hora: '20:00',
        personas: 4
      },
      testParams.restaurantId,
      testParams.restaurantName
    );

    // Test 2: Obtener estadísticas
    console.log('📊 Probando obtener_estadisticas...');
    const estadisticas = await RetellGoogleSheetsFunctions.obtenerEstadisticas(
      testParams.restaurantId
    );

    return NextResponse.json({
      success: true,
      message: 'Tests ejecutados correctamente',
      timestamp: new Date().toISOString(),
      tests: {
        verificar_disponibilidad: {
          status: 'OK',
          result: disponibilidad
        },
        obtener_estadisticas: {
          status: 'OK',
          result: estadisticas
        }
      },
      configuracion: {
        restaurantId: testParams.restaurantId,
        restaurantName: testParams.restaurantName,
        spreadsheetId: testParams.spreadsheetId
      }
    });

  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧪 Test POST recibido:', body);
    
    const { function_name, parameters } = body;
    
    // Parámetros de prueba
    const testParams = {
      restaurantId: 'rest_003',
      restaurantName: 'La Gaviota',
      spreadsheetId: 'spreadsheet_rest_003'
    };

    let result: any = {};

    switch (function_name) {
      case 'verificar_disponibilidad':
        result = await RetellGoogleSheetsFunctions.verificarDisponibilidad(
          parameters,
          testParams.restaurantId,
          testParams.restaurantName
        );
        break;

      case 'crear_reserva':
        result = await RetellGoogleSheetsFunctions.crearReserva(
          {
            ...parameters,
            telefono: parameters.telefono || 'test_phone'
          },
          testParams.restaurantId,
          testParams.restaurantName
        );
        break;

      case 'buscar_reserva':
        result = await RetellGoogleSheetsFunctions.buscarReserva(
          {
            ...parameters,
            telefono: parameters.telefono || 'test_phone'
          },
          testParams.restaurantId
        );
        break;

      case 'cancelar_reserva':
        result = await RetellGoogleSheetsFunctions.cancelarReserva(
          {
            ...parameters,
            telefono: parameters.telefono || 'test_phone'
          },
          testParams.restaurantId
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Función ${function_name} no reconocida`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      function_name,
      result,
      timestamp: new Date().toISOString(),
      configuracion: testParams
    });

  } catch (error) {
    console.error('❌ Error en test POST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
