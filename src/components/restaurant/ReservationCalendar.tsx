'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Reservation {
  id: string;
  clientName: string;
  date: string;
  time: string;
  partySize: number;
  table: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  phone: string;
  notes?: string;
}

interface ReservationCalendarProps {
  restaurantId: string;
  isDarkMode?: boolean;
  restaurantTables?: Array<{
    id: string;
    name: string;
    capacity: number;
    location: string;
  }>;
}

export default function ReservationCalendar({ restaurantId, isDarkMode = false, restaurantTables }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  // Función para formatear fecha sin conversión a UTC (memoizada)
  const formatDateToLocal = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Función para normalizar fechas que pueden venir en diferentes formatos (memoizada)
  const normalizeDateString = useCallback((dateStr: string): string => {
    // Si la fecha ya está en formato YYYY-MM-DD, devolverla tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Si viene con hora, extraer solo la fecha
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    
    // Intentar parsear y reformatear
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return formatDateToLocal(date);
      }
    } catch (e) {
      console.error('Error parseando fecha:', dateStr, e);
    }
    
    return dateStr;
  }, [formatDateToLocal]);

  // Función para cargar reservas desde Google Sheets (memoizada, con caché)
  const loadReservations = useCallback(async () => {
    // Solo mostrar loading si no hay reservas previas
    if (reservations.length === 0) {
      setLoading(true);
    }
    
    try {
      const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedReservations = data.reservas.map((reserva: any, index: number) => ({
            id: reserva.ID || `res_${Date.now()}_${index}`,
            clientName: reserva.Cliente,
            date: normalizeDateString(reserva.Fecha),
            time: reserva.Hora,
            partySize: reserva.Personas,
            table: reserva.Mesa || 'Por asignar',
            status: reserva.Estado === 'Confirmada' ? 'confirmed' : 
                   reserva.Estado === 'Pendiente' ? 'pending' : 'cancelled',
            phone: reserva.Telefono || '',
            notes: reserva.Notas || ''
          }));
          
          // Eliminar duplicados por ID y asegurar keys únicas
          const uniqueReservations = formattedReservations.reduce((acc: any[], current: any) => {
            const existing = acc.find(item => item.id === current.id);
            if (!existing) {
              // Si no existe, agregar con key única
              acc.push({
                ...current,
                id: `${current.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              });
            }
            return acc;
          }, []);
          
          setReservations(uniqueReservations);
        }
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
      // No limpiar reservas existentes en caso de error
      if (reservations.length === 0) {
        setReservations([]);
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantId, normalizeDateString, reservations.length]);

  // Cargar reservas al montar (sin auto-refresh para mejor rendimiento)
  useEffect(() => {
    loadReservations();
    
    // DESHABILITADO: Auto-refresh para mejorar rendimiento
    // Las reservas se actualizan cuando:
    // 1. El usuario navega entre meses
    // 2. Se crea/modifica una reserva
    // 3. El usuario hace click en "Actualizar" en el dashboard
    
    // const interval = setInterval(loadReservations, 300000); // 5 minutos
    // return () => clearInterval(interval);
  }, [loadReservations]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  // Memoizar días del mes
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Convertir el día de la semana para que lunes sea 0
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6; // Domingo se convierte en 6

    const days = [];
    
    // Dias del mes anterior para completar la primera semana (empezando en lunes)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Dias del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Completar hasta 42 dias (6 semanas)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  }, []);

  // Memoizar reservas por fecha
  const getReservationsForDate = useCallback((date: Date) => {
    const dateStr = formatDateToLocal(date);
    const filtered = reservations.filter(res => res.date === dateStr);
    
    // Debug: mostrar comparaciones
    if (filtered.length > 0) {
      console.log('📅 Reservas encontradas para:', {
        fechaBuscada: dateStr,
        reservasEncontradas: filtered.length,
        reservas: filtered
      });
    }
    
    return filtered;
  }, [reservations, formatDateToLocal]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }, []);

  const formatDateForDisplay = useCallback((date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // Memoizar días del mes actual
  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate, getDaysInMonth]);
  
  // Memoizar reservas del mes actual
  const currentMonthReservations = useMemo(() => {
    const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    return reservations.filter(r => r.date.startsWith(monthStr));
  }, [reservations, currentDate]);

  return (
    <div className={`p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 lg:space-y-6 transition-colors duration-300 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Header del Calendario */}
      <div className="flex items-center justify-between">
        <Button 
          onClick={loadReservations}
          disabled={loading}
          className={`h-7 px-2 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? '...' : '🔄'} <span className="hidden lg:inline ml-2">Actualizar</span>
        </Button>
        
        <div className={`flex items-center gap-1.5 lg:gap-3 rounded-lg lg:rounded-xl border shadow-sm px-2 py-1 lg:px-4 lg:py-2 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
            : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
        }`}>
          {/* Selector de Mes */}
          <select
            value={currentDate.getMonth()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setMonth(parseInt(e.target.value));
              setCurrentDate(newDate);
            }}
            className={`px-1.5 py-0.5 lg:px-3 lg:py-1 border rounded-md lg:rounded-lg font-medium focus:outline-none text-xs lg:text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-purple-300 text-purple-900'
            }`}
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>

          {/* Selector de Año */}
          <select
            value={currentDate.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(parseInt(e.target.value));
              setCurrentDate(newDate);
            }}
            className={`px-1.5 py-0.5 lg:px-3 lg:py-1 border rounded-md lg:rounded-lg font-medium focus:outline-none text-xs lg:text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-purple-300 text-purple-900'
            }`}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
        
        <div className={`px-2 py-1 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold ${
          isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-purple-100 text-purple-900'
        }`}>
          {currentMonthReservations.length} <span className="hidden lg:inline">reserva{currentMonthReservations.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Calendario Principal responsive */}
      <Card className={`p-2 sm:p-3 lg:p-6 backdrop-blur-sm border-0 shadow-xl rounded-lg lg:rounded-2xl transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
      }`}>
        {/* Cabecera de dias */}
        <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-1 lg:-mb-3 lg:-mt-2">
          {dayNames.map(day => (
            <div key={day} className={`text-center font-semibold text-[10px] sm:text-xs lg:text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-slate-600'
            }`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid del calendario responsive */}
        <div className="grid grid-cols-7 gap-1 lg:gap-2">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayReservations = getReservationsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            
            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-1 min-h-[50px] sm:min-h-[60px] lg:min-h-[90px] border lg:border-2 rounded-md lg:rounded-xl cursor-pointer transition-all duration-200 ${
                  isCurrentMonth 
                    ? isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 lg:hover:border-gray-500'
                      : 'bg-white hover:bg-blue-50 border-slate-200 lg:hover:border-blue-300'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-500'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                } ${
                  isToday ? (isDarkMode ? 'ring-1 lg:ring-2 ring-blue-400 lg:bg-blue-900/30' : 'ring-1 lg:ring-2 ring-blue-400 lg:bg-blue-50') : ''
                } ${
                  isSelected ? (isDarkMode ? 'ring-1 lg:ring-2 ring-purple-400 lg:bg-purple-900/30' : 'ring-1 lg:ring-2 ring-purple-400 lg:bg-purple-50') : ''
                }`}
              >
                <div className="text-center">
                  <div className={`text-[10px] sm:text-xs lg:text-sm font-semibold mb-0.5 lg:mb-1 ${
                    isToday 
                      ? (isDarkMode ? 'text-blue-400' : 'text-blue-700')
                      : isCurrentMonth 
                        ? (isDarkMode ? 'text-white' : 'text-slate-900')
                        : (isDarkMode ? 'text-gray-500' : 'text-slate-400')
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Indicador de reservas - móvil/tablet: puntos, desktop: lista */}
                  <div className="lg:hidden">
                    {dayReservations.length > 0 && (
                      <div className="flex justify-center gap-0.5">
                        {dayReservations.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500"></div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block space-y-1">
                    {dayReservations.slice(0, 2).map(reservation => (
                      <div
                        key={reservation.id}
                        className={`text-xs px-2 py-1 rounded-lg border ${getStatusColor(reservation.status)}`}
                      >
                        <div className="font-semibold truncate">{reservation.time}</div>
                        <div className="truncate">{reservation.clientName}</div>
                      </div>
                    ))}
                    {dayReservations.length > 2 && (
                      <div className="text-xs text-slate-500 font-semibold">
                        +{dayReservations.length - 2} mas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detalles del dia seleccionado responsive */}
      {selectedDate && (
        <Card className={`p-3 lg:p-6 border-0 shadow-xl rounded-lg lg:rounded-2xl ${
          isDarkMode ? 'bg-gray-800/60' : 'bg-gradient-to-br from-purple-50 to-violet-50'
        }`}>
          <div className="flex items-center justify-between mb-3 lg:mb-6">
            <h3 className={`text-sm sm:text-base lg:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
              <span className="lg:hidden">{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
              <span className="hidden lg:inline">{formatDateForDisplay(selectedDate)}</span>
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className={`px-2 py-1 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-purple-100 hover:bg-purple-200 border-2 lg:border-purple-300 text-purple-700'
              }`}
            >
              ✕ <span className="hidden lg:inline">Cerrar</span>
            </button>
          </div>
          
          {getReservationsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-4 lg:py-8">
              <div className="hidden lg:flex w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 items-center justify-center">
                <div className="w-8 h-8 bg-slate-300 rounded-xl"></div>
              </div>
              <h4 className="hidden lg:block text-lg font-semibold text-slate-700 mb-2">No hay reservas</h4>
              <p className={`text-xs lg:text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                <span className="lg:hidden">Sin reservas</span>
                <span className="hidden lg:inline">Este dia esta libre para nuevas reservas</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2 lg:space-y-4">
              {getReservationsForDate(selectedDate).map(reservation => (
                <div key={reservation.id} className={`p-2 lg:p-4 rounded-lg lg:rounded-xl shadow border-l-2 lg:border-l-4 border-purple-400 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                      <div className={`w-6 h-6 lg:w-10 lg:h-10 rounded-md lg:rounded-xl flex items-center justify-center text-white font-bold text-xs lg:text-base ${
                        isDarkMode ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-400 to-purple-600'
                      }`}>
                        {reservation.partySize}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-xs lg:text-base truncate ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                          {reservation.clientName}
                        </h4>
                        <p className={`text-[10px] lg:text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-purple-700'}`}>
                          {reservation.time} • Mesa {reservation.table}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] lg:text-xs px-1.5 py-0.5 lg:px-2 lg:py-1 ${getStatusColor(reservation.status)}`}>
                      <span className="lg:hidden">{reservation.status === 'confirmed' ? 'OK' : reservation.status === 'pending' ? 'Pend' : 'X'}</span>
                      <span className="hidden lg:inline">{reservation.status === 'confirmed' ? 'Confirmada' : reservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}</span>
                    </Badge>
                  </div>
                  
                  {reservation.notes && (
                    <p className={`text-[10px] lg:text-xs mt-1 lg:mt-2 italic truncate ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`}>
                      {reservation.notes}
                    </p>
                  )}
                  
                  <div className="hidden lg:grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="font-semibold text-purple-900">Teléfono:</span>
                      <span className="text-purple-700 ml-2">{reservation.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}


    </div>
  );
}
