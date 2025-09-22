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
  // Usar el hook global de mesas
  const { 
    tables, 
    isLoading, 
    updateTableStatus, 
    getMetrics,
    refreshTables 
  } = useRestaurantTables(restaurantId);
  
  const [filteredTables, setFilteredTables] = useState(tables);
  const [statusFilter, setStatusFilter] = useState<'all' | 'libre' | 'ocupada' | 'reservada'>('all');
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
        table.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTables(filtered);
  }, [tables, statusFilter, searchTerm]);

  const handleTableStatusChange = (tableId: string, newStatus: 'libre' | 'ocupada' | 'reservada') => {
    if (newStatus === 'ocupada' || newStatus === 'reservada') {
      // Simular datos de cliente para demo
      const clientData = {
        name: 'Cliente Walk-in',
        phone: '+34 600 000 000',
        partySize: Math.floor(Math.random() * 4) + 1,
        notes: newStatus === 'ocupada' ? 'Mesa ocupada por el gerente' : 'Reserva manual'
      };
      updateTableStatus(tableId, newStatus, clientData);
    } else {
      updateTableStatus(tableId, newStatus);
    }
  };

  const getStatusColor = (status: 'libre' | 'ocupada' | 'reservada') => {
    switch (status) {
      case 'libre': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'ocupada': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'reservada': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getStatusText = (status: 'libre' | 'ocupada' | 'reservada') => {
    switch (status) {
      case 'libre': return 'Libre';
      case 'ocupada': return 'Ocupada';
      case 'reservada': return 'Reservada';
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
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Control de Mesas</h1>
          
          <Button
            onClick={refreshTables}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalTables}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Mesas</div>
            </CardContent>
          </Card>
          
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.freeTables}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Libres</div>
            </CardContent>
          </Card>
          
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.occupiedTables}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ocupadas</div>
            </CardContent>
          </Card>
          
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics.reservedTables}</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reservadas</div>
            </CardContent>
          </Card>
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
            {['all', 'libre', 'ocupada', 'reservada'].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === status ? 'bg-blue-500 text-white' : ''}
              >
                {status === 'all' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => (
          <Card key={table.id} className={`transition-all duration-300 hover:shadow-lg ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {table.name}
                </CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {getStatusText(table.status)}
                </Badge>
              </div>
              <CardDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
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
              {table.client && (
                <div className={`mb-4 p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {table.client.name}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {table.client.phone} • {table.client.partySize} personas
                  </div>
                  {table.client.notes && (
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {table.client.notes}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'libre')}
                  size="sm"
                  variant={table.status === 'libre' ? 'default' : 'outline'}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Liberar
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'ocupada')}
                  size="sm"
                  variant={table.status === 'ocupada' ? 'default' : 'outline'}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Ocupar
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'reservada')}
                  size="sm"
                  variant={table.status === 'reservada' ? 'default' : 'outline'}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Reservar
                </Button>
              </div>
              
              <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <Clock className="h-3 w-3 inline mr-1" />
                Actualizada: {new Date(table.lastUpdated).toLocaleTimeString()}
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
