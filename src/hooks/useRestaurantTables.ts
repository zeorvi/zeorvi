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
    console.log('🚀 [useRestaurantTables] loadTables called');
    
    if (!restaurantId) {
      console.warn('⚠️ [useRestaurantTables] No restaurantId provided');
      return;
    }
    
    console.log(`🔄 [useRestaurantTables] Loading tables for ${restaurantId}...`);
    setIsLoading(true);
    try {
      // Timeout de 25 segundos para Google Sheets
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const response = await fetch(`/api/google-sheets/mesas?restaurantId=${restaurantId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log(`📦 [useRestaurantTables] Resultado del API:`, {
        success: result.success,
        dataType: typeof result.data,
        isArray: Array.isArray(result.data),
        dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
        data: result.data
      });
      
      // Validar que result.data sea un array
      const tablesArray = Array.isArray(result.data) ? result.data : [];
      
      console.log(`📋 [useRestaurantTables] Mesas array:`, {
        length: tablesArray.length,
        firstItem: tablesArray[0]
      });
      
      if (result.success && tablesArray.length > 0) {
        // Obtener reservas activas para calcular estados reales
        const reservationsResponse = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}`);
        const reservationsData = await reservationsResponse.json();
        const activeReservations = Array.isArray(reservationsData.reservas) ? reservationsData.reservas : [];
        
        // Función para calcular si una mesa está realmente ocupada/reservada
        const calculateTableStatus = (tableId: string, staticStatus: string) => {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde medianoche
          
          // Normalizar ID de mesa para comparación (case-insensitive, sin espacios)
          const normalizedTableId = tableId.toLowerCase().trim().replace(/\s+/g, '');
          
          // Buscar reservas activas para esta mesa (comparación flexible)
          const activeReservation = activeReservations.find((reserva: any) => {
            const reservaMesa = (reserva.Mesa || '').toLowerCase().trim().replace(/\s+/g, '');
            const estado = (reserva.Estado || '').toLowerCase().trim();
            return reservaMesa === normalizedTableId && 
                   estado !== 'completada' && 
                   estado !== 'cancelada';
          });
          
          if (!activeReservation) {
            return 'available'; // Sin reserva activa = libre
          }
          
          // Calcular si la reserva ya terminó
          const reservationTime = activeReservation.Hora || '00:00';
          
          // Normalizar hora: aceptar tanto "13:30" como "13.30"
          const normalizedTime = reservationTime.replace('.', ':');
          const timeParts = normalizedTime.split(':');
          
          if (timeParts.length < 2) {
            console.warn(`⚠️ [useRestaurantTables] Formato de hora inválido para mesa ${tableId}: "${reservationTime}"`);
            return 'available'; // Si no podemos parsear la hora, marcar como libre
          }
          
          const hours = parseInt(timeParts[0]) || 0;
          const minutes = parseInt(timeParts[1]) || 0;
          const reservationStartTime = hours * 60 + minutes;
          
          // Duración estimada: 2 horas para comida, 2.5 horas para cena
          const isDinnerTime = hours >= 20 || hours < 2;
          const estimatedDuration = isDinnerTime ? 150 : 120; // minutos
          const reservationEndTime = reservationStartTime + estimatedDuration;
          
          // Verificar si la reserva ya terminó
          if (currentTime > reservationEndTime) {
            return 'available';
          }
          
          // Verificar si la reserva está activa ahora
          if (currentTime >= reservationStartTime && currentTime <= reservationEndTime) {
            return activeReservation.Estado === 'ocupada' ? 'occupied' : 'reserved';
          }
          
          // Reserva futura: mostrar como reservada 1 hora antes
          const oneHourBefore = reservationStartTime - 60; // 60 minutos antes
          if (currentTime >= oneHourBefore && currentTime < reservationStartTime) {
            return 'reserved'; // Mesa reservada (aparece en amarillo)
          }
          
          // Muy pronto para la reserva (más de 1 hora antes)
          if (currentTime < oneHourBefore) {
            return 'available'; // Mesa libre
          }
          
          // Por defecto (no debería llegar aquí)
          return 'available';
        };
        
        // Convertir las mesas de Google Sheets al formato esperado con estado calculado
        console.log(`📊 [useRestaurantTables] Mesas recibidas de Google Sheets: ${tablesArray.length}`);
        console.log(`📋 [useRestaurantTables] Primeras mesas:`, tablesArray.slice(0, 3));
        
        const tablesWithStatus: TableStatus[] = tablesArray.map((table: Record<string, unknown>) => {
          const tableId = (table.ID as string) || '';
          const staticStatus = (table.Estado as string) || 'Libre';
          const calculatedStatus = calculateTableStatus(tableId, staticStatus);
          
          console.log(`🔍 [useRestaurantTables] Procesando mesa ${tableId}:`, {
            staticStatus,
            calculatedStatus
          });
          
          return {
            id: tableId || `table-${Math.random().toString(36).substr(2, 9)}`,
            name: tableId || `Mesa ${table.ID}`,
          capacity: (table.Capacidad as number) || 4,
          location: (table.Zona as string) || 'Sala principal',
            status: calculatedStatus,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
          };
        });
        
        console.log(`✅ [useRestaurantTables] Total mesas procesadas: ${tablesWithStatus.length}`);
        console.log(`📋 [useRestaurantTables] Estados de mesas:`, 
          tablesWithStatus.map(t => ({ id: t.id, status: t.status }))
        );
        
        setTables(tablesWithStatus);
        setLastUpdate(new Date());
      } else {
        console.warn(`⚠️ [useRestaurantTables] No se cargaron mesas:`, {
          success: result.success,
          tablesArrayLength: tablesArray.length,
          result
        });
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
    console.log('🎯 [useRestaurantTables] useEffect triggered - calling loadTables');
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
