import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { productionDb } from '@/lib/database/production';
import { realtimeService } from '@/lib/realtimeService';

// POST /api/restaurant/update-table-status - Actualizar estado de mesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, status, clientData } = body;

    if (!restaurantId || !tableId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID, table ID, and status are required' 
      }, { status: 400 });
    }

    // Validar estado
    const validStatuses = ['libre', 'ocupada', 'reservada', 'ocupado_todo_dia', 'mantenimiento'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status' 
      }, { status: 400 });
    }

    // Actualizar estado en la base de datos
    const updatedTable = await productionDb.updateTableState(
      restaurantId,
      tableId,
      status as any,
      clientData
    );

    // Enviar actualización en tiempo real
    await realtimeService.broadcastToRestaurant(restaurantId, 'table_status_changed', {
      tableId,
      status,
      clientData,
      updatedTable
    });

    logger.info(`Table ${tableId} status updated to ${status} for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: updatedTable,
      message: 'Estado de mesa actualizado correctamente'
    });

  } catch (error) {
    logger.error('Error updating table status', error);
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar estado de mesa'
    }, { status: 500 });
  }
}
