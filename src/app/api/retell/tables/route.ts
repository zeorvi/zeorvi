import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';
import { MetricsService } from '@/lib/firebase/collections';
import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: string;
  client?: string;
}

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

// Servicio para manejo de mesas
class TableService {
  static async getTablesByRestaurant(restaurantId: string): Promise<Table[]> {
    try {
      const q = query(
        collection(db, 'tables'),
        where('restaurantId', '==', restaurantId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];
    } catch (error) {
      logger.error('Error getting tables from Firebase', { restaurantId, error });
      throw error;
    }
  }

  static async initializeTables(restaurantId: string, tables: Table[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const table of tables) {
        const tableRef = doc(collection(db, 'tables'));
        batch.set(tableRef, {
          ...table,
          restaurantId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      await batch.commit();
      logger.info('Tables initialized in Firebase', { restaurantId, tablesCount: tables.length });
    } catch (error) {
      logger.error('Error initializing tables in Firebase', { restaurantId, error });
      throw error;
    }
  }

  static async updateTableStatus(
    restaurantId: string, 
    tableId: string, 
    updates: Partial<Table>
  ): Promise<void> {
    try {
      // Buscar la mesa por restaurantId y tableId
      const q = query(
        collection(db, 'tables'),
        where('restaurantId', '==', restaurantId),
        where('id', '==', tableId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error(`Table ${tableId} not found for restaurant ${restaurantId}`);
      }
      
      const tableDoc = querySnapshot.docs[0];
      await updateDoc(tableDoc.ref, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      logger.info('Table status updated in Firebase', { restaurantId, tableId, updates });
    } catch (error) {
      logger.error('Error updating table status in Firebase', { restaurantId, tableId, error });
      throw error;
    }
  }
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

    // Obtener mesas reales de Firebase
    let allTables = await TableService.getTablesByRestaurant(restaurantId);
    
    // Si no hay mesas, usar datos de ejemplo para demostración
    if (allTables.length === 0) {
      const defaultTables: Table[] = [
        { id: 'M1', name: 'Mesa 1', capacity: 2, location: 'Terraza', status: 'libre' },
        { id: 'M2', name: 'Mesa 2', capacity: 4, location: 'Salón Principal', status: 'libre' },
        { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal', status: 'reservada', client: 'María García' },
        { id: 'M4', name: 'Mesa 4', capacity: 2, location: 'Terraza', status: 'libre' },
        { id: 'M5', name: 'Mesa 5', capacity: 8, location: 'Salón Privado', status: 'ocupada', client: 'Juan Pérez' },
        { id: 'M6', name: 'Mesa 6', capacity: 6, location: 'Terraza', status: 'libre' }
      ];
      
      // Inicializar mesas en Firebase para este restaurante
      await TableService.initializeTables(restaurantId, defaultTables);
      allTables = defaultTables;
    }

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

    // Validar parámetros requeridos
    if (!newStatus) {
      return NextResponse.json({ 
        error: 'El estado de la mesa es requerido' 
      }, { status: 400 });
    }

    if (!tableId) {
      return NextResponse.json({ 
        error: 'El ID de la mesa es requerido' 
      }, { status: 400 });
    }

    if (!restaurantId) {
      return NextResponse.json({ 
        error: 'El ID del restaurante es requerido' 
      }, { status: 400 });
    }

    // Validar estados permitidos
    const validStatuses = ['libre', 'ocupada', 'reservada'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ 
        error: 'Estado inválido. Debe ser: libre, ocupada, o reservada' 
      }, { status: 400 });
    }

    // Actualizar mesa en Firebase
    await TableService.updateTableStatus(restaurantId, tableId, {
      status: newStatus,
      client: newStatus !== 'libre' && clientInfo?.name ? clientInfo.name : undefined
    });

    // Actualizar métricas en tiempo real
    await updateRestaurantMetrics(restaurantId);

    logger.info('Table status updated via Retell', { 
      tableId,
      newStatus,
      restaurantId 
    });

    return NextResponse.json({
      success: true,
      message: `Mesa ${tableId} actualizada a estado: ${newStatus}`,
      data: {
        tableId,
        newStatus,
        restaurantId,
        timestamp: new Date().toISOString()
      }
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


async function updateRestaurantMetrics(restaurantId: string) {
  try {
    // Actualizar métricas del restaurante
    await MetricsService.updateRealTimeMetrics(restaurantId, {
      lastTableUpdate: new Date().toISOString(),
      tablesLastModified: new Date().toISOString()
    });
    
    logger.info('Restaurant metrics updated', { restaurantId });
  } catch (error) {
    logger.error('Error updating restaurant metrics', { restaurantId, error });
  }
}