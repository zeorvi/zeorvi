'use client';

import { useState, useEffect } from 'react';
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

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  useEffect(() => {

    // NO generar datos mock - Retell AI gestiona las reservas reales
    console.log('📅 ReservationCalendar: No mock data - waiting for real reservations');
    setReservations([]); // Calendario vacío hasta que lleguen reservas reales
  }, [restaurantId, restaurantTables]);

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

  const getDaysInMonth = (date: Date) => {
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
  };

  const getReservationsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(res => res.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const days = getDaysInMonth(currentDate);
  const currentMonthReservations = reservations.filter(r => 
    r.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)
  );

  return (
    <div className={`p-4 md:p-6 space-y-4 md:space-y-6 transition-colors duration-300 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>
      {/* Header del Calendario */}
      <div className="flex items-center justify-center">
        <div className={`flex items-center space-x-2 md:space-x-3 rounded-lg md:rounded-xl border shadow-sm px-3 md:px-4 py-1.5 md:py-2 transition-all duration-300 ${
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
            className={`px-2 md:px-3 py-1 border rounded-md md:rounded-lg font-medium focus:outline-none focus:ring-1 transition-all duration-300 text-xs md:text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-400' 
                : 'bg-white border-purple-300 text-purple-900 focus:border-purple-500 focus:ring-purple-200'
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
            className={`px-2 md:px-3 py-1 border rounded-md md:rounded-lg font-medium focus:outline-none focus:ring-1 transition-all duration-300 text-xs md:text-sm ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-gray-400' 
                : 'bg-white border-purple-300 text-purple-900 focus:border-purple-500 focus:ring-purple-200'
            }`}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* Calendario Principal */}
      <Card className={`p-4 md:p-6 backdrop-blur-sm border-0 shadow-xl rounded-xl md:rounded-2xl transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
      }`}>
        {/* Cabecera de dias */}
        <div className="grid grid-cols-7 gap-2 -mb-3 -mt-2">
          {dayNames.map(day => (
            <div key={day} className={`text-center font-semibold text-xs md:text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-slate-600'
            }`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid del calendario */}
        <div className="grid grid-cols-7 gap-2">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayReservations = getReservationsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            
            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`pt-1 pb-1 px-1 min-h-[70px] md:min-h-[90px] border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 ${
                  isCurrentMonth 
                    ? isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 hover:border-gray-500'
                      : 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-300'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-500'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                } ${
                  isToday ? (isDarkMode ? 'ring-2 ring-blue-400 bg-blue-900/30' : 'ring-2 ring-blue-400 bg-blue-50') : ''
                } ${
                  isSelected ? (isDarkMode ? 'ring-2 ring-purple-400 bg-purple-900/30' : 'ring-2 ring-purple-400 bg-purple-50') : ''
                }`}
              >
                <div className="text-center">
                  <div className={`text-xs md:text-sm font-semibold mb-1 transition-colors duration-300 ${
                    isToday 
                      ? (isDarkMode ? 'text-blue-400' : 'text-blue-700')
                      : isCurrentMonth 
                        ? (isDarkMode ? 'text-white' : 'text-slate-900')
                        : (isDarkMode ? 'text-gray-500' : 'text-slate-400')
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Reservas del dia */}
                  <div className="space-y-1">
                    {dayReservations.slice(0, 2).map(reservation => (
                      <div
                        key={reservation.id}
                        className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg border ${getStatusColor(reservation.status)}`}
                      >
                        <div className="font-semibold truncate">
                          {reservation.time}
                        </div>
                        <div className="truncate">
                          {reservation.clientName}
                        </div>
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

      {/* Detalles del dia seleccionado */}
      {selectedDate && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-purple-900">
              Reservas del {formatDateForDisplay(selectedDate)}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 border-2 border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-800 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
            >
              ✕ Cerrar
            </button>
          </div>
          
          {getReservationsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-slate-300 rounded-xl"></div>
              </div>
              <h4 className="text-lg font-semibold text-slate-700 mb-2">No hay reservas</h4>
              <p className="text-slate-500">Este dia esta libre para nuevas reservas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getReservationsForDate(selectedDate).map(reservation => (
                <div key={reservation.id} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-purple-400">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {reservation.partySize}
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-900">{reservation.clientName}</h4>
                        <p className="text-purple-700 text-sm">{reservation.time} • Mesa {reservation.table}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status === 'confirmed' ? 'Confirmada' : 
                       reservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-purple-900">Telefono:</span>
                      <span className="text-purple-700 ml-2">{reservation.phone}</span>
                    </div>
                    {reservation.notes && (
                      <div>
                        <span className="font-semibold text-purple-900">Notas:</span>
                        <span className="text-purple-700 ml-2">{reservation.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                      ✏️ Editar
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 border border-blue-300 text-blue-700 hover:text-blue-800 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                      📞 Llamar
                    </button>
                    {reservation.status === 'pending' && (
                      <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                        ✅ Confirmar
                      </button>
                    )}
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
