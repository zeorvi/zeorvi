'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface DailyAgendaProps {
  restaurantId: string;
  restaurantTables?: Array<{
    id: string;
    name: string;
    capacity: number;
    location: string;
  }>;
}

interface Reservation {
  id: string;
  time: string;
  clientName: string;
  partySize: number;
  table: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  phone?: string;
}

export default function DailyAgenda({ restaurantId, restaurantTables }: DailyAgendaProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(new Date());
  
  // 🔥 NOTIFICACIONES EN TIEMPO REAL (comentado temporalmente)
  // const { notifications: _notifications, isConnected: _isConnected, lastUpdate: _lastUpdate } = useRealtimeNotifications(restaurantId);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        
        // Obtener reservas desde Google Sheets
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&restaurantName=${encodeURIComponent('Restaurante')}&fecha=${today}&spreadsheetId=${restaurantId}_spreadsheet`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Convertir formato de Google Sheets al formato del dashboard
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
              status: (reserva.Estado || reserva.estado || '').toLowerCase() === 'confirmada' ? 'confirmed' : 
                     (reserva.Estado || reserva.estado || '').toLowerCase() === 'pendiente' ? 'pending' : 'cancelled',
              notes: reserva.Notas || reserva.notas || '',
              phone: reserva.Telefono || reserva.telefono || ''
            }));
            
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
    };

    loadReservations();
    
    // Recargar cada 10 segundos para mantener sincronización en tiempo real
    const interval = setInterval(loadReservations, 10000);
    
    return () => clearInterval(interval);
  }, [restaurantId, restaurantTables]);

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return `${days[date.getDay()]}, ${date.getDate()} De ${months[date.getMonth()]} De ${date.getFullYear()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

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
              Agenda De {formatDate(selectedDate)}
            </h1>
            <p className="text-xl text-slate-600 font-medium">
              {reservations.length} reservas programadas para hoy
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Button 
              variant="outline" 
              className="px-6 py-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold"
            >
              Actualizar
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
                  
                  {/* Status y Acciones más compactas */}
                  <div className="flex items-center space-x-3">
                    <span
                      className={
                        reservation.status === "confirmed"
                          ? "text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold"
                          : reservation.status === "pending"
                          ? "text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-semibold"
                          : "text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold"
                      }
                    >
                      {reservation.status === "confirmed" ? "Confirmada" : 
                       reservation.status === "pending" ? "Pendiente" : "Cancelada"}
                    </span>
                    
                    <div className="flex space-x-2">
                      {reservation.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-semibold text-xs"
                          >
                            Confirmar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="px-3 py-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-md font-semibold text-xs"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
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
              <div className="text-3xl font-bold text-emerald-700">{reservations.filter(r => r.status === 'confirmed').length}</div>
              <div className="text-emerald-600 font-semibold text-lg">Confirmadas</div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-xl rounded-3xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700">{reservations.filter(r => r.status === 'pending').length}</div>
              <div className="text-amber-600 font-semibold text-lg">Pendientes</div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl rounded-3xl">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-700">{reservations.reduce((sum, r) => sum + r.partySize, 0)}</div>
              <div className="text-blue-600 font-semibold text-lg">Comensales</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}