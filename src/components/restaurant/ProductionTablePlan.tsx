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
  
  // Estados principales
  const [tables, setTables] = useState<TableState[]>([]);
  const [schedule, setSchedule] = useState<RestaurantSchedule[]>([]);
  const [metrics, setMetrics] = useState<RestaurantMetrics>({
    totalTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    freeTables: 0,
    occupancyRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // Estados de filtros y búsqueda
  const [filteredTables, setFilteredTables] = useState<TableState[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | TableStatus>('all');
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

  // Inicializar datos del restaurante
  const initializeData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar datos iniciales
      const [tablesData, scheduleData, metricsData] = await Promise.all([
        fetch(`/api/restaurant/tables?restaurantId=${restaurantId}`).then(res => res.json()),
        fetch(`/api/restaurant/schedule?restaurantId=${restaurantId}`).then(res => res.json()),
        fetch(`/api/restaurant/metrics?restaurantId=${restaurantId}`).then(res => res.json())
      ]);

      if (tablesData.success) {
        setTables(tablesData.data);
      }
      
      if (scheduleData.success) {
        setSchedule(scheduleData.data);
      }
      
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }

      // Si no hay mesas, inicializar con datos por defecto
      if (tablesData.success && tablesData.data.length === 0) {
        await initializeDefaultTables();
      }

    } catch (error) {
      console.error('Error initializing restaurant data:', error);
      toast.error('Error al cargar datos del restaurante');
    } finally {
      setIsLoading(false);
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

  // Inicializar WebSocket
  const initializeWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        
        // Suscribirse a actualizaciones del restaurante
        websocket.send(JSON.stringify({
          type: 'subscribe',
          restaurantId: restaurantId
        }));
      };
      
      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        
        // Reconectar después de 5 segundos
        setTimeout(() => {
          initializeWebSocket();
        }, 5000);
      };
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      setWs(websocket);
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Manejar mensajes del WebSocket
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'update') {
      switch (message.data.eventType) {
        case 'table_status_changed':
          updateTableInState(message.data.tableId, message.data.status, message.data.clientData);
          break;
        case 'initial_state':
          if (message.data.tableStates) setTables(message.data.tableStates);
          if (message.data.metrics) setMetrics(message.data.metrics);
          if (message.data.schedule) setSchedule(message.data.schedule);
          break;
        case 'metrics_updated':
          if (message.data.metrics) setMetrics(message.data.metrics);
          break;
      }
    }
  };

  // Actualizar mesa en el estado local
  const updateTableInState = (tableId: string, status: TableStatus, clientData?: any) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.tableId === tableId 
          ? {
              ...table,
              status,
              clientName: clientData?.name || table.clientName,
              clientPhone: clientData?.phone || table.clientPhone,
              partySize: clientData?.partySize || table.partySize,
              notes: clientData?.notes || table.notes,
              lastUpdated: new Date()
            }
          : table
      )
    );
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = tables;

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(table => table.status === statusFilter);
    }

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
      const response = await fetch('/api/restaurant/update-table-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableId,
          status: newStatus,
          clientData
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          updateTableInState(tableId, newStatus, clientData);
          toast.success(`Mesa ${tableId} actualizada a ${newStatus}`);
        } else {
          toast.error(result.error || 'Error al actualizar mesa');
        }
      } else {
        toast.error('Error al actualizar mesa');
      }
    } catch (error) {
      console.error('Error updating table status:', error);
      toast.error('Error al actualizar mesa');
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

  // Verificar si el restaurante está abierto
  const isRestaurantOpen = useMemo(() => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    
    const todaySchedule = schedule.find(s => s.dayOfWeek === currentDay);
    if (!todaySchedule || !todaySchedule.isOpen) return false;
    
    if (!todaySchedule.openingTime || !todaySchedule.closingTime) return true;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openingTime = parseTime(todaySchedule.openingTime);
    const closingTime = parseTime(todaySchedule.closingTime);
    
    return currentTime >= openingTime && currentTime <= closingTime;
  }, [schedule]);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header con estado de conexión */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Control de Mesas</h2>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs sm:text-sm text-gray-500">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={() => setShowScheduleDialog(true)}
            variant="outline"
            size="sm"
            className="h-8 w-auto px-3 sm:h-9 sm:px-4 md:h-10 md:px-5"
          >
            <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Horario</span>
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
            className={`h-8 w-auto px-3 sm:h-9 sm:px-4 md:h-10 md:px-5 bg-red-500 hover:bg-red-600 text-white font-semibold border-red-500 ${
              !isRestaurantOpen ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!isRestaurantOpen}
          >
            <span className="text-sm sm:text-base">🔴 Día Completo</span>
          </Button>
        </div>
      </div>

      {/* Estado del restaurante */}
      <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
        isRestaurantOpen 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-3 h-3 rounded-full ${isRestaurantOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm sm:text-base font-medium">
            {isRestaurantOpen ? 'Restaurante Abierto' : 'Restaurante Cerrado'}
          </span>
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
            onClick={() => setStatusFilter('all')}
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4"
          >
            Todas
          </Button>
          <Button
            onClick={() => setStatusFilter('libre')}
            variant={statusFilter === 'libre' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-green-500 hover:bg-green-600 text-white"
          >
            Libre
          </Button>
          <Button
            onClick={() => setStatusFilter('ocupada')}
            variant={statusFilter === 'ocupada' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white"
          >
            Ocupada
          </Button>
          <Button
            onClick={() => setStatusFilter('reservada')}
            variant={statusFilter === 'reservada' ? 'default' : 'outline'}
            size="sm"
            className="h-9 sm:h-10 px-3 sm:px-4 bg-yellow-500 hover:bg-yellow-600 text-white"
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
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold"
                    disabled={!isRestaurantOpen}
                  >
                    Libre
                  </Button>
                  <Button
                    onClick={() => handleTableStatusChange(table.tableId, 'ocupada')}
                    size="sm"
                    variant={table.status === 'ocupada' ? 'default' : 'outline'}
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold"
                    disabled={!isRestaurantOpen}
                  >
                    Ocupar
                  </Button>
                  <Button
                    onClick={() => handleTableStatusChange(table.tableId, 'reservada')}
                    size="sm"
                    variant={table.status === 'reservada' ? 'default' : 'outline'}
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
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

      {/* Dialog de horario */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Horario del Restaurante</DialogTitle>
            <DialogDescription>
              Configura los días y horarios de apertura
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {schedule.map((daySchedule) => (
              <div key={daySchedule.dayOfWeek} className="flex items-center justify-between">
                <Label className="text-sm font-medium capitalize">
                  {daySchedule.dayOfWeek === 'monday' ? 'Lunes' :
                   daySchedule.dayOfWeek === 'tuesday' ? 'Martes' :
                   daySchedule.dayOfWeek === 'wednesday' ? 'Miércoles' :
                   daySchedule.dayOfWeek === 'thursday' ? 'Jueves' :
                   daySchedule.dayOfWeek === 'friday' ? 'Viernes' :
                   daySchedule.dayOfWeek === 'saturday' ? 'Sábado' : 'Domingo'}
                </Label>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={daySchedule.isOpen}
                    onCheckedChange={(checked) => 
                      handleScheduleChange(daySchedule.dayOfWeek, checked, daySchedule.openingTime, daySchedule.closingTime)
                    }
                  />
                  
                  {daySchedule.isOpen && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={daySchedule.openingTime || '12:00'}
                        onChange={(e) => 
                          handleScheduleChange(daySchedule.dayOfWeek, true, e.target.value, daySchedule.closingTime)
                        }
                        className="w-20 h-8 text-xs"
                      />
                      <span className="text-xs">-</span>
                      <Input
                        type="time"
                        value={daySchedule.closingTime || '23:00'}
                        onChange={(e) => 
                          handleScheduleChange(daySchedule.dayOfWeek, true, daySchedule.openingTime, e.target.value)
                        }
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
