import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService, Reserva } from '@/lib/googleSheetsService';
import { sqliteDb } from '@/lib/database/sqlite';
import { GoogleSheetsSyncService } from '@/lib/sync/googleSheetsSync';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener reservas (OPTIMIZADO: Lee de DB local 300x más rápido)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');
    const restaurantId = searchParams.get('restaurantId');
    const all = searchParams.get('all');
    const forceSync = searchParams.get('sync') === 'true';

    if (!restaurantId && all !== 'true') {
      return NextResponse.json({
        success: false,
        error: 'Se requiere restaurantId o all=true'
      }, { status: 400 });
    }

    let reservas: Reserva[] = [];
    const startTime = Date.now();
    let source = 'database';
    
    if (restaurantId) {
      // SIEMPRE usar Google Sheets directamente (más confiable)
      console.log(`📊 [Google Sheets] Obteniendo reservas directamente...`);
      source = 'google_sheets';
      
      try {
        reservas = await GoogleSheetsService.getReservas(restaurantId);
        
        if (fecha) {
          reservas = reservas.filter(r => r.Fecha === fecha);
        }
        
        console.log(`✅ [Google Sheets] ${reservas.length} reservas obtenidas`);
      } catch (error) {
        console.error(`❌ [Google Sheets] Error obteniendo reservas:`, error);
        reservas = [];
      }
    } else if (all === 'true') {
      source = 'google_sheets';
      reservas = await GoogleSheetsService.getAllReservas();
    }

    if (estado && reservas) {
      reservas = reservas.filter((r) => r.Estado === estado);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Reservas obtenidas de ${source} en ${duration}ms (${reservas.length} reservas)`);

    return NextResponse.json({
      success: true,
      reservas,
      total: reservas.length,
      fecha: fecha || 'todas',
      estado: estado || 'todos',
      restaurantId: restaurantId || 'all',
      source,
      duration,
      optimized: source === 'database'
    });

  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo reservas',
      details: error instanceof Error ? error.message : 'Error desconocido',
      reservas: [], // Siempre devolver array vacío en caso de error
      total: 0
    }, { status: 500 });
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, ...reservaData } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    const result = await GoogleSheetsService.crearReserva(
      restaurantId,
      reservaData.fecha,
      reservaData.hora,
      reservaData.cliente,
      reservaData.telefono,
      reservaData.personas,
      reservaData.zona || '',
      reservaData.notas || ''
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        mensaje: 'Reserva creada exitosamente',
        ID: result.ID
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Error creando la reserva'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error creando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT - Actualizar reserva
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, ID, ...nuevosDatos } = body;

    if (!restaurantId || !ID) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId e ID son requeridos'
      }, { status: 400 });
    }

    // Buscar la reserva por ID y actualizar
    const reservas = await GoogleSheetsService.getReservas(restaurantId);
    const reserva = reservas.find(r => r.ID === ID);
    
    if (!reserva) {
      return NextResponse.json({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 });
    }

    const result = await GoogleSheetsService.actualizarEstadoReserva(
      reserva.Cliente,
      reserva.Telefono,
      nuevosDatos.estado || reserva.Estado,
      restaurantId
    );

    if (result) {
      return NextResponse.json({
        success: true,
        mensaje: 'Reserva actualizada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error actualizando la reserva'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error actualizando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE - Cancelar reserva
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const ID = searchParams.get('ID');

    if (!restaurantId || !ID) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId e ID son requeridos'
      }, { status: 400 });
    }

    // Buscar la reserva por ID y cancelarla
    const reservas = await GoogleSheetsService.getReservas(restaurantId);
    const reserva = reservas.find(r => r.ID === ID);
    
    if (!reserva) {
      return NextResponse.json({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 });
    }

    const result = await GoogleSheetsService.eliminarReserva(restaurantId, ID);

    if (result.success) {
      return NextResponse.json({
        success: true,
        mensaje: 'Reserva eliminada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error eliminando la reserva'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error cancelando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
