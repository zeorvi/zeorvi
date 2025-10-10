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
      console.log('🔍 [useRestaurantTables] Loading tables for restaurant:', restaurantId);
      
      // Llamar al endpoint /api/restaurant/tables
      const response = await fetch(`/api/restaurant/tables?restaurantId=${restaurantId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 [useRestaurantTables] API response:', result);
      
      if (result.success && result.data) {
        // Convertir las mesas de Google Sheets al formato esperado
        const tablesWithStatus: TableStatus[] = result.data.map((table: any) => ({
          id: table.ID || `table-${Math.random().toString(36).substr(2, 9)}`,
          name: table.ID || `Mesa ${table.ID}`,
          capacity: table.Capacidad || 4,
          location: table.Zona || 'Sala principal',
          status: table.Estado === 'Libre' ? 'available' : 
                  table.Estado === 'Ocupada' ? 'occupied' : 
                  table.Estado === 'Reservada' ? 'reserved' : 'available',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }));
        
        console.log('✅ [useRestaurantTables] Tables converted:', tablesWithStatus);
        setTables(tablesWithStatus);
        setLastUpdate(new Date());
      } else {
        console.log('⚠️ [useRestaurantTables] No tables data in response');
        setTables([]);
      }
    } catch (error) {
      console.error('❌ [useRestaurantTables] Error loading tables:', error);
      toast.error('Error al cargar las mesas');
      setTables([]);
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

  // Sincronización automática cada 2 minutos
  useEffect(() => {
    if (!restaurantId || tables.length === 0) return;

    console.log('🔄 Setting up auto-sync for restaurant:', restaurantId);
    const interval = setInterval(() => {
      console.log('⏰ Auto-sync triggered');
      syncWithFirebase();
    }, 2 * 60 * 1000); // 2 minutos

    return () => {
      console.log('🛑 Cleaning up auto-sync interval');
      clearInterval(interval);
    };
  }, [syncWithFirebase, restaurantId, tables.length]);

  console.log('🔄 Hook returning:', { 
    tablesCount: tables.length, 
    isLoading, 
    restaurantId,
    tables: tables.map(t => ({ id: t.id, name: t.name, status: t.status }))
  });

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
