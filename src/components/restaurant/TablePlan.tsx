'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Clock,
  Users,
  Phone,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Table, getTablesByStatus, updateTableStatus, getRestaurantMetrics } from '@/lib/restaurantData';

interface TablePlanProps {
  restaurantId: string;
}

export default function TablePlan({ }: TablePlanProps) {
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
    <div className="space-y-6">


      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar mesa o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'libre' | 'ocupada' | 'reservada')}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todas las mesas</option>
                <option value="libre">Mesas libres</option>
                <option value="ocupada">Mesas ocupadas</option>
                <option value="reservada">Mesas reservadas</option>
              </select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.success('Aplicando filtros al plano de mesas')}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtro
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.success('Ordenando mesas por criterio')}
              >
                <SortAsc className="h-4 w-4 mr-1" />
                Ordenar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Mesas</p>
                <p className="text-xl font-bold text-gray-900">{metrics.totalTables}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Libres</p>
                <p className="text-xl font-bold text-green-600">{metrics.freeTables}</p>
              </div>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Ocupadas</p>
                <p className="text-xl font-bold text-red-600">{metrics.occupiedTables}</p>
              </div>
              <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Reservadas</p>
                <p className="text-xl font-bold text-yellow-600">{metrics.reservedTables}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {filteredTables.map((table) => (
          <Card key={table.id} className={`hover:shadow-lg transition-all duration-200 hover:scale-105 ${getTableCardStyle(table.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{table.name}</CardTitle>
                <Badge className={getStatusColor(table.status)}>
                  {getStatusText(table.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                Capacidad: {table.capacity}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <div className="h-4 w-4 mr-2 rounded bg-gray-300"></div>
                {table.location}
              </div>

              {table.client && (
                <>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {table.client.name}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {table.client.phone}
                  </div>

                  {table.reservation && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {table.reservation.time}
                    </div>
                  )}
                </>
              )}

              {/* Acciones */}
              <div className="flex space-x-2 pt-2">
                {table.status === 'libre' && (
                  <Button
                    size="sm"
                    onClick={() => handleTableAction(table.id, 'reservar')}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
                  >
                    Reservar
                  </Button>
                )}
                
                {table.status === 'reservada' && (
                  <Button
                    size="sm"
                    onClick={() => handleTableAction(table.id, 'ocupar')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-600"
                  >
                    Ocupar
                  </Button>
                )}
                
                {(table.status === 'ocupada' || table.status === 'reservada') && (
                  <Button
                    size="sm"
                    onClick={() => handleTableAction(table.id, 'liberar')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-600"
                  >
                    Liberar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron mesas</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay mesas que coincidan con los filtros actuales'}
          </p>
        </div>
      )}
    </div>
  );
}
