'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Users, Clock, MapPin, Search, Filter, Calendar, Settings, Eye, EyeOff } from 'lucide-react';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

interface RestaurantSchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export default function TablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  console.log('🪑 Enhanced TablePlan component loaded for restaurant:', restaurantId);
  
  // Usar el hook global de mesas
  const { 
    tables, 
    isLoading, 
    updateTableStatus, 
    getMetrics,
    refreshTables 
  } = useRestaurantTables(restaurantId);
  
  const [filteredTables, setFilteredTables] = useState(tables);
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [restaurantSchedule, setRestaurantSchedule] = useState<RestaurantSchedule>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  });
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);

  // Normalizar estados de mesas
  const normalizeTableStatus = (status: string): TableStatus => {
    return status as TableStatus;
  };

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

  // Verificar si el restaurante está abierto hoy
  useEffect(() => {
    const today = new Date().getDay(); // 0 = domingo, 1 = lunes, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const todayName = dayNames[today];
    
    setIsRestaurantOpen(restaurantSchedule[todayName]);
  }, [restaurantSchedule]);

  const handleTableStatusChange = (tableId: string, newStatus: TableStatus) => {
    if (!isRestaurantOpen) {
      toast.error('El restaurante está cerrado hoy');
      return;
    }

    if (newStatus === 'occupied' || newStatus === 'reserved') {
      // Simular datos de cliente para demo
      const clientData = {
        name: 'Cliente Walk-in',
        phone: '+34 600 000 000',
        partySize: Math.floor(Math.random() * 4) + 1,
        notes: 'Mesa ocupada por el gerente'
      };
      updateTableStatus(tableId, newStatus, clientData);
    } else {
      updateTableStatus(tableId, newStatus);
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'occupied': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'reserved': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'maintenance': return 'bg-gray-500 hover:bg-gray-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getCardBackgroundColor = (status: TableStatus) => {
    // Las tarjetas cambian de color según el estado
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

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'Libre';
      case 'occupied': return 'Ocupada';
      case 'reserved': return 'Reservada';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'available': return '🟢';
      case 'occupied': return '🔴';
      case 'reserved': return '🟡';
      case 'maintenance': return '⚫';
      default: return '⚪';
    }
  };

  const metrics = getMetrics();

  const saveSchedule = () => {
    // Aquí guardarías el horario en la base de datos
    toast.success('Horario del restaurante actualizado');
    setShowScheduleDialog(false);
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
    <div className={`p-3 sm:p-4 md:p-5 lg:p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      
      {/* Header con estado del restaurante */}
      <div className="mb-4 sm:mb-5 md:mb-6">
        {/* Estado del restaurante */}
        <div className={`flex items-center justify-between p-3 sm:p-4 md:p-5 rounded-lg mb-4 ${
          isRestaurantOpen 
            ? (isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200')
            : (isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200')
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isRestaurantOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-sm sm:text-base md:text-lg font-semibold ${
              isRestaurantOpen 
                ? (isDarkMode ? 'text-green-300' : 'text-green-800')
                : (isDarkMode ? 'text-red-300' : 'text-red-800')
            }`}>
              {isRestaurantOpen ? 'Restaurante Abierto' : 'Restaurante Cerrado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 md:h-10 md:px-4">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Horario</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Horario del Restaurante</DialogTitle>
                  <DialogDescription>
                    Configura los días que el restaurante está abierto
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {[
                    { key: 'monday', label: 'Lunes' },
                    { key: 'tuesday', label: 'Martes' },
                    { key: 'wednesday', label: 'Miércoles' },
                    { key: 'thursday', label: 'Jueves' },
                    { key: 'friday', label: 'Viernes' },
                    { key: 'saturday', label: 'Sábado' },
                    { key: 'sunday', label: 'Domingo' }
                  ].map((day) => (
                    <div key={day.key} className="flex items-center justify-between">
                      <Label htmlFor={day.key} className="text-sm font-medium">
                        {day.label}
                      </Label>
                      <Switch
                        id={day.key}
                        checked={restaurantSchedule[day.key as keyof RestaurantSchedule]}
                        onCheckedChange={(checked) => 
                          setRestaurantSchedule(prev => ({
                            ...prev,
                            [day.key]: checked
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button onClick={saveSchedule} className="flex-1">
                    Guardar Horario
                  </Button>
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => {
                // Función para marcar todas las mesas como "ocupada" (rojo)
                const allTables = filteredTables;
                allTables.forEach(table => {
                  handleTableStatusChange(table.id, 'occupied');
                });
              }}
              variant="outline"
              size="sm"
              className={`h-8 w-auto px-3 sm:h-9 sm:px-4 md:h-10 md:px-5 bg-red-500 hover:bg-red-600 text-white font-semibold border-red-500 ${
                !isRestaurantOpen ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isRestaurantOpen}
            >
              <span className="text-sm sm:text-base">🔴 Día Completo</span>
            </Button>
          </div>
        </div>

        {/* Métricas responsive - optimizado para tablets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-4 sm:mb-5 md:mb-6">
          <div className={`px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 rounded-lg text-center shadow-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600">{metrics.totalTables}</div>
            <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
          </div>
          
          <div className={`px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 rounded-lg text-center shadow-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="text-base sm:text-lg md:text-xl font-bold text-green-600">{metrics.freeTables}</div>
            <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Libres</div>
          </div>
          
          <div className={`px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 rounded-lg text-center shadow-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="text-base sm:text-lg md:text-xl font-bold text-red-600">{metrics.occupiedTables}</div>
            <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ocupadas</div>
          </div>
          
          <div className={`px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 rounded-lg text-center shadow-sm ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-600">{metrics.reservedTables}</div>
            <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reservadas</div>
          </div>
        </div>

        {/* Filtros responsive - optimizados para tablets */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
          <div className="flex-1">
            <Input
              placeholder="Buscar mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`text-sm sm:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {['available', 'occupied', 'reserved'].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={`text-sm px-3 sm:px-4 py-2 sm:py-2.5 ${
                  statusFilter === status 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'text-white border-gray-600 hover:bg-gray-700 bg-gray-800' 
                      : ''
                }`}
              >
                {status === 'available' ? 'Libres' :
                 status === 'occupied' ? 'Ocupadas' :
                 status === 'reserved' ? 'Reservadas' : status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Mesas responsive - optimizado para tablets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
        {filteredTables.map((table) => (
          <Card key={table.id} className={`transition-all duration-300 hover:shadow-lg hover:scale-105 ${
            getCardBackgroundColor(normalizeTableStatus(table.status))
          }`}>
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg md:text-xl text-white font-bold">
                  {table.name}
                </CardTitle>
                <Badge className={`text-xs sm:text-sm px-2 py-1 ${getStatusColor(normalizeTableStatus(table.status))}`}>
                  {getStatusIcon(normalizeTableStatus(table.status))} {getStatusText(normalizeTableStatus(table.status))}
                </Badge>
              </div>
              <CardDescription className="text-white/90">
                <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4 text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {table.capacity} personas
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {table.location}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Botones de estado - optimizados para tablets */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'available')}
                  size="sm"
                  variant={table.status === 'available' ? 'default' : 'outline'}
                  className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold"
                  disabled={!isRestaurantOpen}
                >
                  Libre
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'occupied')}
                  size="sm"
                  variant={table.status === 'occupied' ? 'default' : 'outline'}
                  className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold"
                  disabled={!isRestaurantOpen}
                >
                  Ocupar
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'reserved')}
                  size="sm"
                  variant={table.status === 'reserved' ? 'default' : 'outline'}
                  className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                  disabled={!isRestaurantOpen}
                >
                  Reservar
                </Button>
              </div>
              
              <div className="text-sm text-white/80 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {table.lastUpdated ? new Date(table.lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12 sm:py-16 md:py-20">
          <div className="text-gray-400 mb-4">
            🪑 No hay mesas que coincidan con los filtros
          </div>
          <Button
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
            variant="outline"
            size="sm"
            className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
