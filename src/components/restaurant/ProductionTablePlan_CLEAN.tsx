"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Users, Search, Calendar, MapPin } from 'lucide-react';
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


interface TablePlanProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

type TableStatus = 'libre' | 'ocupada' | 'reservada' | 'ocupado_todo_dia' | 'mantenimiento';

export default function ProductionTablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  console.log('🏢 Production TablePlan component loaded for restaurant:', restaurantId);
  
  const { theme } = useTheme();
  const isDark = isDarkMode || theme === 'dark';
  
  // Estados de filtros y búsqueda
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Usar el hook de mesas (persiste automáticamente los cambios)
  const { 
    tables: hookTables, 
    isLoading: hookIsLoading,
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
  
  const [, setSchedule] = useState<RestaurantSchedule[]>([]);
  const [restaurantStatus, setRestaurantStatus] = useState<{
    abierto: boolean;
    mensaje: string;
    horarios?: Array<{ Turno: string; Inicio: string; Fin: string }>;
  }>({ abierto: true, mensaje: 'Verificando estado...' });
  const [diasCerrados, setDiasCerrados] = useState<string[]>([]);
  const [selectedDiasCerrados, setSelectedDiasCerrados] = useState<string[]>([]);
  // Calcular métricas desde las mesas del hook
  // Métricas removidas - ya no se usan
  
  const isLoading = hookIsLoading;
  const [, setIsConnected] = useState(false);
  
  // WebSocket para tiempo real
  const [ws] = useState<WebSocket | null>(null);

  // Inicializar datos
  useEffect(() => {
    const init = async () => {
      await initializeData();
      initializeWebSocket();
    };
    init();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Auto-refresh DESHABILITADO - El usuario controla manualmente los estados
  // useEffect(() => {
  //   const refreshInterval = setInterval(async () => {
  //     try {
  //       const today = new Date().toISOString().split('T')[0];
  //       const currentTime = `${new Date().getHours().toString().padStart(2, '0')}:00`;
        
  //       console.log('🔄 Auto-refresh: Actualizando estado de mesas...');
        
  //       const reservationsResponse = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&fecha=${today}`);
  //       if (reservationsResponse.ok) {
  //         const reservationsData = await reservationsResponse.json();
  //         if (reservationsData.success && reservationsData.reservas) {
  //           await updateTableStatusFromReservations(reservationsData.reservas);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error en auto-refresh de mesas:', error);
  //     }
  //   }, 120000); // 2 minutos

  //   return () => clearInterval(refreshInterval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [restaurantId]);

  // Inicializar datos del restaurante (solo horarios y estado, las mesas vienen del hook)
  const initializeData = async () => {
    try {
      // Obtener fecha y hora actual para verificar horarios
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
      
      // Cargar datos (sin reservas - el usuario controla manualmente)
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

      // Sincronización DESHABILITADA - El usuario controla manualmente los estados de las mesas
      // if (reservationsData.success && reservationsData.reservas) {
      //   console.log('🔄 Sincronizando mesas con reservas del día...');
      //   await updateTableStatusFromReservations(reservationsData.reservas);
      //   console.log('✅ Sincronización completada');
      // }

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

  // Función para actualizar estado de mesas basado en reservas de hoy
  const updateTableStatusFromReservations = async (reservations: unknown[]) => {
    try {
      console.log('🔄 Actualizando estado de mesas basado en reservas:', reservations.length);
      
      for (const reservation of reservations) {
        const res = reservation as Record<string, unknown>;
        const reservationTime = res.Hora as string || res.hora as string;
        const tableName = res.Mesa as string || res.mesa as string;
        const clientName = res.Cliente as string || res.cliente as string;
        const partySize = res.Personas as number || res.personas as number;
        const phone = res.Telefono as string || res.telefono as string;
        
        if (!tableName || tableName === 'Por asignar') continue;
        
        // Marcar la mesa como reservada si tiene una reserva para hoy
        // (sin importar la hora, ya que es una reserva del día)
        const tableId = `table_${tableName.toLowerCase().replace(/\s+/g, '_')}`;
        
        await updateTableStatus(tableId, 'reserved', {
          name: clientName,
          phone: phone,
          partySize: partySize,
          notes: `Reserva a las ${reservationTime}`
        });
        
        console.log(`✅ Mesa ${tableName} marcada como reservada para ${clientName} a las ${reservationTime}`);
      }
    } catch (error) {
      console.error('Error actualizando estado de mesas:', error);
    }
  };

  // Función auxiliar removida - ya no se usa

  // Calcular mesas filtradas con useMemo para evitar loops
  const filteredTables = useMemo(() => {
    let filtered = tables;

    // Filtro por estado (solo si no es 'todos')
    if (statusFilter !== 'todos') {
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

    return filtered;
  }, [tables, statusFilter, searchTerm]);

  // Manejar cambio de estado de mesa
  const handleTableStatusChange = async (tableId: string, newStatus: TableStatus, clientData?: unknown) => {
    try {
      console.log(`🔄 Cambiando estado de mesa ${tableId} a ${newStatus}`);
      
      // Convertir el status al formato del hook
      const hookStatus = newStatus === 'libre' ? 'available' : 
                        newStatus === 'ocupada' ? 'occupied' :
                        newStatus === 'reservada' ? 'reserved' : 'available';
      
      // Actualizar directamente en el hook (esto persiste los cambios)
      await updateTableStatus(tableId, hookStatus, clientData as { name: string; phone: string; partySize: number; notes?: string });
      
      console.log(`✅ Mesa ${tableId} actualizada a ${newStatus} (persistido en hook)`);
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

  // Función removida - no se usa actualmente

  // Usar el estado del restaurante desde Google Sheets
  const isRestaurantOpen = useMemo(() => {
    return restaurantStatus.abierto;
  }, [restaurantStatus]);

  // Función removida - no se usa actualmente

  // Obtener color de fondo de la tarjeta
  const getCardBackgroundColor = (status: TableStatus) => {
    if (isDark) {
      switch (status) {
        case 'libre': return 'bg-green-600 border-green-500';
        case 'ocupada': return 'bg-red-600 border-red-500';
        case 'reservada': return 'bg-orange-600 border-orange-500';
        case 'ocupado_todo_dia': return 'bg-purple-600 border-purple-500';
        case 'mantenimiento': return 'bg-gray-600 border-gray-500';
        default: return 'bg-gray-800 border-gray-700';
      }
    } else {
      switch (status) {
        case 'libre': return 'bg-green-500 border-green-600';
        case 'ocupada': return 'bg-red-500 border-red-600';
        case 'reservada': return 'bg-orange-500 border-orange-600';
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
            onClick={() => setStatusFilter('todos')}
            variant={statusFilter === 'todos' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 sm:h-10 px-3 sm:px-4 ${
              statusFilter === 'todos' 
                ? 'bg-gray-500 hover:bg-gray-600 text-white border-2 border-white shadow-md' 
                : 'bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-300'
            }`}
          >
            Todos
          </Button>
          <Button
            onClick={() => setStatusFilter('libre')}
            variant={statusFilter === 'libre' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 sm:h-10 px-3 sm:px-4 ${
              statusFilter === 'libre' 
                ? 'bg-green-500 hover:bg-green-600 text-white border-2 border-white shadow-md' 
                : 'bg-white hover:bg-green-50 text-green-600 border-2 border-green-300'
            }`}
          >
            Libre
          </Button>
          <Button
            onClick={() => setStatusFilter('ocupada')}
            variant={statusFilter === 'ocupada' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 sm:h-10 px-3 sm:px-4 ${
              statusFilter === 'ocupada' 
                ? 'bg-red-500 hover:bg-red-600 text-white border-2 border-white shadow-md' 
                : 'bg-white hover:bg-red-50 text-red-600 border-2 border-red-300'
            }`}
          >
            Ocupada
          </Button>
          <Button
            onClick={() => setStatusFilter('reservada')}
            variant={statusFilter === 'reservada' ? 'default' : 'outline'}
            size="sm"
            className={`h-9 sm:h-10 px-3 sm:px-4 ${
              statusFilter === 'reservada' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-2 border-white shadow-md' 
                : 'bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-300'
            }`}
          >
            Reservada
          </Button>
          
          {/* Botones de acción movidos aquí */}
          <Button
            onClick={async () => {
              try {
                const today = new Date().toISOString().split('T')[0];
                
                console.log('🔄 Sincronizando mesas con reservas del día...');
                
                const reservationsResponse = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&fecha=${today}`);
                if (reservationsResponse.ok) {
                  const reservationsData = await reservationsResponse.json();
                  if (reservationsData.success && reservationsData.reservas) {
                    await updateTableStatusFromReservations(reservationsData.reservas);
                    console.log('✅ Estado de mesas sincronizado con reservas');
                  }
                }
              } catch (error) {
                console.error('Error sincronizando estado de mesas:', error);
              }
            }}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 border-green-300 text-green-700 hover:bg-green-50"
          >
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm">Sincronizar</span>
          </Button>
          
          <Button
            onClick={() => setShowScheduleDialog(true)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 border-blue-300 text-blue-700 hover:bg-blue-50"
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
            className={`flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white font-semibold border-red-500 ${
              !isRestaurantOpen ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!isRestaurantOpen}
          >
            <span className="text-sm">🔴 Día Completo</span>
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
                    className="text-sm px-3 py-2 sm:px-4 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold border-2 border-white shadow-md"
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
