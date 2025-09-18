'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Plus,
  RefreshCw,
  User,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { getReservationsByDate, Reservation, getClientById, Client } from '@/lib/restaurantData';
import { useOccupiedTables } from '@/lib/services/occupiedTablesService';
import { useTurnSystem } from '@/lib/services/turnSystem';

interface DailyAgendaProps {
  restaurantId: string;
}

export default function DailyAgenda({ restaurantId }: DailyAgendaProps) {
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Reservation | null>(null);
  const [showNewReservationForm, setShowNewReservationForm] = useState(false);
  
  // Hook para mesas ocupadas
  const { moveToOccupied } = useOccupiedTables();
  
  // Hook para sistema de turnos
  const { getAllAvailableTimes } = useTurnSystem();

  const loadTodayReservations = useCallback(() => {
    setIsLoading(true);
    try {
      const today = new Date();
      const reservations = getReservationsByDate(today);
      setTodayReservations(reservations);
      console.log(`Cargadas ${reservations.length} reservas para hoy - restaurante ${restaurantId}`);
    } catch (error) {
      console.error(`Error al cargar reservas de hoy para restaurante ${restaurantId}:`, error);
      toast.error('Error al cargar las reservas de hoy');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadTodayReservations();
    const interval = setInterval(loadTodayReservations, 10000); // Actualizar cada 10 segundos
    
    // Escuchar eventos de mesas liberadas automáticamente
    const handleMesaLiberada = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { mesaId, cliente, tiempoOcupada } = customEvent.detail;
      
      toast.success(`🧹 Mesa ${mesaId} liberada automáticamente`);
      toast.info(`${cliente} terminó su comida (${Math.floor(tiempoOcupada / 60)}h ${tiempoOcupada % 60}m) - Mesa disponible para nuevas reservas`);
      
      // Recargar reservas para reflejar el cambio
      loadTodayReservations();
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
  }, [loadTodayReservations]);

  const getClientData = (clientId: string): Client | null => {
    return getClientById(clientId);
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
      case 'confirmada': return 'Confirmada';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      case 'pendiente': return 'Pendiente';
      default: return 'Confirmada'; // Por defecto confirmada
    }
  };

  const changeReservationStatus = (reservationId: string, newStatus: Reservation['status']) => {
    setTodayReservations(prev => 
      prev.map(res => 
        res.id === reservationId 
          ? { ...res, status: newStatus }
          : res
      )
    );

    // Mensajes específicos para cada estado
    switch (newStatus) {
      case 'pendiente':
        toast.info('🟡 Reserva marcada como PENDIENTE');
        toast('Esperando la llegada del cliente');
        break;
      case 'confirmada':
        toast.success('🟢 Reserva CONFIRMADA');
        toast.success('Cliente ha llegado y está en su mesa');
        break;
      case 'cancelada':
        toast.error('🔴 Reserva CANCELADA');
        toast.info('Mesa liberada y disponible para otros clientes');
        break;
      case 'completada':
        toast.success('🔵 Reserva COMPLETADA');
        toast.info('Mesa liberada y disponible');
        break;
    }
  };

  const showClientInfo = (reservation: Reservation) => {
    setSelectedClient(reservation);
    const client = getClientData(reservation.clientId);
    toast.success(`👤 Información de ${client?.name || 'Cliente'}`);
  };

  const handleMoveToOccupied = (reservation: Reservation) => {
    const client = getClientData(reservation.clientId);
    if (client) {
      // Mover a mesas ocupadas
      moveToOccupied(reservation, client);
      
      // Remover de la agenda diaria
      setTodayReservations(prev => prev.filter(res => res.id !== reservation.id));
      
      // Mostrar confirmación
      toast.success('🧹 Mesa limpiada y marcada como ocupada');
      toast.info(`Mesa ${reservation.tableId} se liberará automáticamente en ${reservation.duration} minutos`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Cargando agenda del día...</span>
      </div>
    );
  }

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
            Agenda de {todayFormatted}
          </h1>
          <p className="text-gray-600 mt-1 text-base md:text-lg">
            {todayReservations.length} {todayReservations.length === 1 ? 'reserva programada' : 'reservas programadas'} para hoy
          </p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => loadTodayReservations()}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-base font-medium flex items-center transition-colors shadow-sm flex-1 md:flex-none"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Actualizar
          </button>
          <button 
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg text-base font-medium flex items-center transition-colors shadow-sm flex-1 md:flex-none"
            onClick={() => {
              setShowNewReservationForm(true);
              toast.success('📝 Abriendo formulario de nueva reserva');
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Reserva
          </button>
        </div>
      </div>

      {/* Reservas del día - Estilo página principal */}
      {todayReservations.length === 0 ? (
        <Card className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
          <CardContent>
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No hay reservas para hoy
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando la primera reserva del día
            </p>
            <button
              onClick={() => setShowNewReservationForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto transition-colors shadow-md"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Reserva
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-gray-200 shadow-2xl">
          <CardContent className="p-4">
            <h3 className="text-gray-900 font-semibold mb-4 text-lg">Reservas de Hoy</h3>
            <div className="space-y-3">
              {todayReservations
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((reservation) => {
                  const client = getClientData(reservation.clientId);
                  
                  return (
                    <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
                      <div className="flex-1">
                        <div className="mb-2">
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold inline-block mb-2">
                            Mesa {reservation.tableId}
                          </div>
                          <div className="text-gray-900 font-semibold text-lg">{reservation.time}</div>
                        </div>
                        <div className="text-gray-600 text-sm">
                          {client?.name || 'Cliente sin nombre'} • {reservation.people} personas
                        </div>
                        {reservation.notes && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {reservation.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Botones de acción - 3 estados */}
                        <div className="flex space-x-1">
                          {/* Botón Pendiente */}
                          <button
                            onClick={() => {
                              changeReservationStatus(reservation.id, 'pendiente');
                              toast.info('Reserva marcada como pendiente');
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              reservation.status === 'pendiente' 
                                ? 'bg-yellow-500 text-white border border-yellow-600' 
                                : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                            }`}
                          >
                            Pendiente
                          </button>
                          
                          {/* Botón Confirmar */}
                          <button
                            onClick={() => {
                              changeReservationStatus(reservation.id, 'confirmada');
                              toast.success('Reserva confirmada - Cliente llegó');
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              reservation.status === 'confirmada' 
                                ? 'bg-green-500 text-white border border-green-600' 
                                : 'bg-green-100 hover:bg-green-200 text-green-700'
                            }`}
                          >
                            Confirmar
                          </button>
                          
                          {/* Botón Cancelar */}
                          <button
                            onClick={() => {
                              changeReservationStatus(reservation.id, 'cancelada');
                              toast.error('Reserva cancelada');
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              reservation.status === 'cancelada' 
                                ? 'bg-red-500 text-white border border-red-600' 
                                : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                          >
                            Cancelar
                          </button>
                          
                          {/* Botón Ver */}
                          <button
                            onClick={() => showClientInfo(reservation)}
                            className="px-2 py-1 rounded text-xs font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                          >
                            Ver
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Información del Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Cliente</CardTitle>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
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

      {/* Modal de Nueva Reserva */}
      {showNewReservationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Reserva para Hoy</CardTitle>
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
                
                // Procesar necesidades especiales
                const specialNeedsArray = formData.getAll('specialNeeds') as string[];
                const specialNeedsText = specialNeedsArray.length > 0 
                  ? specialNeedsArray.map(need => {
                      switch(need) {
                        case 'celiac': return '🌾 Celíaco';
                        case 'vegetarian': return '🥗 Vegetariano';
                        case 'wheelchair': return '♿ Silla ruedas';
                        case 'baby_chair': return '👶 Silla bebé';
                        case 'birthday': return '🎂 Cumpleaños';
                        case 'anniversary': return '💕 Aniversario';
                        default: return need;
                      }
                    }).join(', ')
                  : '';
                
                const newReservation = {
                  clientName: formData.get('clientName') as string,
                  clientPhone: formData.get('clientPhone') as string,
                  time: formData.get('time') as string,
                  people: parseInt(formData.get('people') as string),
                  notes: formData.get('notes') as string,
                  specialNeeds: specialNeedsText
                };
                
                toast.success(`✅ Reserva creada para ${newReservation.clientName}`);
                if (specialNeedsText) {
                  toast.info(`Necesidades especiales: ${specialNeedsText}`);
                }
                toast.info(`${newReservation.people} personas - Hoy ${newReservation.time}`);
                setShowNewReservationForm(false);
                loadTodayReservations(); // Recargar reservas
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
                      Hora *
                    </label>
                    <select
                      name="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Seleccionar turno</option>
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personas *
                    </label>
                    <select
                      name="people"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Seleccionar</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'persona' : 'personas'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Necesidades especiales
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="specialNeeds" value="celiac" className="rounded" />
                      <span className="text-sm">🌾 Celíaco</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="specialNeeds" value="vegetarian" className="rounded" />
                      <span className="text-sm">🥗 Vegetariano</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="specialNeeds" value="wheelchair" className="rounded" />
                      <span className="text-sm">♿ Silla ruedas</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="specialNeeds" value="baby_chair" className="rounded" />
                      <span className="text-sm">👶 Silla bebé</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="specialNeeds" value="birthday" className="rounded" />
                      <span className="text-sm">🎂 Cumpleaños</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="specialNeeds" value="anniversary" className="rounded" />
                      <span className="text-sm">💕 Aniversario</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas adicionales
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Otras alergias, comentarios especiales..."
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
