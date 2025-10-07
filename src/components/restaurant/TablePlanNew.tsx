'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Users, Clock, MapPin, Search } from 'lucide-react';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

export default function TablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  console.log('🪑 TablePlan component loaded for restaurant:', restaurantId);
  
  // Usar el hook global de mesas
  const { 
    tables, 
    isLoading, 
    updateTableStatus, 
    getMetrics,
    refreshTables 
  } = useRestaurantTables(restaurantId);
  
  console.log('📊 Tables from hook:', tables);
  console.log('⏳ Is loading:', isLoading);
  
  const [filteredTables, setFilteredTables] = useState(tables);
  const [statusFilter, setStatusFilter] = useState<'available' | 'occupied' | 'reserved' | 'maintenance' | 'all'>('available');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar mesas cuando cambian los filtros o las mesas
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
        (table.location && table.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredTables(filtered);
  }, [tables, statusFilter, searchTerm]);

  // Debug adicional
  if (!restaurantId) {
    console.error('❌ No restaurantId provided to TablePlan');
    return <div>Error: No restaurant ID provided</div>;
  }

  const handleTableStatusChange = (tableId: string, newStatus: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    if (newStatus === 'occupied' || newStatus === 'reserved') {
      // Simular datos de cliente para demo
      const clientData = {
        name: 'Cliente Walk-in',
        phone: '+34 600 000 000',
        partySize: Math.floor(Math.random() * 4) + 1,
        notes: newStatus === 'occupied' ? 'Mesa ocupada por el gerente' : 'Reserva manual'
      };
      updateTableStatus(tableId, newStatus, clientData);
    } else {
      updateTableStatus(tableId, newStatus);
    }
  };

  const getStatusColor = (status: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'occupied': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'maintenance': return 'bg-gray-500 hover:bg-gray-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  // Función para obtener el color de fondo de la card según el estado
  const getCardBackgroundColor = (status: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    if (isDarkMode) {
      switch (status) {
        case 'available': return 'bg-green-600 border-green-500';
        case 'occupied': return 'bg-red-600 border-red-500';
        case 'reserved': return 'bg-yellow-600 border-yellow-500';
        case 'maintenance': return 'bg-gray-600 border-gray-500';
        default: return 'bg-gray-800 border-gray-700';
      }
    } else {
      switch (status) {
        case 'available': return 'bg-green-500 border-green-600';
        case 'occupied': return 'bg-red-500 border-red-600';
        case 'reserved': return 'bg-yellow-500 border-yellow-600';
        case 'maintenance': return 'bg-gray-500 border-gray-600';
        default: return 'bg-white border-gray-200';
      }
    }
  };

  const getStatusText = (status: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    switch (status) {
      case 'available': return 'Libre';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  };

  const metrics = getMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando mesas...</span>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      
      {/* Header con métricas */}
      <div className="mb-6">

        {/* Métricas */}
        <div className="flex justify-center gap-3 mb-4">
          <div className={`px-3 py-2 rounded text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
            <div className="text-base font-bold text-blue-600">{metrics.totalTables}</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
          </div>
          
          <div className={`px-3 py-2 rounded text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
            <div className="text-base font-bold text-green-600">{metrics.freeTables}</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Libres</div>
          </div>
          
          <div className={`px-3 py-2 rounded text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
            <div className="text-base font-bold text-red-600">{metrics.occupiedTables}</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ocupadas</div>
          </div>
          
          <div className={`px-3 py-2 rounded text-center ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
            <div className="text-base font-bold text-yellow-600">{metrics.reservedTables}</div>
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reservadas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
            />
          </div>
          
          <div className="flex space-x-2">
            {['available', 'occupied', 'reserved', 'maintenance'].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === status ? 'bg-blue-500 text-white' : isDarkMode ? 'text-white border-gray-600 hover:bg-gray-700 bg-gray-800' : ''}
              >
                {status === 'available' ? 'Libres' :
                 status === 'occupied' ? 'Ocupadas' :
                 status === 'reserved' ? 'Reservadas' :
                 status === 'maintenance' ? 'Mantenimiento' : status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <Card key={table.id} className={`transition-all duration-300 hover:shadow-lg ${
            getCardBackgroundColor(table.status)
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">
                  {table.name}
                </CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {getStatusText(table.status)}
                </Badge>
              </div>
              <CardDescription className="text-white">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {table.capacity} personas
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {table.location}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'available')}
                  size="sm"
                  variant={table.status === 'available' ? 'default' : 'outline'}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Liberar
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'occupied')}
                  size="sm"
                  variant={table.status === 'occupied' ? 'default' : 'outline'}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Ocupar
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'reserved')}
                  size="sm"
                  variant={table.status === 'reserved' ? 'default' : 'outline'}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Reservar
                </Button>
              </div>
              
              <div className="text-xs mt-2 text-white/80">
                <Clock className="h-3 w-3 inline mr-1" />
                Actualizada: {table.lastUpdated ? new Date(table.lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className={`text-gray-400 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            🪑 No hay mesas que coincidan con los filtros
          </div>
          <Button
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
            variant="outline"
            size="sm"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
