import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

interface TableUpdateRequest {
  tableId?: string;
  newStatus?: string;
  clientInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  restaurantId?: string;
}

// GET - Obtener información de mesas para Retell
export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status'); // 'libre', 'ocupada', 'reservada', 'all'

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Mock data de mesas - en producción vendría de Firebase
    const allTables = [
      { id: 'M1', name: 'Mesa 1', capacity: 2, location: 'Terraza', status: 'libre' },
      { id: 'M2', name: 'Mesa 2', capacity: 4, location: 'Salón Principal', status: 'libre' },
      { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal', status: 'reservada', client: 'María García' },
      { id: 'M4', name: 'Mesa 4', capacity: 2, location: 'Terraza', status: 'libre' },
      { id: 'M5', name: 'Mesa 5', capacity: 8, location: 'Salón Privado', status: 'ocupada', client: 'Juan Pérez' },
      { id: 'M6', name: 'Mesa 6', capacity: 6, location: 'Terraza', status: 'libre' }
    ];

    // Filtrar por estado si se especifica
    const filteredTables = status && status !== 'all' 
      ? allTables.filter(table => table.status === status)
      : allTables;

    // Estadísticas
    const stats = {
      total: allTables.length,
      libres: allTables.filter(t => t.status === 'libre').length,
      ocupadas: allTables.filter(t => t.status === 'ocupada').length,
      reservadas: allTables.filter(t => t.status === 'reservada').length,
      capacidadTotal: allTables.reduce((sum, table) => sum + table.capacity, 0),
      ocupacionActual: Math.round((allTables.filter(t => t.status !== 'libre').length / allTables.length) * 100)
    };

    return NextResponse.json({
      success: true,
      data: {
        tables: filteredTables,
        stats,
        restaurantId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching tables for Retell', { 
      error: (error as Error).message,
      restaurantId: restaurantId || 'unknown',
      action: 'GET_tables'
    });
    return NextResponse.json({ 
      error: 'Error al obtener información de mesas' 
    }, { status: 500 });
  }
}

// POST - Actualizar estado de mesa desde Retell
export async function POST(request: NextRequest) {
  let body: TableUpdateRequest = {};
  try {
    body = await request.json();
    
    // Validar webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { tableId, newStatus, clientInfo, restaurantId } = body;

    // Validar que newStatus esté presente
    if (!newStatus) {
      return NextResponse.json({ 
        error: 'El estado de la mesa es requerido' 
      }, { status: 400 });
    }

    // Validar estados permitidos
    const validStatuses = ['libre', 'ocupada', 'reservada'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ 
        error: 'Estado inválido. Debe ser: libre, ocupada, o reservada' 
      }, { status: 400 });
    }

    // Simular actualización de mesa
    const updatedTable = {
      id: tableId,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: 'retell-ai',
      clientInfo: newStatus !== 'libre' ? clientInfo : null
    };

    logger.info('Table status updated via Retell', { 
      tableId,
      newStatus,
      restaurantId 
    });

    return NextResponse.json({
      success: true,
      table: updatedTable,
      message: `Mesa ${tableId} actualizada a estado: ${newStatus}`
    });

  } catch (error) {
    logger.error('Error updating table via Retell', { 
      error: (error as Error).message,
      tableId: body?.tableId || 'unknown',
      restaurantId: body?.restaurantId || 'unknown',
      action: 'POST_update_table'
    });
    return NextResponse.json({ 
      error: 'Error al actualizar mesa' 
    }, { status: 500 });
  }
}