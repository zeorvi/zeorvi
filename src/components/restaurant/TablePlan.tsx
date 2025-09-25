'use client';

import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';

interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

export default function TablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  // Usar el hook global de mesas
  const { 
    tables, 
    isLoading
  } = useRestaurantTables(restaurantId);




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
