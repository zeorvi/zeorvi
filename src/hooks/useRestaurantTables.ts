import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRestaurantData, updateTableStateInFirebase, syncTableStates, type TableState } from '@/lib/restaurantService';
import { toast } from 'sonner';

// Usar el tipo TableState del servicio
export type TableStatus = TableState;

export function useRestaurantTables(restaurantId: string) {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Cargar mesas iniciales desde Firebase
  const loadTables = useCallback(async () => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 Loading tables for restaurant:', restaurantId);
      const restaurantData = await getRestaurantData(restaurantId);
      
      if (restaurantData?.tables) {
        console.log('✅ Tables found:', restaurantData.tables);
        
        // Convertir las mesas del restaurante al formato con estado
        const tablesWithStatus: TableStatus[] = restaurantData.tables.map((table) => ({
          id: table.id,
          name: table.name,
          capacity: table.capacity,
          location: table.location,
          status: 'libre', // Por defecto todas libres
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }));
        
        // Sincronizar con Firebase para obtener estados actuales
        const syncedTables = await syncTableStates(restaurantId, tablesWithStatus);
        setTables(syncedTables);
        setLastUpdate(new Date());
      } else {
        console.log('⚠️ No tables found for restaurant');
        setTables([]);
      }
    } catch (error) {
      console.error('❌ Error loading tables:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Actualizar estado de una mesa específica
  const updateTableStatus = useCallback(async (
    tableId: string, 
    newStatus: 'libre' | 'ocupada' | 'reservada',
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
            client: newStatus === 'libre' ? undefined : client,
            lastUpdated: now,
            updatedBy: 'gerente'
          }
        : table
    ));
    
    setLastUpdate(new Date());
    
    // Guardar en Firebase para sincronización con Retell AI
    try {
      await updateTableStateInFirebase(restaurantId, tableId, {
        status: newStatus,
        client: newStatus === 'libre' ? undefined : client,
        lastUpdated: now,
        updatedBy: 'gerente'
      });
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
      toast.error('Error al sincronizar con el sistema');
    }
    
    // Mostrar toast de confirmación
    const tableName = tables.find(t => t.id === tableId)?.name || tableId;
    const statusText = newStatus === 'libre' ? 'liberada' : 
                      newStatus === 'ocupada' ? 'ocupada' : 'reservada';
    toast.success(`Mesa ${tableName} ${statusText} correctamente`);
    
    console.log(`🔄 Table ${tableId} status updated to ${newStatus} by gerente`);
  }, [tables, restaurantId]);

  // Obtener mesas por estado
  const getTablesByStatus = useCallback((status: 'libre' | 'ocupada' | 'reservada' | 'all') => {
    if (status === 'all') return tables;
    return tables.filter(table => table.status === status);
  }, [tables]);

  // Obtener métricas de las mesas (memoizado para mejor rendimiento)
  const metrics = useMemo(() => {
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
    const reservedTables = tables.filter(t => t.status === 'reservada').length;
    const freeTables = tables.filter(t => t.status === 'libre').length;
    
    return {
      totalTables,
      occupiedTables,
      reservedTables,
      freeTables,
      averageOccupancy: totalTables > 0 ? Math.round(((occupiedTables + reservedTables) / totalTables) * 100) : 0
    };
  }, [tables]);

  // Función para sincronizar con Firebase (cambios de Retell AI)
  const syncWithFirebase = useCallback(async () => {
    if (tables.length === 0) return;
    
    try {
      console.log('🔄 Auto-syncing table states with Firebase...');
      const syncedTables = await syncTableStates(restaurantId, tables);
      
      // Solo actualizar si hay cambios
      const hasChanges = JSON.stringify(syncedTables) !== JSON.stringify(tables);
      if (hasChanges) {
        console.log('📊 Table states updated from Firebase (Retell AI changes)');
        setTables(syncedTables);
        setLastUpdate(new Date());
        toast.info('🔄 Estados de mesas sincronizados con Retell AI');
      }
    } catch (error) {
      console.error('❌ Error during auto-sync:', error);
    }
  }, [restaurantId, tables]);

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
