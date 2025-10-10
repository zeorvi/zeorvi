"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Clock, Users, Search, Filter, Calendar, Settings, Sun, Moon, Wifi, WifiOff, MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';

// Interfaces para el sistema de producción
interface TableState {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  capacity: number;
  location: string;
  status: 'libre' | 'ocupada' | 'reservada' | 'ocupado_todo_dia' | 'mantenimiento';
  currentReservationId?: string;
  clientName?: string;
  clientPhone?: string;
  partySize?: number;
  notes?: string;
  occupiedAt?: Date;
  lastUpdated: Date;
  createdAt: Date;
}

interface RestaurantSchedule {
  id: string;
  restaurantId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openingTime?: string;
  closingTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RestaurantMetrics {
  totalTables: number;
  occupiedTables: number;
  reservedTables: number;
  freeTables: number;
  occupancyRate: number;
}

interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

type TableStatus = 'libre' | 'ocupada' | 'reservada' | 'ocupado_todo_dia' | 'mantenimiento';

export default function ProductionTablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  console.log('🏢 Production TablePlan component loaded for restaurant:', restaurantId);
  
  const { theme } = useTheme();
  const isDark = isDarkMode || theme === 'dark';
  
  // Usar el hook de mesas
  const { 
    tables: hookTables, 
    isLoading: hookIsLoading,
    getMetrics: getHookMetrics,
    updateTableStatus
  } = useRestaurantTables(restaurantId);
  
  // Convertir las mesas del hook al formato esperado
  const tables: TableState[] = hookTables.map(table => ({
    id: table.id,
    restaurantId: restaurantId,
    tableId: table.id,
    tableName: table.name,
    capacity: table.capacity,
    location: table.location || 'Sala principal',
    status: table.status === 'available' ? 'libre' : 
            table.status === 'occupied' ? 'ocupada' :
            table.status === 'reserved' ? 'reservada' : 'libre',
    currentReservationId: undefined,
    clientName: table.client?.name,
    clientPhone: table.client?.phone,
    partySize: table.client?.partySize,
    notes: undefined,
    occupiedAt: undefined,
    lastUpdated: new Date(table.lastUpdated || Date.now()),
    createdAt: new Date()
  }));
  
  const [schedule, setSchedule] = useState<RestaurantSchedule[]>([]);
  const [restaurantStatus, setRestaurantStatus] = useState<{
    abierto: boolean;
    mensaje: string;
    horarios?: Array<{ Turno: string; Inicio: string; Fin: string }>;
  }>({ abierto: true, mensaje: 'Verificando estado...' });
  const [diasCerrados, setDiasCerrados] = useState<string[]>([]);
  const [selectedDiasCerrados, setSelectedDiasCerrados] = useState<string[]>([]);
  // Calcular métricas desde las mesas del hook
  const metrics = useMemo(() => {
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
    const reservedTables = tables.filter(t => t.status === 'reservada').length;
    const freeTables = tables.filter(t => t.status === 'libre').length;
    const occupancyRate = totalTables > 0 ? Math.round(((occupiedTables + reservedTables) / totalTables) * 100) : 0;
    
    return {
      totalTables,
      occupiedTables,
      reservedTables,
      freeTables,
      occupancyRate
    };
  }, [tables]);
  
  const isLoading = hookIsLoading;
  const [isConnected, setIsConnected] = useState(false);
  
  // Estados de filtros y búsqueda
  const [filteredTables, setFilteredTables] = useState<TableState[]>([]);
  const [statusFilter, setStatusFilter] = useState<TableStatus>('libre');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  // WebSocket para tiempo real
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Inicializar datos
  useEffect(() => {
    initializeData();
    initializeWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [restaurantId]);

  // Actualizar filtros cuando cambian las mesas
  useEffect(() => {
    applyFilters();
  }, [tables, statusFilter, searchTerm]);

  // Inicializar datos del restaurante (solo horarios y estado, las mesas vienen del hook)
  const initializeData = async () => {
    try {
      // Obtener fecha y hora actual para verificar horarios
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
      
      // Cargar solo datos que no vienen del hook
      const [scheduleData, statusData, diasCerradosData] = await Promise.all([
        fetch(`/api/restaurant/schedule?restaurantId=${restaurantId}`).then(res => res.json()),
        fetch(`/api/google-sheets/horarios?restaurantId=${restaurantId}&fecha=${today}&hora=${currentTime}`).then(res => res.json()),
        fetch(`/api/google-sheets/dias-cerrados?restaurantId=${restaurantId}`).then(res => res.json())
      ]);
      
      if (scheduleData.success) {
        setSchedule(scheduleData.data);
      }
      
      if (statusData.success) {
        setRestaurantStatus(statusData.status);
      }
      
      if (diasCerradosData.success) {
        setDiasCerrados(diasCerradosData.diasCerrados);
        setSelectedDiasCerrados(diasCerradosData.diasCerrados);
      }

      // Si no hay mesas, inicializar con datos por defecto
      if (tables.length === 0) {
        await initializeDefaultTables();
      }

    } catch (error) {
      console.error('Error initializing restaurant data:', error);
      toast.error('Error al cargar datos del restaurante');
    }
  };

  // Inicializar mesas por defecto
  const initializeDefaultTables = async () => {
    const defaultTables = [
      { id: 'M1', name: 'Mesa 1', capacity: 4, location: 'Terraza' },
      { id: 'M2', name: 'Mesa 2', capacity: 2, location: 'Terraza' },
      { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal' },
      { id: 'M4', name: 'Mesa 4', capacity: 4, location: 'Salón Principal' },
      { id: 'M5', name: 'Mesa 5', capacity: 2, location: 'Comedor Privado' },
      { id: 'M6', name: 'Mesa 6', capacity: 8, location: 'Terraza' },
      { id: 'M7', name: 'Mesa 7', capacity: 4, location: 'Salón Principal' },
      { id: 'M8', name: 'Mesa 8', capacity: 2, location: 'Comedor Privado' },
    ];

    try {
      const response = await fetch('/api/restaurant/initialize-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, tables: defaultTables })
      });

      if (response.ok) {
        await initializeData(); // Recargar datos
        toast.success('Mesas inicializadas correctamente');
      }
    } catch (error) {
      console.error('Error initializing tables:', error);
      toast.error('Error al inicializar mesas');
    }
  };

  // Inicializar WebSocket (deshabilitado temporalmente)
  const initializeWebSocket = () => {
    // WebSocket deshabilitado temporalmente para evitar errores
    // TODO: Implementar WebSocket server cuando sea necesario
    console.log('🔌 WebSocket deshabilitado temporalmente');
    setIsConnected(false);
  };

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'update') {
      switch (message.data.eventType) {
        case 'table_status_changed':
          updateTableInState(message.data.tableId, message.data.status, message.data.clientData);
          break;
        case 'initial_state':
          // Las mesas y métricas ahora vienen del hook useRestaurantTables
          if (message.data.schedule) setSchedule(message.data.schedule);
          break;
        case 'metrics_updated':
          // Las métricas ahora se calculan automáticamente desde las mesas del hook
          break;
      }
    }
  };

  // Actualizar mesa en el estado local (ya no se usa, las mesas vienen del hook)
  const updateTableInState = (tableId: string, status: TableStatus, clientData?: any) => {
    // Esta función ya no se usa porque las mesas vienen del hook useRestaurantTables
    console.log('updateTableInState called but not used - tables come from hook');
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = tables;

    // Filtro por estado
    filtered = filtered.filter(table => table.status === statusFilter);

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(table => 
        table.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (table.clientName && table.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTables(filtered);
  };

  // Manejar cambio de estado de mesa
  const handleTableStatusChange = async (tableId: string, newStatus: TableStatus, clientData?: any) => {
    try {
      // Convertir el status al formato del hook
      const hookStatus = newStatus === 'libre' ? 'available' : 
                        newStatus === 'ocupada' ? 'occupied' :
                        newStatus === 'reservada' ? 'reserved' : 'available';
      
      // Usar el hook para actualizar el estado
      await updateTableStatus(tableId, hookStatus, clientData);
      
      toast.success(`Mesa ${tableId} actualizada a ${newStatus}`);
    } catch (error) {
      console.error('Error updating table status:', error);
      toast.error('Error al actualizar el estado de la mesa');
    }
  };

  // Guardar días cerrados
  const handleSaveDiasCerrados = async () => {
    try {
      const response = await fetch('/api/google-sheets/dias-cerrados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          diasCerrados: selectedDiasCerrados
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDiasCerrados(selectedDiasCerrados);
          setShowScheduleDialog(false);
          toast.success('Días cerrados actualizados correctamente');
          
          // Recargar datos para actualizar el estado del restaurante
          initializeData();
        } else {
          toast.error(result.error || 'Error al actualizar días cerrados');
        }
      } else {
        toast.error('Error al actualizar días cerrados');
      }
    } catch (error) {
      console.error('Error saving dias cerrados:', error);
      toast.error('Error al actualizar días cerrados');
    }
  };

  // Manejar cambio de horario
  const handleScheduleChange = async (dayOfWeek: string, isOpen: boolean, openingTime?: string, closingTime?: string) => {
    try {
      const response = await fetch('/api/restaurant/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          schedules: [{
            dayOfWeek,
            isOpen,
            openingTime,
            closingTime
          }]
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSchedule(prev => 
            prev.map(s => 
              s.dayOfWeek === dayOfWeek 
                ? { ...s, isOpen, openingTime, closingTime }
                : s
            )
          );
          toast.success('Horario actualizado correctamente');
        } else {
          toast.error(result.error || 'Error al actualizar horario');
        }
      } else {
        toast.error('Error al actualizar horario');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Error al actualizar horario');
    }
  };

  // Usar el estado del restaurante desde Google Sheets
  const isRestaurantOpen = useMemo(() => {
    return restaurantStatus.abierto;
  }, [restaurantStatus]);

  // Función auxiliar para parsear tiempo
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Obtener color de fondo de la tarjeta
  const getCardBackgroundColor = (status: TableStatus) => {
    if (isDark) {
      switch (status) {
        case 'libre': return 'bg-green-600 border-green-500';
        case 'ocupada': return 'bg-red-600 border-red-500';
        case 'reservada': return 'bg-yellow-600 border-yellow-500';
        case 'ocupado_todo_dia': return 'bg-purple-600 border-purple-500';
        case 'mantenimiento': return 'bg-gray-600 border-gray-500';
        default: return 'bg-gray-800 border-gray-700';
      }
    } else {
      switch (status) {
        case 'libre': return 'bg-green-500 border-green-600';
        case 'ocupada': return 'bg-red-500 border-red-600';
        case 'reservada': return 'bg-yellow-500 border-yellow-600';
        case 'ocupado_todo_dia': return 'bg-purple-500 border-purple-600';
        case 'mantenimiento': return 'bg-gray-500 border-gray-600';
        default: return 'bg-white border-gray-200';
      }
    }
  };

  // Obtener emoji del estado
  const getStatusEmoji = (status: TableStatus) => {
    switch (status) {
      case 'libre': return '🟢';
      case 'ocupada': return '🔴';
      case 'reservada': return '🟡';
      case 'ocupado_todo_dia': return '🟣';
      case 'mantenimiento': return '⚪';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
      {/* Header con estado de conexión */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Título principal */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white ml-3 sm:ml-4">
            Control de Mesas
          </h2>
        </div>
        
        {/* Botones de acción - responsive */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowScheduleDialog(true)}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-9 px-3 sm:px-4 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">Horario</span>
            </Button>
            
            <Button
              onClick={() => {
                const allTables = filteredTables;
                allTables.forEach(table => {
                  handleTableStatusChange(table.tableId, 'ocupada');
                });
              }}
              variant="outline"
              size="sm"
              className={`flex-1 sm:flex-none h-9 px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white font-semibold border-red-500 ${
                !isRestaurantOpen ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isRestaurantOpen}
            >
              <span className="text-sm">🔴 Día Completo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-600">{metrics.totalTables}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600">{metrics.freeTables}</div>
              <div className="text-xs sm:text-sm text-gray-600">Libres</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-red-600">{metrics.occupiedTables}</div>
              <div className="text-xs sm:text-sm text-gray-600">Ocupadas</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="p-3 sm:p-4">
          <CardContent className="p-0">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-yellow-600">{metrics.reservedTables}</div>
              <div className="text-xs sm:text-sm text-gray-600">Reservadas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar mesas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 sm:h-10"
          />
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <Button
            onClick={() => setStatusFilter('libre')}
            variant={statusFilter === 'libre' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-green-500 hover:bg-green-600 text-white border-2 border-white shadow-md"
          >
            Libre
          </Button>
          <Button
            onClick={() => setStatusFilter('ocupada')}
            variant={statusFilter === 'ocupada' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white border-2 border-white shadow-md"
          >
            Ocupada
          </Button>
          <Button
            onClick={() => setStatusFilter('reservada')}
            variant={statusFilter === 'reservada' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-yellow-500 hover:bg-yellow-600 text-white border-2 border-white shadow-md"
          >
            Reservada
          </Button>
        </div>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {filteredTables.map((table) => (
          <Card 
            key={table.id} 
            className={`transition-all duration-200 hover:shadow-lg ${getCardBackgroundColor(table.status)}`}
          >
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold text-white">
                  {table.tableName}
                </CardTitle>
                <Badge 
                  variant="secondary" 
                  className="text-xs sm:text-sm bg-white/20 text-white border-white/30"
                >
                  {getStatusEmoji(table.status)} {table.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 text-white/80">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{table.capacity} personas</span>
                </div>
                
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{table.location}</span>
                </div>
                
                {table.clientName && (
                  <div className="text-white/90">
                    <div className="text-xs sm:text-sm font-medium">{table.clientName}</div>
                    {table.partySize && (
                      <div className="text-xs text-white/70">{table.partySize} personas</div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    onClick={() => handleTableStatusChange(table.tableId, 'libre')}
                    size="sm"
                    variant={table.status === 'libre' ? 'default' : 'outline'}
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold border-2 border-white shadow-md"
                    disabled={!isRestaurantOpen}
                  >
                    Libre
                  </Button>
                  <Button
                    onClick={() => handleTableStatusChange(table.tableId, 'ocupada')}
                    size="sm"
                    variant={table.status === 'ocupada' ? 'default' : 'outline'}
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold border-2 border-white shadow-md"
                    disabled={!isRestaurantOpen}
                  >
                    Ocupar
                  </Button>
                  <Button
                    onClick={() => handleTableStatusChange(table.tableId, 'reservada')}
                    size="sm"
                    variant={table.status === 'reservada' ? 'default' : 'outline'}
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold border-2 border-white shadow-md"
                    disabled={!isRestaurantOpen}
                  >
                    Reservar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de días cerrados */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configuración de Días Cerrados</DialogTitle>
            <DialogDescription>
              Selecciona los días de la semana que el restaurante estará cerrado todo el día
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((dia) => (
              <div key={dia} className="flex items-center justify-between">
                <Label className="text-sm font-medium capitalize">
                  {dia}
                </Label>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedDiasCerrados.includes(dia)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDiasCerrados(prev => [...prev, dia]);
                      } else {
                        setSelectedDiasCerrados(prev => prev.filter(d => d !== dia));
                      }
                    }}
                  />
                  <span className="text-xs text-gray-500">
                    {selectedDiasCerrados.includes(dia) ? 'Cerrado' : 'Abierto'}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500 mb-3">
                <strong>Días cerrados actuales:</strong> {diasCerrados.length > 0 ? diasCerrados.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : 'Ninguno'}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveDiasCerrados}
                  className="flex-1"
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowScheduleDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
