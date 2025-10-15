import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// Definir el tipo TableState localmente
export interface TableState {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location?: string;
  specialFeatures?: string[];
  lastUpdated?: string;
  updatedBy?: string;
  client?: {
    name: string;
    phone: string;
    partySize: number;
    notes?: string;
  };
}

export type TableStatus = TableState;

export function useRestaurantTables(restaurantId: string) {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Cargar mesas desde el endpoint /api/restaurant/tables
  const loadTables = useCallback(async () => {
    if (!restaurantId) {
      console.log('❌ No restaurantId provided');
      return;
    }
    
    setIsLoading(true);
    try {
      // Timeout de 25 segundos para Google Sheets
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(`/api/restaurant/tables?restaurantId=${restaurantId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Convertir las mesas de Google Sheets al formato esperado
        const tablesWithStatus: TableStatus[] = result.data.map((table: Record<string, unknown>) => ({
          id: (table.ID as string) || `table-${Math.random().toString(36).substr(2, 9)}`,
          name: (table.ID as string) || `Mesa ${table.ID}`,
          capacity: (table.Capacidad as number) || 4,
          location: (table.Zona as string) || 'Sala principal',
          status: (table.Estado as string) === 'Libre' ? 'available' : 
                  (table.Estado as string) === 'Ocupada' ? 'occupied' : 
                  (table.Estado as string) === 'Reservada' ? 'reserved' : 'available',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }));
        
        setTables(tablesWithStatus);
        setLastUpdate(new Date());
      } else {
        setTables([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⏱️ [useRestaurantTables] Timeout loading tables - Google Sheets puede estar lento');
        toast.warning('Google Sheets está tardando. Intenta refrescar en unos segundos.');
        setTables([]);
      } else {
        console.error('❌ [useRestaurantTables] Error loading tables:', error);
        setTables([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Actualizar estado de una mesa específica
  const updateTableStatus = useCallback(async (
    tableId: string, 
    newStatus: 'available' | 'occupied' | 'reserved' | 'maintenance',
    client?: {
      name: string;
      phone: string;
      partySize: number;
      notes?: string;
    }
  ) => {
    const now = new Date().toISOString();
    
    // Actualizar estado local inmediatamente
    setTables(prev => prev.map(table => 
      table.id === tableId 
        ? { 
            ...table, 
            status: newStatus, 
            client: newStatus === 'available' ? undefined : client,
            lastUpdated: now,
            updatedBy: 'gerente'
          }
        : table
    ));
    
    setLastUpdate(new Date());
    
    // TODO: Implementar sincronización con Firebase cuando esté disponible
    // try {
    //   await updateTableStateInFirebase(restaurantId, tableId, {
    //     status: newStatus,
    //     client: newStatus === 'libre' ? undefined : client,
    //     lastUpdated: now,
    //     updatedBy: 'gerente'
    //   });
    // } catch (error) {
    //   console.error('❌ Error saving to Firebase:', error);
    //   toast.error('Error al sincronizar con el sistema');
    // }
    
    // Mostrar toast de confirmación
    const tableName = tables.find(t => t.id === tableId)?.name || tableId;
    const statusText = newStatus === 'available' ? 'liberada' : 
                      newStatus === 'occupied' ? 'ocupada' : 
                      newStatus === 'reserved' ? 'reservada' : 'en mantenimiento';
    toast.success(`Mesa ${tableName} ${statusText} correctamente`);
    
    console.log(`🔄 Table ${tableId} status updated to ${newStatus} by gerente`);
  }, [tables]);

  // Obtener mesas por estado
  const getTablesByStatus = useCallback((status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'all') => {
    if (status === 'all') return tables;
    return tables.filter(table => table.status === status);
  }, [tables]);

  // Obtener métricas de las mesas (memoizado para mejor rendimiento)
  const metrics = useMemo(() => {
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const reservedTables = tables.filter(t => t.status === 'reserved').length;
    const freeTables = tables.filter(t => t.status === 'available').length;
    const maintenanceTables = tables.filter(t => t.status === 'maintenance').length;
    
    return {
      totalTables,
      occupiedTables,
      reservedTables,
      freeTables,
      maintenanceTables,
      averageOccupancy: totalTables > 0 ? Math.round(((occupiedTables + reservedTables) / totalTables) * 100) : 0
    };
  }, [tables]);

  // TODO: Implementar sincronización con Firebase cuando esté disponible
  const syncWithFirebase = useCallback(async () => {
    if (tables.length === 0) return;
    
    // TODO: Implementar cuando las funciones estén disponibles
    console.log('🔄 Auto-sync disabled - functions not available');
  }, [tables]);

  // Cargar mesas al montar el componente
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Sincronización automática cada 5 minutos (optimizado)
  useEffect(() => {
    if (!restaurantId || tables.length === 0) return;

    console.log('🔄 Configurando auto-sincronización para restaurante:', restaurantId);
    const interval = setInterval(() => {
      console.log('⏰ Auto-sincronización activada');
      syncWithFirebase();
    }, 5 * 60 * 1000); // 5 minutos (optimizado de 2 minutos)

    return () => {
      console.log('🛑 Limpiando intervalo de auto-sincronización');
      clearInterval(interval);
    };
  }, [syncWithFirebase, restaurantId, tables.length]);

  // Log solo en desarrollo para evitar spam en producción
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Hook retornando:', { 
      tablesCount: tables.length, 
      isLoading, 
      restaurantId,
      tables: tables.map(t => ({ id: t.id, name: t.name, status: t.status }))
    });
  }

  return {
    tables,
    isLoading,
    lastUpdate,
    updateTableStatus,
    getTablesByStatus,
    getMetrics: () => metrics, // Función que retorna las métricas memoizadas
    refreshTables: loadTables
  };
}
