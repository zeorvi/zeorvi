'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface DailyAgendaProps {
  restaurantId: string;
}

interface Reservation {
  id: string;
  time: string;
  clientName: string;
  partySize: number;
  table: string;
  status: 'reserved' | 'occupied' | 'completed' | 'cancelled';
  notes?: string;
  phone?: string;
}

export default function DailyAgenda({ restaurantId }: DailyAgendaProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date());
  
  // 🔥 NOTIFICACIONES EN TIEMPO REAL (comentado temporalmente)
  // const { notifications: _notifications, isConnected: _isConnected, lastUpdate: _lastUpdate } = useRealtimeNotifications(restaurantId);

  // Función para cambiar el estado de una reserva (memoizada)
  const handleStatusChange = useCallback(async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      // Actualizar estado local inmediatamente
      setReservations(prev => 
        prev.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );

      // Actualizar en Google Sheets
      const response = await fetch('/api/google-sheets/update-reservation-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          reservationId,
          newStatus,
          fecha: new Date().toISOString().split('T')[0]
        }),
      });

      console.log('📡 Respuesta de API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error actualizando estado de reserva:', response.status, errorData);
        
        // NO revertir cambio local - mantener el estado seleccionado
        console.log('⚠️ Manteniendo cambio local aunque falle la actualización en Google Sheets');
      } else {
        const result = await response.json();
        console.log(`✅ Estado de reserva ${reservationId} actualizado a ${newStatus}:`, result);
      }
    } catch (error) {
      console.error('Error cambiando estado de reserva:', error);
    }
  }, [restaurantId]);

  // Auto-actualización DESHABILITADA - El usuario controla manualmente los estados
  // useEffect(() => {
  //   const autoCompleteInterval = setInterval(() => {
  //     const now = new Date();
  //     const currentHour = now.getHours();
      
  //     console.log('🕐 Verificando reservas para auto-completar...');
      
  //     setReservations(prevReservations => {
  //       const updatedReservations = prevReservations.map(reservation => {
  //         if (reservation.status === 'reserved') {
  //           const reservationHour = parseInt(reservation.time.split(':')[0]);
  //           const timeDifference = currentHour - reservationHour;
            
  //           // Si han pasado 2 horas o más, cambiar a completada
  //           if (timeDifference >= 2) {
  //             console.log(`✅ Auto-completando reserva ${reservation.id} (${reservation.time} → ${currentHour}:00)`);
              
  //             // Actualizar en Google Sheets en segundo plano
  //             handleStatusChange(reservation.id, 'completed');
              
  //             return { ...reservation, status: 'completed' as const };
  //           }
  //         }
  //         return reservation;
  //       });
        
  //       return updatedReservations;
  //     });
  //   }, 300000); // Cada 5 minutos verifica

  //   return () => clearInterval(autoCompleteInterval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // Cargar reservas (memoizado)
  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      
      // PRIMERO: Verificar si el restaurante está abierto
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
      
      console.log('🔍 DailyAgenda: Verificando estado del restaurante:', { restaurantId, today, currentTime });
      const statusResponse = await fetch(`/api/google-sheets/horarios?restaurantId=${restaurantId}&fecha=${today}&hora=${currentTime}`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 DailyAgenda: Respuesta de estado:', statusData);
        
        if (statusData.success) {
          const isOpen = statusData.status.abierto;
          
          // Si el restaurante está cerrado, limpiar reservas y no cargar más
          if (!isOpen) {
            console.log('🏪 DailyAgenda: Restaurante cerrado, limpiando agenda. Estado:', statusData.status);
            setReservations([]);
            setLoading(false);
            return; // Salir sin cargar reservas
          } else {
            console.log('✅ DailyAgenda: Restaurante abierto, cargando reservas');
          }
        }
      } else {
        console.error('❌ DailyAgenda: Error en la respuesta de estado del restaurante:', statusResponse.status);
      }
      
      // Solo cargar reservas si el restaurante está abierto
      const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&restaurantName=${encodeURIComponent('Restaurante')}&fecha=${today}&spreadsheetId=${restaurantId}_spreadsheet`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convertir formato de Google Sheets al formato del dashboard
          const reservasArray = Array.isArray(data.reservas) ? data.reservas : [];
          console.log('📊 Datos de reservas desde Google Sheets:', reservasArray);
          // Hora actual para calcular auto-completado
          const now = new Date();
          const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
          
          console.log('🕐 [DailyAgenda] Hora actual:', `${now.getHours()}:${now.getMinutes().toString().padStart(2,'0')}`, `(${currentTimeInMinutes} min)`);
          console.log('📊 [DailyAgenda] Procesando', reservasArray.length, 'reservas...');
          
          const formattedReservations = reservasArray.map((reserva: {
            ID?: string;
            Fecha?: string;
            Hora?: string;
            Cliente?: string;
            Telefono?: string;
            Personas?: number;
            Mesa?: string;
            Estado?: string;
            Notas?: string;
            // Campos alternativos (minúsculas)
            id?: string;
            hora?: string;
            cliente?: string;
            personas?: number;
            mesa?: string;
            estado?: string;
            notas?: string;
            telefono?: string;
          }) => {
            const reservaId = reserva.ID || reserva.id || `res_${Date.now()}_${Math.random()}`;
            const reservaHora = reserva.Hora || reserva.hora || '';
            
            // 1. Leer estado desde Google Sheets
            const estadoGoogleSheets = (reserva.Estado || reserva.estado || '').toLowerCase().trim();
            
            console.log(`📋 [DailyAgenda] Reserva ${reservaId} (${reservaHora}):`, {
              cliente: reserva.Cliente,
              estadoOriginal: estadoGoogleSheets,
              mesa: reserva.Mesa
            });
            
            // 2. Mapear estado de Google Sheets
            let calculatedStatus: Reservation['status'] = 'reserved';
            
            switch (estadoGoogleSheets) {
              case 'ocupada':
                calculatedStatus = 'occupied';
                break;
              case 'completada':
                calculatedStatus = 'completed';
                break;
              case 'cancelada':
                calculatedStatus = 'cancelled';
                break;
              case 'confirmada':
              case 'reservada':
              case '':
              case 'pendiente':
                calculatedStatus = 'reserved';
                break;
              default:
                calculatedStatus = 'reserved';
            }
            
            // 3. Auto-completar si pasaron más de 2 horas (solo si aún está reservada/ocupada)
            if (calculatedStatus === 'reserved' || calculatedStatus === 'occupied') {
              // Parsear hora de reserva (aceptar tanto "13:30" como "13.30")
              const normalizedTime = reservaHora.replace('.', ':');
              const timeParts = normalizedTime.split(':');
              
              if (timeParts.length >= 2) {
                const hours = parseInt(timeParts[0]) || 0;
                const minutes = parseInt(timeParts[1]) || 0;
                const reservaTimeInMinutes = hours * 60 + minutes;
                
                // Duración: 2 horas para comida, 2.5 horas para cena
                const isDinnerTime = hours >= 20 || hours < 2;
                const estimatedDuration = isDinnerTime ? 150 : 120; // minutos
                const reservaEndTime = reservaTimeInMinutes + estimatedDuration;
                
                // Si la reserva ya terminó, auto-completar
                if (currentTimeInMinutes > reservaEndTime) {
                  console.log(`⏰ [DailyAgenda] Auto-completando reserva ${reservaId} (${reservaHora}) - terminó hace ${Math.floor((currentTimeInMinutes - reservaEndTime) / 60)}h ${(currentTimeInMinutes - reservaEndTime) % 60}min`);
                  calculatedStatus = 'completed';
                  
                  // Actualizar en Google Sheets en segundo plano (sin esperar)
                  fetch('/api/google-sheets/update-reservation-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      restaurantId,
                      reservationId: reservaId,
                      newStatus: 'completed',
                      fecha: reserva.Fecha || new Date().toISOString().split('T')[0]
                    })
                  }).catch(err => console.error('Error auto-completando en Google Sheets:', err));
                }
              }
            }
            
            return {
              id: reservaId,
              time: reservaHora,
              clientName: reserva.Cliente || reserva.cliente || 'Sin nombre',
              partySize: reserva.Personas || reserva.personas || 1,
              table: reserva.Mesa || reserva.mesa || 'Por asignar',
              status: calculatedStatus,
              notes: reserva.Notas || reserva.notas || '',
              phone: reserva.Telefono || reserva.telefono || ''
            };
          });
          
          console.log('📋 Reservas formateadas para mostrar:', formattedReservations);
          setReservations(formattedReservations);
          console.log('📅 DailyAgenda: Reservas cargadas desde Google Sheets:', formattedReservations);
        } else {
          console.error('Error cargando reservas:', data.error);
          setReservations([]);
        }
      } else {
        console.error('Error en la respuesta de la API');
        setReservations([]);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadReservations();
    
    // Recargar cada 30 segundos (reducido de 10 para mejor rendimiento)
    const interval = setInterval(loadReservations, 30000);
    
    return () => clearInterval(interval);
  }, [loadReservations]);

  // Memoizar formato de fecha
  const formattedDate = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return `${days[selectedDate.getDay()]}, ${selectedDate.getDate()} De ${months[selectedDate.getMonth()]} De ${selectedDate.getFullYear()}`;
  }, [selectedDate]);

  // Memoizar estadísticas de reservas
  const reservationStats = useMemo(() => ({
    reserved: reservations.filter(r => r.status === 'reserved').length,
    occupied: reservations.filter(r => r.status === 'occupied').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    totalGuests: reservations.reduce((sum, r) => sum + r.partySize, 0)
  }), [reservations]);

  if (loading) {
    return (
      <div className="p-3">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-200 rounded-lg w-2/3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header responsive */}
      <div className="mb-4 lg:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1 lg:space-y-4">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              <span className="lg:hidden">Agenda de Hoy</span>
              <span className="hidden lg:inline">Agenda De {formattedDate}</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-xl text-slate-600 lg:font-medium">
              {reservations.length} reserva{reservations.length !== 1 ? 's' : ''} <span className="hidden lg:inline">programadas para hoy</span>
            </p>
          </div>
          
          <div className="flex gap-2 lg:space-x-6">
            <Button className="hidden sm:flex h-7 px-3 lg:px-8 lg:py-3 text-xs lg:text-sm rounded-lg lg:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg">
              <span className="lg:hidden">+ Nueva</span>
              <span className="hidden lg:inline">Nueva Reserva</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Reservas del Día responsive */}
      <div className="space-y-3">
        <h2 className="hidden lg:block text-2xl font-bold text-slate-900 tracking-tight mb-8">Reservas de Hoy</h2>
        
        {reservations.length === 0 ? (
          <Card className="p-8 lg:p-16 text-center bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-lg lg:rounded-3xl">
            <div className="hidden lg:block space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
                <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">No hay reservas programadas</h3>
            </div>
            <p className="text-sm text-slate-600 lg:hidden">No hay reservas para hoy</p>
          </Card>
        ) : (
          <div className="space-y-2 lg:space-y-3">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="p-2 sm:p-3 lg:p-4 bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-lg lg:rounded-xl hover:shadow-xl transition-all duration-200 lg:duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                  <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                    {/* Hora */}
                    <div className="flex-shrink-0">
                      <div className="px-2 py-1 lg:w-12 lg:h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md lg:rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-xs lg:text-sm font-bold text-slate-700">{reservation.time}</span>
                      </div>
                    </div>
                    
                    {/* Mesa */}
                    <div className="flex-shrink-0">
                      <div className="px-2 py-1 lg:px-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md shadow-md">
                        <span className="text-white font-bold text-xs">Mesa {reservation.table}</span>
                      </div>
                    </div>
                    
                    {/* Información del Cliente */}
                    <div className="flex-1 min-w-0 lg:space-y-1">
                      <h3 className="text-sm lg:text-lg font-bold text-slate-900 truncate">{reservation.clientName}</h3>
                      <div className="flex items-center gap-2 lg:gap-3 text-xs">
                        <span className="text-slate-600 lg:font-medium">{reservation.partySize} <span className="hidden lg:inline">personas</span><span className="lg:hidden">pers.</span></span>
                        <span className="hidden lg:inline text-slate-400">•</span>
                        <span className="hidden lg:inline text-slate-500 font-medium">{reservation.phone || "No disponible"}</span>
                        {reservation.notes && (
                          <>
                            <span className="lg:hidden text-slate-400">•</span>
                            <span className="lg:hidden text-slate-500 italic truncate">{reservation.notes}</span>
                          </>
                        )}
                      </div>
                      {reservation.notes && (
                        <p className="hidden lg:block text-slate-500 italic text-xs max-w-md">{reservation.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className="flex-shrink-0">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value as Reservation['status'])}
                      className={`w-full sm:w-auto px-2 py-1 lg:px-3 rounded-md lg:rounded-full text-xs font-semibold border lg:border-2 cursor-pointer transition-colors ${
                        reservation.status === "reserved"
                          ? "text-orange-700 bg-orange-100 border-orange-300 hover:bg-orange-200"
                          : reservation.status === "occupied"
                          ? "text-red-700 bg-red-100 border-red-300 hover:bg-red-200"
                          : reservation.status === "completed"
                          ? "text-gray-700 bg-gray-100 border-gray-300 hover:bg-gray-200"
                          : "text-rose-700 bg-rose-100 border-rose-300 hover:bg-rose-200"
                      }`}
                    >
                      <option value="reserved">Reservada</option>
                      <option value="occupied">Ocupada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resumen del Día responsive */}
      <div className="mt-4 lg:mt-16 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-3 gap-2 lg:gap-8">
        <Card className="p-2 lg:p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-lg lg:shadow-xl rounded-lg lg:rounded-3xl">
          <div className="text-center lg:space-y-4">
            <div className="hidden lg:flex w-16 h-16 bg-emerald-500 rounded-2xl mx-auto items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold text-orange-700">{reservationStats.reserved}</div>
              <div className="text-orange-600 font-semibold text-[10px] sm:text-xs lg:text-lg">Reservadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-2 lg:p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-lg lg:shadow-xl rounded-lg lg:rounded-3xl">
          <div className="text-center lg:space-y-4">
            <div className="hidden lg:flex w-16 h-16 bg-amber-500 rounded-2xl mx-auto items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold text-red-700">{reservationStats.occupied}</div>
              <div className="text-red-600 font-semibold text-[10px] sm:text-xs lg:text-lg">Ocupadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-2 lg:p-8 bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-lg lg:shadow-xl rounded-lg lg:rounded-3xl">
          <div className="text-center lg:space-y-4">
            <div className="hidden lg:flex w-16 h-16 bg-emerald-500 rounded-2xl mx-auto items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold text-emerald-700">{reservationStats.completed}</div>
              <div className="text-emerald-600 font-semibold text-[10px] sm:text-xs lg:text-lg">Completadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-2 lg:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg lg:shadow-xl rounded-lg lg:rounded-3xl lg:col-span-3">
          <div className="text-center lg:space-y-4">
            <div className="hidden lg:flex w-16 h-16 bg-blue-500 rounded-2xl mx-auto items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-lg sm:text-xl lg:text-3xl font-bold text-blue-700">{reservationStats.totalGuests}</div>
              <div className="text-blue-600 font-semibold text-[10px] sm:text-xs lg:text-lg">Comensales</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}