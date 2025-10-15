import { NextRequest, NextResponse } from 'next/server';
import { TableManagementSystem } from '@/lib/tableManagementSystem';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Obtener lista de todos los restaurantes
 * En producción esto vendría de una base de datos
 */
async function obtenerTodosLosRestaurantes(): Promise<string[]> {
  // Por ahora retornamos los restaurantes conocidos
  // En producción esto se consultaría desde una base de datos
  return ['rest_003', 'rest_004'];
}

/**
 * Cron job para liberar mesas automáticamente cada hora
 * Se ejecuta automáticamente o se puede llamar manualmente
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Ejecutando liberación automática de mesas...');

    // Obtener todos los restaurantes dinámicamente
    const restaurantes = await obtenerTodosLosRestaurantes();
    console.log(`🏪 Procesando ${restaurantes.length} restaurantes:`, restaurantes);

    const resultados = [];

    for (const restaurantId of restaurantes) {
      try {
        await TableManagementSystem.liberarMesasAutomaticamente(restaurantId);
        
        // Obtener estado actual de las mesas
        const estadoMesas = await TableManagementSystem.obtenerEstadoMesas(restaurantId);
        
        resultados.push({
          restaurantId,
          mesasLiberadas: estadoMesas.filter(m => m.estado === 'libre').length,
          mesasOcupadas: estadoMesas.filter(m => m.estado === 'ocupada').length,
          totalMesas: estadoMesas.length,
          estado: 'success'
        });

        console.log(`✅ Mesas liberadas para restaurante ${restaurantId}`);

      } catch (error) {
        console.error(`❌ Error liberando mesas para ${restaurantId}:`, error);
        resultados.push({
          restaurantId,
          error: error instanceof Error ? error.message : 'Error desconocido',
          estado: 'error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Liberación automática de mesas completada',
      timestamp: new Date().toISOString(),
      resultados
    });

  } catch (error) {
    console.error('❌ Error en liberación automática de mesas:', error);
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
    const { restaurantId, force = false } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    console.log(`🔄 Liberando mesas manualmente para restaurante ${restaurantId}`);

    await TableManagementSystem.liberarMesasAutomaticamente(restaurantId);
    
    const estadoMesas = await TableManagementSystem.obtenerEstadoMesas(restaurantId);

    return NextResponse.json({
      success: true,
      message: `Mesas liberadas para restaurante ${restaurantId}`,
      timestamp: new Date().toISOString(),
      estadoMesas: {
        mesasLiberadas: estadoMesas.filter(m => m.estado === 'libre').length,
        mesasOcupadas: estadoMesas.filter(m => m.estado === 'ocupada').length,
        totalMesas: estadoMesas.length,
        mesas: estadoMesas.map(mesa => ({
          id: mesa.id,
          numero: mesa.numero,
          capacidad: mesa.capacidad,
          ubicacion: mesa.ubicacion,
          estado: mesa.estado,
          reservaActual: mesa.reservaActual
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error liberando mesas manualmente:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
