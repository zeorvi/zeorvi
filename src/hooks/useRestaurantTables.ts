import { useState, useEffect, useCallback, useMemo } from 'react';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { toast } from 'sonner';
import { laGaviotaConfig, otroRestauranteConfig } from '@/lib/restaurantConfigs';

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

  // Cargar mesas iniciales desde configuración predefinida o base de datos
  const loadTables = useCallback(async () => {
    if (!restaurantId) {
      console.log('❌ No restaurantId provided');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔍 Loading tables for restaurant:', restaurantId);
      const restaurantData = await getRestaurantById(restaurantId);
      console.log('📊 Restaurant data received:', restaurantData);
      
      // Verificar si hay configuración de mesas en el restaurante
      const tablesConfig = restaurantData?.config?.tables;
      
      if (tablesConfig && Array.isArray(tablesConfig)) {
        console.log('✅ Tables found in database config:', tablesConfig);
        
        // Convertir las mesas del restaurante al formato con estado
        const tablesWithStatus: TableStatus[] = tablesConfig.map((table: any) => ({
          id: table.id || `table-${Math.random().toString(36).substr(2, 9)}`,
          name: table.name || `Mesa ${table.id}`,
          capacity: table.capacity || 4,
          location: table.location || 'Sala principal',
          status: 'available', // Por defecto todas libres
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }));
        
        setTables(tablesWithStatus);
        setLastUpdate(new Date());
      } else {
        // Si no hay configuración en la base de datos, usar configuraciones predefinidas
        console.log('⚠️ No tables configuration found in database, using predefined configs');
        
        let predefinedConfig;
        if (restaurantId === 'rest_003' || restaurantData?.name?.toLowerCase().includes('gaviota')) {
          predefinedConfig = laGaviotaConfig;
          console.log('🏖️ Using La Gaviota predefined config');
        } else if (restaurantId === 'rest_001' || restaurantData?.name?.toLowerCase().includes('buen sabor') || restaurantData?.name?.toLowerCase().includes('parrilla')) {
          predefinedConfig = otroRestauranteConfig;
          console.log('🍽️ Using El Buen Sabor/La Parrilla predefined config');
        }
        
        if (predefinedConfig && predefinedConfig.tables) {
          console.log('✅ Tables found in predefined config:', predefinedConfig.tables.length);
          console.log('📋 Predefined tables:', predefinedConfig.tables);
          
          // Convertir las mesas predefinidas al formato con estado
          const tablesWithStatus: TableStatus[] = predefinedConfig.tables.map((table: any) => ({
            id: table.id || `table-${Math.random().toString(36).substr(2, 9)}`,
            name: table.name || `Mesa ${table.id}`,
            capacity: table.capacity || 4,
            location: table.location || 'Sala principal',
            status: 'available', // Por defecto todas libres
            lastUpdated: new Date().toISOString(),
            updatedBy: 'system'
          }));
          
          console.log('🔄 Converted tables:', tablesWithStatus);
          setTables(tablesWithStatus);
          setLastUpdate(new Date());
          console.log('✅ Tables set successfully');
        } else {
          console.log('❌ No predefined config found for restaurant');
          setTables([]);
        }
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
