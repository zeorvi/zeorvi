'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Table, getTablesByStatus, updateTableStatus, getRestaurantMetrics } from '@/lib/restaurantData';

interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

export default function TablePlan({ isDarkMode = false }: TablePlanProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'libre' | 'ocupada' | 'reservada'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState(getRestaurantMetrics());

  // Cargar mesas con actualización automática más frecuente
  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  // Filtrar mesas
  useEffect(() => {
    let filtered = tables;
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(table => table.status === statusFilter);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.client?.phone.includes(searchTerm)
      );
    }
    
    setFilteredTables(filtered);
  }, [tables, statusFilter, searchTerm]);

  const loadTables = () => {
    setIsLoading(true);
    try {
      const allTables = getTablesByStatus('all');
      setTables(allTables);
      setMetrics(getRestaurantMetrics());
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableAction = (tableId: string, action: 'liberar' | 'ocupar' | 'reservar') => {
    try {
      let newStatus: Table['status'];
      let client = undefined;
      let reservation = undefined;

      switch (action) {
        case 'liberar':
          newStatus = 'libre';
          break;
        case 'ocupar':
          newStatus = 'ocupada';
          // Mantener cliente y reserva existentes
          const table = tables.find(t => t.id === tableId);
          client = table?.client;
          reservation = table?.reservation;
          break;
        case 'reservar':
          newStatus = 'reservada';
          // Mantener cliente y reserva existentes
          const tableRes = tables.find(t => t.id === tableId);
          client = tableRes?.client;
          reservation = tableRes?.reservation;
          break;
      }

      updateTableStatus(tableId, newStatus, client, reservation);
      loadTables();
      toast.success(`Mesa ${tableId} ${action === 'liberar' ? 'liberada' : action === 'ocupar' ? 'ocupada' : 'reservada'} correctamente`);
    } catch (error) {
      console.error('Error al actualizar mesa:', error);
      toast.error('Error al actualizar la mesa');
    }
  };

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'libre':
        return 'bg-green-600 text-white border-green-700 shadow-lg font-bold';
      case 'ocupada':
        return 'bg-red-600 text-white border-red-700 shadow-lg font-bold';
      case 'reservada':
        return 'bg-yellow-600 text-white border-yellow-700 shadow-lg font-bold';
      default:
        return 'bg-gray-600 text-white border-gray-700 shadow-lg font-bold';
    }
  };

  const getTableCardStyle = (status: Table['status']) => {
    switch (status) {
      case 'libre':
        return 'border-l-8 border-l-green-600 shadow-xl bg-green-50';
      case 'ocupada':
        return 'border-l-8 border-l-red-600 shadow-xl bg-red-50';
      case 'reservada':
        return 'border-l-8 border-l-yellow-600 shadow-xl bg-yellow-50';
      default:
        return 'border-l-8 border-l-gray-600 shadow-xl bg-gray-50';
    }
  };

  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'libre':
        return 'Libre';
      case 'ocupada':
        return 'Ocupada';
      case 'reservada':
        return 'Reservada';
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
        {filteredTables.map((table) => (
          <div 
            key={table.id} 
            className={`
              relative p-4 md:p-8 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg min-h-[120px] md:min-h-[140px] flex flex-col items-center justify-center
              ${table.status === 'libre' ? 'bg-green-500' : 
                table.status === 'ocupada' ? 'bg-red-500' : 
                'bg-yellow-400'}
            `}
            onClick={() => {
              if (table.client) {
                toast.info(`Mesa ${table.name} - ${table.client.name} (${table.client.phone})`);
              } else {
                toast.info(`Mesa ${table.name} - ${getStatusText(table.status)}`);
              }
            }}
          >
            {/* Nombre de la mesa */}
            <div className="text-center mb-2 md:mb-3">
              <div className="font-bold text-lg md:text-2xl text-white">{table.name}</div>
              </div>

            {/* Información del cliente (si existe) */}
              {table.client && (
              <div className="space-y-2 text-center text-white">
                {table.reservation && (
                  <div className="font-bold text-sm md:text-lg">
                    {table.reservation.time}
                  </div>
                )}
                <div className="font-bold text-sm md:text-base truncate" title={table.client.name}>
                  {table.client.name}
                </div>
                {table.reservation && (
                  <div className="font-bold text-sm md:text-base">
                    {table.reservation.people} pers.
                  </div>
                )}
                <div className="text-sm truncate" title={table.client.phone}>
                  {table.client.phone}
                </div>
              </div>
            )}

            {/* Capacidad (solo si no hay cliente) */}
            {!table.client && (
              <div className="text-center text-sm text-white">
                <div>{table.capacity} pers.</div>
                <div className="mt-1">{table.location}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
