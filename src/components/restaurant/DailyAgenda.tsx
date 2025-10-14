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
          console.log('📊 Datos de reservas desde Google Sheets:', data.reservas);
          const formattedReservations = data.reservas.map((reserva: {
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
          }) => ({
            id: reserva.ID || reserva.id || `res_${Date.now()}_${Math.random()}`,
            time: reserva.Hora || reserva.hora || '',
            clientName: reserva.Cliente || reserva.cliente || 'Sin nombre',
            partySize: reserva.Personas || reserva.personas || 1,
            table: reserva.Mesa || reserva.mesa || 'Por asignar',
            status: (() => {
              const estado = (reserva.Estado || reserva.estado || '').toLowerCase().trim();
              
              // Mapear todos los posibles estados
              switch (estado) {
                case 'ocupada':
                  return 'occupied';
                case 'completada':
                  return 'completed';
                case 'cancelada':
                  return 'cancelled';
                case 'confirmada':
                  return 'reserved';
                case 'reservada':
                  return 'reserved';
                case '':
                case 'pendiente':
                  return 'reserved'; // Por defecto siempre reservada
                default:
                  return 'reserved';
              }
            })(),
            notes: reserva.Notas || reserva.notas || '',
            phone: reserva.Telefono || reserva.telefono || ''
          }));
          
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
      <div className="p-12">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded-2xl w-2/3"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header Elegante */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Agenda De {formattedDate}
            </h1>
            <p className="text-xl text-slate-600 font-medium">
              {reservations.length} reservas programadas para hoy
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Button 
              variant="outline" 
              onClick={loadReservations}
              disabled={loading}
              className="px-6 py-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold disabled:opacity-50"
            >
              {loading ? 'Cargando...' : '🔄 Actualizar'}
            </Button>
            <Button className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg">
              Nueva Reserva
            </Button>
          </div>
        </div>
      </div>

      {/* Reservas del Día */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Reservas de Hoy</h2>
        
        {reservations.length === 0 ? (
          <Card className="p-16 text-center bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
                <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No hay reservas programadas</h3>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="p-4 bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Hora más pequeña */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-sm font-bold text-slate-700">{reservation.time}</span>
                      </div>
                    </div>
                    
                    {/* Mesa más pequeña */}
                    <div className="text-center">
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md shadow-md">
                        <span className="text-white font-bold text-xs">Mesa {reservation.table}</span>
                      </div>
                    </div>
                    
                    {/* Información del Cliente más compacta */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{reservation.clientName}</h3>
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-slate-600 font-medium">{reservation.partySize} personas</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-medium">{reservation.phone || "No disponible"}</span>
                      </div>
                      {reservation.notes && (
                        <p className="text-slate-500 italic text-xs max-w-md">{reservation.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status y Acciones */}
                  <div className="flex items-center space-x-3">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value as Reservation['status'])}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-2 cursor-pointer transition-colors ${
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
                    
                    <div className="flex space-x-2">
                      {/* Botones de acción removidos - ahora se usa el selector */}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resumen del Día */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl rounded-3xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-700">{reservationStats.reserved}</div>
              <div className="text-orange-600 font-semibold text-lg">Reservadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-xl rounded-3xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-700">{reservationStats.occupied}</div>
              <div className="text-red-600 font-semibold text-lg">Ocupadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-emerald-50 to-green-50 border-0 shadow-xl rounded-3xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-700">{reservationStats.completed}</div>
              <div className="text-emerald-600 font-semibold text-lg">Completadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl rounded-3xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-700">{reservationStats.totalGuests}</div>
              <div className="text-blue-600 font-semibold text-lg">Comensales</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}