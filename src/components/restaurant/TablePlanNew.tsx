'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Users, Clock, MapPin, Search } from 'lucide-react';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import OccupyTableDialog from './OccupyTableDialog';
import { toast } from 'sonner';

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
  
  console.log('📊 [TablePlanNew] Estado actual:', {
    restaurantId,
    tablesCount: tables.length,
    isLoading,
    tables: tables.map(t => ({ id: t.id, name: t.name, status: t.status }))
  });
  
  const [filteredTables, setFilteredTables] = useState(tables);
  const [statusFilter, setStatusFilter] = useState<'available' | 'occupied' | 'reserved' | 'maintenance' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<{
    id: string;
    name: string;
    capacity: number;
    location?: string;
    status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'occupied' | 'reserved' | null>(null);

  // Filtrar mesas cuando cambian los filtros o las mesas
  useEffect(() => {
    console.log('🔍 Filtrando mesas:', {
      totalTables: tables.length,
      statusFilter,
      searchTerm,
      tables: tables.map(t => ({ id: t.id, name: t.name, status: t.status }))
    });
    
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
    
    console.log('✅ Mesas filtradas:', filtered.length);
    setFilteredTables(filtered);
  }, [tables, statusFilter, searchTerm]);

  // Debug adicional
  if (!restaurantId) {
    console.error('❌ No restaurantId provided to TablePlan');
    return <div>Error: No restaurant ID provided</div>;
  }

  const handleTableStatusChange = (tableId: string, newStatus: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    const table = tables.find(t => t.id === tableId);
    
    if (!table) {
      console.error('Mesa no encontrada:', tableId);
      return;
    }
    
    // Si es ocupar o reservar, mostrar el modal para capturar datos
    if (newStatus === 'occupied' || newStatus === 'reserved') {
      setSelectedTable(table);
      setPendingStatus(newStatus);
      setDialogOpen(true);
    } else {
      // Para liberar o mantenimiento, actualizar directamente
      updateTableStatus(tableId, newStatus);
      
      // Cambiar el filtro para mostrar el nuevo estado de la mesa
      setStatusFilter(newStatus);
      
      toast.success(`Mesa ${table.name} actualizada a: ${getStatusText(newStatus)}`);
    }
  };

  const handleConfirmOccupy = async (data: {
    cliente: string;
    telefono: string;
    personas: number;
    notas?: string;
  }) => {
    if (!selectedTable || !pendingStatus) return;

    try {
      console.log('📝 Creando reserva para mesa:', selectedTable.name);
      console.log('   Estado:', pendingStatus);
      console.log('   Datos:', data);

      // Llamar al endpoint para crear la reserva en Google Sheets
      const response = await fetch('/api/restaurant/occupy-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          mesaId: selectedTable.id,
          mesaNombre: selectedTable.name,
          zona: selectedTable.location,
          cliente: data.cliente,
          telefono: data.telefono,
          personas: data.personas,
          notas: data.notas,
          estado: pendingStatus, // 'occupied' o 'reserved'
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar el estado local de la mesa
        updateTableStatus(selectedTable.id, pendingStatus, {
          name: data.cliente,
          phone: data.telefono,
          partySize: data.personas,
          notes: data.notas
        });

        // Cambiar el filtro para mostrar el nuevo estado de la mesa
        setStatusFilter(pendingStatus);

        toast.success(`✅ Mesa ${selectedTable.name} ${pendingStatus === 'occupied' ? 'ocupada' : 'reservada'} exitosamente`);
        toast.info(`⏰ Se liberará automáticamente en 2 horas`);
        
        console.log('✅ Reserva creada:', result.reservaId);
        
        // Cerrar el diálogo
        setDialogOpen(false);
        setSelectedTable(null);
        setPendingStatus(null);
      } else {
        toast.error(`Error: ${result.error}`);
        console.error('Error al crear reserva:', result.error);
      }
    } catch (error) {
      console.error('Error al ocupar mesa:', error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setDialogOpen(false);
      setSelectedTable(null);
      setPendingStatus(null);
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

  // Si no hay mesas en absoluto (no es problema de filtro)
  if (!isLoading && tables.length === 0) {
    return (
      <div className={`p-6 text-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="max-w-md mx-auto">
          <div className="text-4xl mb-4">🪑</div>
          <h3 className="text-xl font-semibold mb-2">No hay mesas configuradas</h3>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Este restaurante aún no tiene mesas en Google Sheets.
          </p>
          <Button onClick={() => refreshTables()} className="bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>
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
          
          <div className="flex space-x-2 flex-wrap">
            {['all', 'available', 'occupied', 'reserved', 'maintenance'].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={statusFilter === status ? 'bg-blue-500 text-white' : isDarkMode ? 'text-white border-gray-600 hover:bg-gray-700 bg-gray-800' : ''}
              >
                {status === 'all' ? 'Todas' :
                 status === 'available' ? 'Libres' :
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

      {/* Modal para ocupar/reservar mesa */}
      {selectedTable && (
        <OccupyTableDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedTable(null);
            setPendingStatus(null);
          }}
          onConfirm={handleConfirmOccupy}
          tableName={selectedTable.name}
          tableCapacity={selectedTable.capacity}
        />
      )}
    </div>
  );
}
