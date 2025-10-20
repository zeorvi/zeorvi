'use client';

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Users, Clock, MapPin, Calendar } from 'lucide-react';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
// Select components removed as they're not used
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

interface Reservation {
  ID: string;
  Fecha: string;
  Hora: string;
  Cliente: string;
  Telefono: string;
  Personas: number;
  Mesa: string;
  Estado: string;
  Notas?: string;
}

export default function TablePlan({ restaurantId, isDarkMode = false }: TablePlanProps) {
  console.log('🪑 Enhanced TablePlan component loaded for restaurant:', restaurantId);
  
  // Usar el hook global de mesas
  const { 
    tables, 
    isLoading, 
    updateTableStatus, 
    refreshTables 
  } = useRestaurantTables(restaurantId);
  
  console.log('📊 [EnhancedTablePlan] Estado de mesas:', {
    tablesCount: tables.length,
    isLoading,
    tables: tables.map(t => ({ id: t.id, name: t.name, status: t.status }))
  });
  
  const [filteredTables, setFilteredTables] = useState(tables);
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
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
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState<{
    abierto: boolean;
    mensaje: string;
    horarios?: Array<{ Turno: string; Inicio: string; Fin: string }>;
  }>({ abierto: false, mensaje: 'Verificando estado...' });
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);

  // Normalizar estados de mesas
  const normalizeTableStatus = (status: string): TableStatus => {
    return status as TableStatus;
  };

  // Cargar estado del restaurante y reservas del día (con caché, en background)
  useEffect(() => {
    const loadRestaurantData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
        
        // Cargar en paralelo para mayor velocidad (sin timeout, se maneja con caché)
        const [statusResponse, reservasResponse] = await Promise.all([
          fetch(`/api/google-sheets/horarios?restaurantId=${restaurantId}&fecha=${today}&hora=${currentTime}`)
            .catch(() => null),
          fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&fecha=${today}`)
            .catch(() => null)
        ]);
        
        // 1. Procesar estado del restaurante
        if (statusResponse?.ok) {
          const statusData = await statusResponse.json();
          
          if (statusData.success) {
            setRestaurantStatus(statusData.status);
            setIsRestaurantOpen(statusData.status.abierto);
          }
        }
        
        // 2. Procesar reservas del día
        if (reservasResponse?.ok) {
          const reservasData = await reservasResponse.json();
          
          if (reservasData.success && reservasData.reservas) {
            setTodayReservations(reservasData.reservas);
          }
        }
      } catch {
        // Silencioso - los datos se cargarán del caché
        console.log('ℹ️ [TablePlan] Usando datos en caché');
      }
    };

    // Cargar en background sin bloquear la UI
    loadRestaurantData();
  }, [restaurantId]);

  // Sincronizar mesas con reservas del día
  const tablesWithReservations = useMemo(() => {
    if (!tables.length || !todayReservations.length) {
      return tables;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return tables.map(table => {
      // Buscar reserva para esta mesa
      const reservation = todayReservations.find(r => {
        const mesaNombre = (r.Mesa || '').toLowerCase().trim();
        const tableName = table.name.toLowerCase().trim();
        const tableId = table.id.toLowerCase().trim();
        
        return mesaNombre === tableName || 
               mesaNombre === tableId ||
               mesaNombre.replace(/\s+/g, '') === tableName.replace(/\s+/g, '');
      });
      
      if (!reservation) return table;
      
      const estado = (reservation.Estado || '').toLowerCase().trim();
      
      // Si está cancelada o completada, ignorar
      if (estado === 'cancelada' || estado === 'completada') {
        return table;
      }
      
      // Parsear hora de la reserva (aceptar tanto "13:30" como "13.30")
      const normalizedTime = (reservation.Hora || '00:00').replace('.', ':');
      const timeParts = normalizedTime.split(':');
      
      if (timeParts.length < 2) {
        // Formato de hora inválido, mantener estado actual
        return table;
      }
      
      const reservaHour = parseInt(timeParts[0]) || 0;
      const reservaMinute = parseInt(timeParts[1]) || 0;
      
      // Calcular tiempos en minutos
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const reservaTimeInMinutes = reservaHour * 60 + reservaMinute;
      
      // Duración estimada: 2 horas para comida, 2.5 horas para cena
      const isDinnerTime = reservaHour >= 20 || reservaHour < 2;
      const estimatedDuration = isDinnerTime ? 150 : 120; // minutos
      const reservaEndTime = reservaTimeInMinutes + estimatedDuration;
      
      // Determinar el estado de la mesa basándose en el tiempo
      let newStatus: TableStatus = table.status;
      
      // 1. Verificar si la reserva ya terminó
      if (currentTimeInMinutes > reservaEndTime) {
        newStatus = 'available';
      }
      // 2. Verificar si la reserva está activa ahora
      else if (currentTimeInMinutes >= reservaTimeInMinutes && currentTimeInMinutes <= reservaEndTime) {
        newStatus = estado === 'ocupada' ? 'occupied' : 'reserved';
      }
      // 3. Reserva futura (antes de que comience)
      else if (currentTimeInMinutes < reservaTimeInMinutes) {
        newStatus = 'available';
      }
      
      return {
        ...table,
        status: newStatus,
        client: newStatus === 'available' ? undefined : {
          name: reservation.Cliente,
          phone: reservation.Telefono,
          partySize: reservation.Personas,
          notes: `Reserva ${reservation.Hora} - ${reservation.Notas || ''}`
        }
      };
    });
  }, [tables, todayReservations]);

  // Filtrar mesas cuando cambian los filtros o las mesas
  useEffect(() => {
    let filtered = tablesWithReservations;
    
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
  }, [tablesWithReservations, statusFilter, searchTerm]);

  // Actualizar estado de mesas cada minuto para reflejar cambios de tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      // Forzar re-render para actualizar estados basados en tiempo
      setFilteredTables([...filteredTables]);
    }, 60000); // 1 minuto
    
    return () => clearInterval(interval);
  }, [filteredTables]);

  const handleTableStatusChange = async (tableId: string, newStatus: TableStatus) => {
    if (!isRestaurantOpen) {
      toast.error('El restaurante está cerrado hoy');
      return;
    }

    const table = tables.find(t => t.id === tableId);
    if (!table) {
      toast.error('Mesa no encontrada');
      return;
    }

    if (newStatus === 'occupied' || newStatus === 'reserved') {
      try {
        // Generar un ID único para la reserva
        const reservaId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Datos de cliente automáticos
        const now = new Date();
        const clientData = {
          name: '👤 Encargado',
          phone: 'Reserva manual',
          partySize: 2,
          notes: `${newStatus === 'occupied' ? 'Mesa ocupada' : 'Mesa reservada'} manualmente por el encargado`
        };

        console.log(`📝 Creando ${newStatus === 'occupied' ? 'ocupación' : 'reserva'} en Google Sheets para mesa ${table.name}`);

        // Llamar al endpoint para crear la reserva en Google Sheets
        const response = await fetch('/api/restaurant/occupy-table', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurantId,
            mesaId: table.id,
            mesaNombre: table.name,
            zona: table.location || 'Sin zona',
            cliente: clientData.name,
            telefono: clientData.phone,
            personas: clientData.partySize,
            notas: clientData.notes,
            estado: newStatus, // 'occupied' o 'reserved'
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Actualizar el estado local de la mesa
          updateTableStatus(tableId, newStatus, clientData);
          
          toast.success(`✅ Mesa ${table.name} ${newStatus === 'occupied' ? 'ocupada' : 'reservada'}`);
          toast.info(`🆔 ID: ${result.reservaId || reservaId}`);
          
          // Refrescar las mesas para actualizar el estado desde Google Sheets
          setTimeout(() => refreshTables(), 1000);
        } else {
          toast.error(`Error: ${result.error || 'No se pudo crear la reserva'}`);
        }
      } catch (error) {
        console.error('Error al crear reserva:', error);
        toast.error('Error al crear la reserva en Google Sheets');
      }
    } else {
      // Para liberar o mantenimiento, solo actualizar el estado local
      updateTableStatus(tableId, newStatus);
      toast.success(`Mesa ${table.name} actualizada`);
    }
  };

  // Función para determinar el estado real de la mesa basado en la hora actual
  const getRealTimeTableStatus = (table: any): TableStatus => {
    // USAR EL ESTADO YA CALCULADO EN tablesWithReservations
    // No recalcular aquí para evitar inconsistencias
    return table.status || 'available';
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'occupied': return 'bg-red-500 hover:bg-red-600 text-white';
      case 'reserved': return 'bg-orange-500 hover:bg-orange-600 text-white';
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
        case 'reserved': return 'bg-orange-600 border-orange-500';
        case 'maintenance': return 'bg-gray-600 border-gray-500';
        default: return 'bg-gray-800 border-gray-700';
      }
    } else {
      switch (status) {
        case 'available': return 'bg-green-500 border-green-600';
        case 'occupied': return 'bg-red-500 border-red-600';
        case 'reserved': return 'bg-orange-500 border-orange-600';
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
      case 'reserved': return '🟠';
      case 'maintenance': return '⚫';
      default: return '⚪';
    }
  };

  // Metrics removed as they're not used in the UI

  const saveSchedule = () => {
    // Aquí guardarías el horario en la base de datos
    toast.success('Horario del restaurante actualizado');
    setShowScheduleDialog(false);
  };

  // Mostrar skeleton solo si está cargando Y no hay mesas
  const showSkeleton = isLoading && tables.length === 0;
  
  if (showSkeleton) {
    return (
      <div className={`p-3 sm:p-4 md:p-5 lg:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="mb-4">
          <div className={`h-16 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-48 rounded-lg animate-pulse ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          ))}
        </div>
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
        <div className={`flex items-center justify-between p-2 sm:p-3 lg:p-5 rounded-lg mb-3 lg:mb-4 ${
          isRestaurantOpen 
            ? (isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200')
            : (isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200')
        }`}>
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full ${isRestaurantOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <div className="flex flex-col">
              <span className={`text-xs sm:text-sm lg:text-lg font-semibold ${
                isRestaurantOpen 
                  ? (isDarkMode ? 'text-green-300' : 'text-green-800')
                  : (isDarkMode ? 'text-red-300' : 'text-red-800')
              }`}>
                {restaurantStatus.mensaje}
              </span>
              {restaurantStatus.horarios && restaurantStatus.horarios.length > 0 && (
                <span className={`text-[10px] sm:text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {restaurantStatus.horarios.map(h => `${h.Turno}: ${h.Inicio} - ${h.Fin}`).join(' | ')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2 lg:h-9 lg:px-3 p-1">
                  <Calendar className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline ml-1 text-xs lg:text-sm">Horario</span>
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
              className={`h-7 w-auto px-2 sm:h-8 sm:px-3 bg-red-500 hover:bg-red-600 text-white font-semibold border-red-500 ${
                !isRestaurantOpen ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isRestaurantOpen}
            >
              <span className="text-xs sm:text-sm">🔴 Día Completo</span>
            </Button>
          </div>
        </div>

        {/* Filtros responsive */}
        <div className="flex flex-col sm:flex-row gap-2 lg:gap-5">
          <div className="flex-1">
            <Input
              placeholder="Buscar mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-8 lg:h-10 text-xs sm:text-sm lg:text-base ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
            />
          </div>
          
          <div className="flex flex-wrap gap-1.5 lg:gap-3">
            {['all', 'available', 'occupied', 'reserved'].map((status) => (
              <Button
                key={status}
                onClick={() => setStatusFilter(status as TableStatus | 'all')}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                className={`h-8 px-2 lg:h-10 lg:px-4 lg:py-2.5 text-xs lg:text-sm ${
                  statusFilter === status 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'text-white border-gray-600 hover:bg-gray-700 bg-gray-800' 
                      : ''
                }`}
              >
                {status === 'all' ? 'Todas' :
                 status === 'available' ? 'Libres' :
                 status === 'occupied' ? 'Ocupadas' :
                 status === 'reserved' ? 'Reservadas' : status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Indicador de carga sutil si está actualizando */}
      {isLoading && tables.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-600 dark:text-blue-400">Actualizando mesas...</span>
        </div>
      )}

      {/* Mensaje si no hay mesas */}
      {filteredTables.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No hay mesas disponibles
          </p>
        </div>
      )}

      {/* Grid de Mesas responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-5">
        {filteredTables.map((table) => {
          const realTimeStatus = getRealTimeTableStatus(table);
          return (
          <Card key={table.id} className={`transition-all duration-200 hover:shadow-lg lg:hover:scale-105 ${
            getCardBackgroundColor(realTimeStatus)
          }`}>
            <CardHeader className="p-2 sm:p-3 lg:pb-4 pb-2">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-sm sm:text-base lg:text-xl text-white font-bold">
                  {table.name}
                </CardTitle>
                <Badge className={`text-[10px] sm:text-xs lg:text-sm px-1.5 py-0.5 lg:px-2 lg:py-1 ${getStatusColor(realTimeStatus)}`}>
                  {getStatusIcon(realTimeStatus)} <span className="hidden lg:inline">{getStatusText(realTimeStatus)}</span>
                </Badge>
              </div>
              <CardDescription className="text-white/90 text-xs lg:text-sm">
                <div className="flex flex-col gap-0.5 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
                  <span className="flex items-center">
                    <Users className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    {table.capacity} <span className="hidden lg:inline">personas</span>
                  </span>
                  <span className="flex items-center truncate">
                    <MapPin className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    {table.location}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-2 sm:p-3 pt-0 space-y-2 lg:space-y-4">
              {/* Botones de estado responsive */}
              <div className="grid grid-cols-2 gap-1.5 lg:gap-3">
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'available')}
                  size="sm"
                  variant={realTimeStatus === 'available' ? 'default' : 'outline'}
                  className="h-7 px-2 lg:h-auto lg:px-4 lg:py-2.5 text-[10px] sm:text-xs lg:text-sm bg-green-500 hover:bg-green-600 text-white font-semibold border-2 border-white"
                  disabled={!isRestaurantOpen}
                >
                  Libre
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'occupied')}
                  size="sm"
                  variant={realTimeStatus === 'occupied' ? 'default' : 'outline'}
                  className="h-7 px-2 lg:h-auto lg:px-4 lg:py-2.5 text-[10px] sm:text-xs lg:text-sm bg-red-500 hover:bg-red-600 text-white font-semibold"
                  disabled={!isRestaurantOpen}
                >
                  Ocupar
                </Button>
                <Button
                  onClick={() => handleTableStatusChange(table.id, 'reserved')}
                  size="sm"
                  variant={table.status === 'reserved' ? 'default' : 'outline'}
                  className="h-7 px-2 lg:h-auto lg:px-4 lg:py-2.5 text-[10px] sm:text-xs lg:text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold col-span-2"
                  disabled={!isRestaurantOpen}
                >
                  Reservar
                </Button>
              </div>
              
              {/* Mostrar información de reserva activa si existe */}
              {(() => {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                const activeReservation = todayReservations.find((reserva: Reservation) => 
                  reserva.Fecha === today && 
                  reserva.Mesa === table.name &&
                  !['completada', 'cancelada'].includes((reserva.Estado || '').toLowerCase().trim())
                );
                
                if (activeReservation) {
                  const [reservaHour, reservaMinute] = activeReservation.Hora.split(':').map(Number);
                  const reservaTime = reservaHour * 60 + reservaMinute;
                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const timeDiff = currentTime - reservaTime;
                  
                  // Lógica especial para medianoche
                  let timeText = '';
                  if (now.getHours() === 0) { // 12:00 AM
                    if (reservaHour >= 1) {
                      // Reserva del día siguiente
                      const minutesUntilReservation = (reservaHour * 60 + reservaMinute);
                      timeText = `(En ${minutesUntilReservation} min)`;
                    } else {
                      timeText = '(Mesa libre)';
                    }
                  } else {
                    // Lógica normal
                    if (timeDiff >= 0) {
                      timeText = `(Ocupada ${timeDiff} min)`;
                    } else {
                      timeText = `(En ${Math.abs(timeDiff)} min)`;
                    }
                  }
                  
                  return (
                    <div className="text-[10px] sm:text-xs lg:text-sm text-white/80 border-t border-white/20 pt-2">
                      <div className="font-semibold truncate">{activeReservation.Cliente}</div>
                      <div className="truncate">{activeReservation.Personas} <span className="hidden lg:inline">personas</span><span className="lg:hidden">pers.</span></div>
                      <div className="text-xs text-white/70">
                        Reserva: {activeReservation.Hora}
                        <span className="ml-1 text-orange-300">
                          {timeText}
                        </span>
                      </div>
                    </div>
                  );
                }
                
                return table.client ? (
                  <div className="text-[10px] sm:text-xs lg:text-sm text-white/80 border-t border-white/20 pt-2">
                    <div className="font-semibold truncate">{table.client.name}</div>
                    <div className="truncate">{table.client.partySize} <span className="hidden lg:inline">personas</span><span className="lg:hidden">pers.</span></div>
                  </div>
                ) : null;
              })()}
              
              <div className="hidden lg:flex text-sm text-white/80 items-center">
                <Clock className="h-4 w-4 mr-2" />
                {table.lastUpdated ? new Date(table.lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
            </CardContent>
          </Card>
          );
        })}
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
