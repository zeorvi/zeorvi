'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  RefreshCw,
  User,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { getReservationsByDate, Reservation, getClientById, Client } from '@/lib/restaurantData';

interface ReservationCalendarProps {
  restaurantId: string;
}

export default function ReservationCalendar({ restaurantId }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [selectedClient, setSelectedClient] = useState<Reservation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [showMonthDetails, setShowMonthDetails] = useState(false);
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'confirmada' | 'completada' | 'cancelada'>('all');
  const [sortOrder, setSortOrder] = useState<'date' | 'time' | 'name' | 'status'>('date');

  const loadReservations = useCallback(() => {
    setIsLoading(true);
    try {
      let allReservations: Reservation[] = [];
      
      if (viewMode === 'week') {
        // Cargar reservas para toda la semana
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Lunes
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          const dayReservations = getReservationsByDate(day);
          allReservations = [...allReservations, ...dayReservations];
        }
      } else if (viewMode === 'month') {
        // Cargar reservas para todo el mes
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
          const date = new Date(year, month, day);
          const dayReservations = getReservationsByDate(date);
          allReservations = [...allReservations, ...dayReservations];
        }
      } else if (viewMode === 'year') {
        // Para vista de año, cargar reservas de todo el año
        for (let month = 0; month < 12; month++) {
          const lastDay = new Date(currentDate.getFullYear(), month + 1, 0);
          
          for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentDate.getFullYear(), month, day);
            const dayReservations = getReservationsByDate(date);
            allReservations = [...allReservations, ...dayReservations];
          }
        }
      } else {
        // Para vista 'today' o por defecto
        allReservations = getReservationsByDate(currentDate);
      }
      
      // Eliminar duplicados por ID
      const uniqueReservations = allReservations.filter((reservation, index, self) => 
        index === self.findIndex(r => r.id === reservation.id)
      );
      
      setReservations(uniqueReservations);
      console.log(`Cargadas ${uniqueReservations.length} reservas para restaurante ${restaurantId} (vista: ${viewMode})`);
    } catch (error) {
      console.error(`Error al cargar reservas para restaurante ${restaurantId}:`, error);
      toast.error('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, restaurantId, viewMode]);

  // Cargar reservas con actualización automática más frecuente
  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 10000); // Actualizar cada 10 segundos
    
    // Escuchar eventos de mesas liberadas automáticamente
    const handleMesaLiberada = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { mesaId, cliente, tiempoOcupada } = customEvent.detail;
      
      toast.success(`🧹 Mesa ${mesaId} liberada automáticamente en el calendario`);
      toast.info(`${cliente} completó su reserva (${Math.floor(tiempoOcupada / 60)}h ${tiempoOcupada % 60}m) - Mesa disponible para nuevas reservas`);
      
      // Recargar reservas para reflejar el cambio
      loadReservations();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mesa-liberada-automaticamente', handleMesaLiberada);
    }
    
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('mesa-liberada-automaticamente', handleMesaLiberada);
      }
    };
  }, [loadReservations]);

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lunes
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };


  // Función para obtener días del mes
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    
    const monthDates = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      monthDates.push(new Date(year, month, day));
    }
    return monthDates;
  };

  // Función para obtener meses del año
  const getYearMonths = (date: Date) => {
    const year = date.getFullYear();
    const months = [];
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  };

  // Obtener reservas para una fecha específica
  const getReservationsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Usar restaurantId para filtrar reservas específicas del restaurante
    return reservations.filter(res => {
      const resDate = new Date(res.date);
      return resDate.getFullYear() === year && 
             resDate.getMonth() === month && 
             resDate.getDate() === day;
    });
  };

  // Obtener reservas para un mes específico
  const getReservationsForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Usar restaurantId para contexto del restaurante específico
    return reservations.filter(res => {
      const resDate = new Date(res.date);
      return resDate.getFullYear() === year && resDate.getMonth() === month;
    });
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmada':
        return 'bg-green-500 text-white border-green-600 shadow-md font-bold';
      case 'completada':
        return 'bg-blue-500 text-white border-blue-600 shadow-md font-bold';
      case 'cancelada':
        return 'bg-red-500 text-white border-red-600 shadow-md font-bold';
      case 'pendiente':
        return 'bg-yellow-500 text-black border-yellow-600 shadow-md font-bold';
      default:
        return 'bg-green-500 text-white border-green-600 shadow-md font-bold'; // Por defecto confirmada
    }
  };

  const getStatusText = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'completada':
        return 'Completada';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'Confirmada'; // Por defecto confirmada
    }
  };

  const changeReservationStatus = (reservationId: string, newStatus: Reservation['status']) => {
    setReservations(prev => 
      prev.map(res => 
        res.id === reservationId 
          ? { ...res, status: newStatus }
          : res
      )
    );
    
    // Mensajes específicos según el nuevo estado
    if (newStatus === 'completada') {
      toast.success(`🔴 Mesa marcada como OCUPADA`);
      toast.info('La mesa se ha movido a "Mesas Ocupadas"');
    } else if (newStatus === 'cancelada') {
      toast.success(`🟢 Mesa marcada como LIBRE`);
      toast.info('La mesa se ha movido a "Mesas Libres"');
    } else if (newStatus === 'confirmada') {
      toast.success(`🟡 Reserva CONFIRMADA`);
      toast.info('La reserva permanece en "Mesas Reservadas"');
    }
  };

  const showClientInfo = (reservation: Reservation) => {
    setSelectedClient(reservation);
    const client = getClientData(reservation.clientId);
    toast.success(`👤 Información de ${client?.name || 'Cliente'}`);
  };

  const openDateDetails = (date: Date) => {
    setSelectedDate(date);
    setShowDateDetails(true);
  };

  const openMonthDetails = (month: Date) => {
    setSelectedMonth(month);
    setShowMonthDetails(true);
  };

  // Helper para obtener datos del cliente
  const getClientData = (clientId: string): Client | null => {
    return getClientById(clientId);
  };


  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);
  const yearMonths = getYearMonths(currentDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando reservas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Filtros y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl shadow-sm border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white rounded-lg shadow-sm border p-1">
            {[
              { value: 'week', label: 'Semana', icon: '📅' },
              { value: 'month', label: 'Mes', icon: '🗓️' },
              { value: 'year', label: 'Año', icon: '📊' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setViewMode(option.value as typeof viewMode)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                  viewMode === option.value 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as typeof filterStatus);
                  toast.success('🔍 Filtro aplicado');
                }}
                className="appearance-none bg-white border border-gray-300 hover:border-orange-400 text-gray-700 px-4 py-2 pr-8 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
              >
                <option value="all">🔍 Todos los estados</option>
                <option value="pendiente">🟡 Pendiente</option>
                <option value="confirmada">🟢 Confirmada</option>
                <option value="completada">🔵 Completada</option>
                <option value="cancelada">🔴 Cancelada</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as typeof sortOrder);
                  toast.success('📊 Orden cambiado');
                }}
                className="appearance-none bg-white border border-gray-300 hover:border-orange-400 text-gray-700 px-4 py-2 pr-8 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
              >
                <option value="date">📅 Por fecha</option>
                <option value="time">⏰ Por hora</option>
                <option value="name">👤 Por nombre</option>
                <option value="status">📊 Por estado</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="relative flex-1 sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar cliente, mesa, hora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 hover:border-orange-400 bg-white text-gray-700 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navegación de fechas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg shadow-sm border border-orange-200">
        <div className="flex items-center space-x-3">
          <button
            className="bg-white border border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => {
              const newDate = new Date(currentDate);
              if (viewMode === 'week') {
                newDate.setDate(currentDate.getDate() - 7);
              } else if (viewMode === 'month') {
                newDate.setMonth(currentDate.getMonth() - 1);
              } else if (viewMode === 'year') {
                newDate.setFullYear(currentDate.getFullYear() - 1);
              }
              setCurrentDate(newDate);
            }}
          >
            ← Anterior
          </button>
          
          <div className="text-center min-w-40 sm:min-w-52">
            <h2 className="text-base sm:text-lg font-bold text-orange-800 bg-white px-3 py-1.5 rounded-md shadow-sm border border-orange-200">
              {viewMode === 'week' && `${weekDates[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
              {viewMode === 'month' && currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              {viewMode === 'year' && currentDate.toLocaleDateString('es-ES', { year: 'numeric' })}
            </h2>
          </div>
          
          <button
            className="bg-white border border-orange-300 hover:bg-orange-50 hover:border-orange-400 text-orange-700 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => {
              const newDate = new Date(currentDate);
              if (viewMode === 'week') {
                newDate.setDate(currentDate.getDate() + 7);
              } else if (viewMode === 'month') {
                newDate.setMonth(currentDate.getMonth() + 1);
              } else if (viewMode === 'year') {
                newDate.setFullYear(currentDate.getFullYear() + 1);
              }
              setCurrentDate(newDate);
            }}
          >
            Siguiente →
          </button>
        </div>

        <div className="flex items-center">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Vista de semana - Diseño moderno */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          {weekDates.map((date, index) => {
            const dayReservations = getReservationsForDate(date);
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            const isPastDate = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-4 min-h-[280px] cursor-pointer transition-all duration-300 hover:scale-[1.02] border-2 ${
                  isToday 
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 border-orange-500 shadow-xl text-white' 
                    : isPastDate 
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 hover:shadow-lg text-slate-700'
                    : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:shadow-xl hover:border-blue-400 text-slate-800'
                }`}
                onClick={() => {
                  if (dayReservations.length > 0) {
                    openDateDetails(date);
                  } else if (!isPastDate) {
                    setSelectedDate(date);
                    setShowNewReservationForm(true);
                    toast.info(`Crear nueva reserva para ${date.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}`);
                  }
                }}
              >
                {/* Header del día */}
                <div className="text-center mb-4">
                  <div className={`text-sm font-medium uppercase tracking-wide mb-1 ${
                    isToday ? 'text-orange-100' : isPastDate ? 'text-slate-500' : 'text-blue-600'
                  }`}>
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className={`text-2xl font-bold ${
                    isToday ? 'text-white' : isPastDate ? 'text-slate-600' : 'text-slate-800'
                  }`}>
                    {date.getDate()}
                  </div>
                  {isToday && (
                    <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-bold mt-1">
                      HOY
                    </div>
                  )}
                  {dayReservations.length > 0 && (
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-2 ${
                      isToday ? 'bg-white/30 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {dayReservations.length}
                    </div>
                  )}
                </div>

                {/* Reservas */}
                <div className="space-y-2">
                  {dayReservations.slice(0, 4).map((reservation) => {
                    const client = getClientData(reservation.clientId);
                    return (
                      <div
                        key={reservation.id}
                        className={`p-2 rounded-lg text-xs ${
                          isToday 
                            ? 'bg-white/20 text-white border border-white/30' 
                            : isPastDate 
                            ? 'bg-white/60 text-slate-700 border border-slate-300' 
                            : 'bg-white text-slate-700 border border-blue-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{reservation.time}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            reservation.status === 'confirmada' ? 'bg-green-500 text-white' :
                            reservation.status === 'pendiente' ? 'bg-yellow-500 text-black' :
                            'bg-red-500 text-white'
                          }`}>
                            {reservation.status === 'confirmada' ? '✓' : 
                             reservation.status === 'pendiente' ? '⏳' : '✗'}
                          </span>
                        </div>
                        <div className="truncate font-medium">{client?.name || 'Cliente'}</div>
                        <div className="flex justify-between items-center text-xs opacity-80">
                          <span>{reservation.people}p</span>
                          <span>Mesa {reservation.tableId}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayReservations.length > 4 && (
                    <div className={`text-center text-xs font-bold py-2 rounded-lg ${
                      isToday ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                    }`}>
                      +{dayReservations.length - 4} más
                    </div>
                  )}
                  
                  {dayReservations.length === 0 && (
                    <div className="text-center py-8">
                      <div className={`text-4xl mb-2 ${isPastDate ? '📝' : '➕'}`}>
                        {isPastDate ? '📝' : '➕'}
                      </div>
                      <div className={`text-xs font-medium ${
                        isToday ? 'text-white/80' : isPastDate ? 'text-slate-500' : 'text-blue-600'
                      }`}>
                        {isPastDate ? 'Sin actividad' : 'Agregar reserva'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Indicador de estado del día */}
                <div className="absolute top-3 right-3">
                  {dayReservations.length > 0 ? (
                    <div className={`w-3 h-3 rounded-full ${
                      isToday ? 'bg-white/50' : 'bg-green-400'
                    }`}></div>
                  ) : !isPastDate ? (
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista de mes - Calendario completo con estadísticas */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Cabeceras de días */}
          <div className="grid grid-cols-7 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, idx) => (
              <div key={day} className={`text-center text-sm font-bold py-4 px-2 ${
                idx >= 5 ? 'bg-white/10' : ''
              }`}>
                <div className="hidden lg:block">{day}</div>
                <div className="lg:hidden">{day.slice(0, 3)}</div>
              </div>
            ))}
          </div>
          
          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-0">
            {monthDates.map((date, index) => {
              const dayReservations = getReservationsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const today = new Date();
              const isPastDate = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              
              return (
                <div
                  key={index}
                  className={`min-h-[140px] p-3 border-r border-b border-gray-100 cursor-pointer transition-all duration-200 hover:shadow-lg relative ${
                    isToday ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 ring-2 ring-orange-400' :
                    isPastDate ? 'bg-gray-50 hover:bg-gray-100' :
                    'bg-white hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    if (dayReservations.length > 0) {
                      openDateDetails(date);
                    } else if (!isPastDate) {
                      setSelectedDate(date);
                      setShowNewReservationForm(true);
                      toast.info(`Crear reserva para ${date.getDate()} de ${date.toLocaleDateString('es-ES', { month: 'long' })}`);
                    }
                  }}
                >
                  {/* Número del día */}
                  <div className={`text-center font-bold mb-3 ${
                    isToday ? 'text-orange-800 text-xl' :
                    isPastDate ? 'text-gray-500 text-lg' :
                    'text-slate-700 text-lg'
                  }`}>
                    {date.getDate()}
                    {isToday && (
                      <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-bold mt-1 inline-block">
                        HOY
                      </div>
                    )}
                  </div>
                  
                  {/* Contador de reservas prominente */}
                  {dayReservations.length > 0 && (
                    <div className="text-center mb-3">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-lg ${
                        isToday ? 'bg-orange-600 text-white' :
                        isPastDate ? 'bg-blue-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {dayReservations.length}
                      </div>
                      <div className={`text-xs font-medium mt-1 ${
                        isToday ? 'text-orange-700' :
                        isPastDate ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {dayReservations.length === 1 ? 'reserva' : 'reservas'}
                      </div>
                    </div>
                  )}
                  
                  {/* Estados de reservas */}
                  {dayReservations.length > 0 && (
                    <div className="space-y-1">
                      {/* Mostrar primeras 2 reservas */}
                      {dayReservations.slice(0, 2).map((reservation) => {
                        const client = getClientData(reservation.clientId);
                        return (
                          <div
                            key={reservation.id}
                            className={`text-xs p-2 rounded-lg font-medium shadow-sm ${
                              reservation.status === 'confirmada' ? 'bg-green-500 text-white' :
                              reservation.status === 'pendiente' ? 'bg-yellow-500 text-black' :
                              reservation.status === 'cancelada' ? 'bg-red-500 text-white' :
                              'bg-blue-500 text-white'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>{reservation.time}</span>
                              <span className="text-xs opacity-80">M{reservation.tableId.replace('M', '')}</span>
                            </div>
                            <div className="opacity-90 truncate">{client?.name || 'Cliente'}</div>
                            <div className="opacity-75 text-xs">{reservation.people}p</div>
                          </div>
                        );
                      })}
                      
                      {/* Contador si hay más de 2 */}
                      {dayReservations.length > 2 && (
                        <div className="text-xs text-center font-bold py-1 px-2 rounded-lg bg-orange-500 text-white shadow-sm">
                          +{dayReservations.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Día vacío */}
                  {dayReservations.length === 0 && !isPastDate && (
                    <div className="text-center py-4">
                      <div className="text-2xl text-gray-300 mb-1">➕</div>
                      <div className="text-xs text-gray-400 font-medium">Agregar</div>
                      <div className="text-xs text-gray-300">reserva</div>
                    </div>
                  )}
                  
                  {/* Día pasado sin actividad */}
                  {dayReservations.length === 0 && isPastDate && (
                    <div className="text-center py-4">
                      <div className="text-xl text-gray-300">📝</div>
                      <div className="text-xs text-gray-400">Sin actividad</div>
                    </div>
                  )}
                  
                  {/* Indicador de fin de semana */}
                  {(index % 7 >= 5) && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista de año */}
      {viewMode === 'year' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {yearMonths.map((month, index) => {
            const monthReservations = getReservationsForMonth(month);
            const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();
            
            const isPastMonth = month < new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            
            return (
              <Card 
                key={index} 
                className={`min-h-[200px] cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  isCurrentMonth ? 'ring-2 ring-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg' :
                  isPastMonth ? 'bg-gradient-to-br from-gray-50 to-blue-50 hover:shadow-lg' :
                  'bg-gradient-to-br from-white to-emerald-50 hover:shadow-lg hover:ring-2 hover:ring-emerald-300'
                }`}
                onClick={() => monthReservations.length > 0 && openMonthDetails(month)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className={`text-center text-lg capitalize font-bold ${
                    isCurrentMonth ? 'text-orange-700' :
                    isPastMonth ? 'text-gray-600' :
                    'text-emerald-700'
                  }`}>
                    {month.toLocaleDateString('es-ES', { month: 'long' })}
                    {isCurrentMonth && (
                      <div className="text-xs font-normal text-orange-600 mt-1">MES ACTUAL</div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className={`text-4xl font-bold mb-1 ${
                      isCurrentMonth ? 'text-orange-600' :
                      isPastMonth ? 'text-blue-600' :
                      'text-emerald-600'
                    }`}>
                      {monthReservations.length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {monthReservations.length === 1 ? 'reserva' : 'reservas'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Confirmadas:</span>
                      <span className="font-medium text-green-600">
                        {monthReservations.filter(r => r.status === 'confirmada').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Completadas:</span>
                      <span className="font-medium text-blue-600">
                        {monthReservations.filter(r => r.status === 'completada').length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <button
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                        isCurrentMonth ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                        isPastMonth ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' :
                        'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(month);
                        setViewMode('month');
                        toast.success(`📅 Ver calendario de ${month.toLocaleDateString('es-ES', { month: 'long' })}`);
                      }}
                    >
                      📅 Ver Mes
                    </button>
                    {monthReservations.length > 0 && (
                      <button
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                          isPastMonth ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                          'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openMonthDetails(month);
                        }}
                      >
                        📋 Ver Lista
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      {/* Modal de Información del Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const client = getClientData(selectedClient.clientId);
                return (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <p className="text-gray-900 font-medium">{client?.name || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <p className="text-gray-900">{client?.phone || 'No especificado'}</p>
                    </div>

                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <p className="text-gray-900">{selectedClient?.date.toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <p className="text-gray-900">{selectedClient.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personas</label>
                  <p className="text-gray-900">{selectedClient.people} personas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesa</label>
                  <p className="text-gray-900">Mesa {selectedClient.tableId}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Badge className={getStatusColor(selectedClient.status)}>
                  {getStatusText(selectedClient.status)}
                </Badge>
              </div>

              {selectedClient.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <button
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                  onClick={() => {
                    setSelectedClient(null);
                    toast.info('Cerrando información del cliente');
                  }}
                >
                  Cerrar
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalles del Día */}
      {showDateDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Reservas del {selectedDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </CardTitle>
                <button
                  onClick={() => setShowDateDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getReservationsForDate(selectedDate).map((reservation) => {
                  const client = getClientData(reservation.clientId);
                  return (
                    <Card key={reservation.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {client?.name || 'Cliente sin nombre'}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {client?.phone || 'Sin teléfono'}
                              </p>
                            </div>
                          </div>
                        <Badge className={getStatusColor(reservation.status)}>
                          {getStatusText(reservation.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{reservation.time}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{reservation.people} personas</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Mesa {reservation.tableId}</span>
                        </div>
                      </div>
                      
                      {reservation.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notas:</strong> {reservation.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => showClientInfo(reservation)}
                          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => changeReservationStatus(reservation.id, 'confirmada')}
                          className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Confirmar
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
                
                {getReservationsForDate(selectedDate).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <p className="text-gray-600">No hay reservas para este día</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalles del Mes */}
      {showMonthDetails && selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Reservas de {selectedMonth.toLocaleDateString('es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </CardTitle>
                <button
                  onClick={() => setShowMonthDetails(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {getReservationsForMonth(selectedMonth).length}
                  </div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getReservationsForMonth(selectedMonth).filter(r => r.status === 'confirmada').length}
                  </div>
                  <div className="text-xs text-gray-600">Confirmadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getReservationsForMonth(selectedMonth).filter(r => r.status === 'completada').length}
                  </div>
                  <div className="text-xs text-gray-600">Completadas</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getReservationsForMonth(selectedMonth)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((reservation) => {
                    const client = getClientData(reservation.clientId);
                    return (
                      <Card key={reservation.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-orange-600">
                                  {new Date(reservation.date).getDate()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {new Date(reservation.date).toLocaleDateString('es-ES', { month: 'short' })}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {client?.name || 'Cliente sin nombre'}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{reservation.time}</span>
                                  <span>{reservation.people} personas</span>
                                  <span>Mesa {reservation.tableId}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(reservation.status)}>
                                {getStatusText(reservation.status)}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {client?.phone || 'Sin teléfono'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                
                {getReservationsForMonth(selectedMonth).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <p className="text-gray-600">No hay reservas para este mes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Nueva Reserva */}
      {showNewReservationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Reserva</CardTitle>
                <button
                  onClick={() => setShowNewReservationForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const newReservation = {
                  clientName: formData.get('clientName') as string,
                  clientPhone: formData.get('clientPhone') as string,
                  date: formData.get('date') as string,
                  time: formData.get('time') as string,
                  people: parseInt(formData.get('people') as string),
                  notes: formData.get('notes') as string
                };
                
                toast.success(`✅ Reserva creada para ${newReservation.clientName}`);
                toast.info(`${newReservation.people} personas - ${newReservation.date} ${newReservation.time}`);
                setShowNewReservationForm(false);
                loadReservations(); // Recargar reservas
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del cliente *
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+34 123 456 789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      defaultValue={selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora *
                    </label>
                    <select
                      name="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Seleccionar hora</option>
                      <optgroup label="🍽️ Almuerzo">
                        <option value="13:00">13:00 - Primer turno (13:00-15:00)</option>
                        <option value="14:00">14:00 - Segundo turno (14:00-16:00)</option>
                      </optgroup>
                      <optgroup label="🌙 Cena">
                        <option value="20:00">20:00 - Primer turno (20:00-22:00)</option>
                        <option value="22:00">22:00 - Segundo turno (22:00-23:30)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de personas *
                  </label>
                  <select
                    name="people"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar personas</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Comentarios especiales, alergias, etc."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewReservationForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Crear Reserva
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
