'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';

interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

interface TableWithReservation {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  clientName?: string;
  phone?: string;
  partySize?: number;
  reservationTime?: string;
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

export default function TablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  // Usar el hook global de mesas
  const { 
    tables: hookTables, 
    isLoading: hookIsLoading
  } = useRestaurantTables(restaurantId);
  
  // Estado local para mesas con reservas aplicadas
  const [tablesWithReservations, setTablesWithReservations] = useState<TableWithReservation[]>([]);
  
  // Usar mesas con reservas si están disponibles, si no las del hook
  const tables = useMemo(() => {
    return tablesWithReservations.length > 0 ? tablesWithReservations : hookTables;
  }, [tablesWithReservations, hookTables]);
  
  const isLoading = hookIsLoading;
  
  // Sincronizar mesas con reservas del día
  useEffect(() => {
    if (!hookIsLoading && hookTables.length > 0) {
      const syncReservations = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&fecha=${today}`);
          
          if (response.ok) {
            const data = await response.json();
            
            const reservasArray = Array.isArray(data.reservas) ? data.reservas : [];
            
            if (data.success && reservasArray.length > 0) {
              // Crear mapa de reservas por mesa
              const reservationMap = new Map();
              
              reservasArray.forEach((reserva: Record<string, unknown>) => {
                const mesaNombre = ((reserva.Mesa as string) || (reserva.mesa as string) || '').toLowerCase().trim();
                const estado = ((reserva.Estado as string) || (reserva.estado as string) || '').toLowerCase().trim();
                
                // Solo considerar reservas activas
                if (mesaNombre && mesaNombre !== 'por asignar' && estado !== 'completada' && estado !== 'cancelada') {
                  reservationMap.set(mesaNombre, {
                    clientName: reserva.Cliente || reserva.cliente,
                    phone: reserva.Telefono || reserva.telefono,
                    partySize: reserva.Personas || reserva.personas,
                    time: reserva.Hora || reserva.hora,
                    estado
                  });
                }
              });
              
              // Aplicar reservas a las mesas
              const updatedTables: TableWithReservation[] = hookTables.map(table => {
                const tableName = table.name.toLowerCase();
                const reservation = reservationMap.get(tableName) || 
                                  reservationMap.get(tableName.replace(/\s+/g, '')) ||
                                  Array.from(reservationMap.entries()).find(([key]) => 
                                    key.includes(tableName) || tableName.includes(key)
                                  )?.[1];
                
                if (reservation) {
                  return {
                    ...table,
                    status: (reservation.estado === 'ocupada' ? 'occupied' : 'reserved') as 'available' | 'occupied' | 'reserved' | 'maintenance',
                    clientName: reservation.clientName,
                    phone: reservation.phone,
                    partySize: reservation.partySize,
                    reservationTime: reservation.time
                  };
                }
                
                return table as TableWithReservation;
              });
              
              setTablesWithReservations(updatedTables);
              console.log('✅ Mesas sincronizadas con', reservasArray.length, 'reservas');
            } else {
              setTablesWithReservations(hookTables as TableWithReservation[]);
            }
          }
        } catch (error) {
          console.error('Error sincronizando reservas:', error);
          setTablesWithReservations(hookTables as TableWithReservation[]);
        }
      };
      
      syncReservations();
      
      // Auto-refresh cada 3 minutos
      const interval = setInterval(syncReservations, 180000);
      return () => clearInterval(interval);
    }
  }, [hookTables, hookIsLoading, restaurantId]);

  const getStatusText = (status: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    switch (status) {
      case 'available':
        return 'Libre';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando mesas...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Título y Leyenda */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
        <h1 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>Plano de Mesas</h1>
        
        {/* Leyenda */}
        <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Libre</span>
            </div>
            <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Reservada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Ocupada</span>
              </div>
            </div>
      </div>

      {/* Grid de mesas - 6 columnas y más grandes */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 max-w-6xl mx-auto">
        {tables.map((table) => (
          <div 
            key={table.id} 
            className={`
              relative p-4 md:p-8 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg min-h-[120px] md:min-h-[140px] flex flex-col items-center justify-center
              ${table.status === 'available' ? 'bg-green-500' : 
                table.status === 'occupied' ? 'bg-red-500' : 
                'bg-yellow-400'}
            `}
            onClick={() => {
              toast.info(`Mesa ${table.name} - ${getStatusText(table.status)}`);
            }}
          >
            {/* Nombre de la mesa */}
            <div className="text-center mb-2 md:mb-3">
              <div className="font-bold text-lg md:text-2xl text-white">{table.name}</div>
              </div>

            {/* Capacidad */}
            <div className="text-center text-sm text-white">
              <div>{table.capacity} pers.</div>
              <div className="mt-1">{table.location}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
