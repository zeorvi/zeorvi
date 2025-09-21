'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OpenAIChat from '@/components/ai/OpenAIChat';
import ReservationCalendar from './ReservationCalendar';
import TablePlan from './TablePlan';
import { Sun, Moon } from 'lucide-react';

interface PremiumRestaurantDashboardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
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

export default function PremiumRestaurantDashboard({ 
  restaurantId, 
  restaurantName, 
  restaurantType 
}: PremiumRestaurantDashboardProps) {
  const [activeSection, setActiveSection] = useState('agenda');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Datos realistas para Restaurante El Buen Sabor - Familiar
    const mockReservations: Reservation[] = [
      {
        id: 'res_001',
        time: '12:30',
        clientName: 'Ana Ruiz',
        partySize: 5,
        table: 'M12',
        status: 'confirmed',
        notes: 'Comida familiar dominical - Mesa grande cerca de ventana',
        phone: '+34612345678'
      },
      {
        id: 'res_002',
        time: '13:15',
        clientName: 'Jose Lopez',
        partySize: 2,
        table: 'M5',
        status: 'confirmed',
        notes: 'Aniversario de bodas - Mesa romántica, vino recomendado',
        phone: '+34623456789'
      },
      {
        id: 'res_003',
        time: '14:00',
        clientName: 'Maria Garcia',
        partySize: 8,
        table: 'M15',
        status: 'pending',
        notes: 'Comida de negocios - Necesitan privacidad y WiFi',
        phone: '+34634567890'
      },
      {
        id: 'res_004',
        time: '15:30',
        clientName: 'Luis Martinez',
        partySize: 6,
        table: 'M8',
        status: 'confirmed',
        notes: 'Cumpleaños de la abuela (85 años) - Pastel especial solicitado',
        phone: '+34645678901'
      },
      {
        id: 'res_005',
        time: '19:00',
        clientName: 'Carmen Perez',
        partySize: 4,
        table: 'M3',
        status: 'pending',
        notes: 'Graduación - Presupuesto limitado, menú económico',
        phone: '+34656789012'
      },
      {
        id: 'res_006',
        time: '20:30',
        clientName: 'Juan Gomez',
        partySize: 2,
        table: 'M1',
        status: 'confirmed',
        notes: 'Propuesta de matrimonio - Mesa íntima, velas, música suave',
        phone: '+34667890123'
      },
      {
        id: 'res_007',
        time: '21:15',
        clientName: 'Laura Sanchez',
        partySize: 7,
        table: 'M14',
        status: 'pending',
        notes: 'Reunión familiar - Incluye bebé en silla alta',
        phone: '+34678901234'
      }
    ];

    setReservations(mockReservations);
    setLoading(false);
  }, [restaurantId]);


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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-8 bg-slate-200 rounded-2xl w-64 mx-auto animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded-xl w-48 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Header Compacto - FIJO */}
      <div className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-slate-200/50'
      }`}>
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                  <div className="h-5 w-5 md:h-6 md:w-6 bg-white rounded-md md:rounded-lg flex items-center justify-center">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-sm"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 md:h-3 md:w-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className={`text-lg md:text-xl font-bold tracking-tight transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>{restaurantName}</h1>
                <p className={`text-xs md:text-sm font-medium capitalize transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-slate-500'
                }`}>{restaurantType}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className={`text-xs font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-slate-600'
                    }`}>Sistema Activo</span>
                  </div>
                  <div className={`w-0.5 h-3 rounded-full transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-slate-300'
                  }`}></div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className={`text-xs font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-slate-600'
                    }`}>IA Conectada</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botón de modo oscuro/claro y Stats en tiempo real */}
            <div className="flex items-center space-x-4">
              {/* Botón de modo oscuro/claro */}
              <Button
                onClick={() => setIsDarkMode(!isDarkMode)}
                variant="outline"
                size="sm"
                className={`h-8 w-8 md:h-9 md:w-9 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Moon className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              </Button>
              
              {/* Stats en tiempo real de El Buen Sabor */}
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16 md:pt-20">
        {/* Sidebar Limpio - FIJO */}
        <div className={`fixed left-0 top-16 md:top-20 bottom-0 w-56 md:w-64 backdrop-blur-2xl shadow-2xl border-r z-40 overflow-y-auto transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/40 border-gray-700/30' 
            : 'bg-white/40 border-white/30'
        }`}>
          <div className="p-4 md:p-6">
            <nav className="space-y-2">
              {[
                { id: 'agenda', label: 'Agenda del Día', color: 'blue' },
                { id: 'reservations', label: 'Gestión de Reservas', color: 'violet' },
                { id: 'tables', label: 'Control de Mesas', color: 'orange' },
                { id: 'clients', label: 'Base de Clientes', color: 'red' },
                { id: 'staff', label: 'Gestión de Personal', color: 'blue' },
                { id: 'ai_chat', label: 'Chat con IA', color: 'purple' },
                { id: 'settings', label: 'Configuración', color: 'slate' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 ${
                  activeSection === item.id
                    ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg transform scale-105`
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white hover:shadow-md'
                      : 'text-slate-700 hover:bg-slate-100/60 hover:text-slate-900 hover:shadow-md'
                }`}
                >
                  <span className={`tracking-wide ${activeSection === item.id ? 'font-bold' : ''}`}>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 max-w-none ml-56 md:ml-64 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {activeSection === 'agenda' && (
            <div className="p-4 md:p-6 space-y-6 md:space-y-8">


              {/* Reservas del día */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reservas de Hoy</h2>
                  <Button className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg text-sm">
                    Nueva Reserva
                  </Button>
                </div>
                
                {reservations.length === 0 ? (
                  <Card className="p-12 text-center bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center">
                        <div className="w-10 h-10 bg-slate-300 rounded-xl"></div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No hay reservas programadas</h3>
                        <p className="text-slate-600 text-lg">El día está libre para reservas walk-in</p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {reservations.map((reservation) => (
                      <Card key={reservation.id} className={`p-3 md:p-4 backdrop-blur-sm border-0 shadow-lg rounded-lg md:rounded-xl hover:shadow-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Hora más pequeña */}
                            <div className="text-center">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md md:rounded-lg flex items-center justify-center shadow-md">
                                <span className={`text-sm font-bold transition-colors duration-300 ${
                                  isDarkMode ? 'text-black' : 'text-slate-700'
                                }`}>{reservation.time}</span>
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
                              <h3 className={`text-base md:text-lg font-bold transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}>{reservation.clientName}</h3>
                              <div className="flex items-center space-x-3 text-xs">
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-slate-600'
                                }`}>{reservation.partySize} personas</span>
                                <span className={`transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-500' : 'text-slate-400'
                                }`}>•</span>
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                }`}>{reservation.phone}</span>
                              </div>
                              {reservation.notes && (
                                <p className={`italic text-xs max-w-md transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                }`}>{reservation.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Status y Acciones más compactas */}
                          <div className="flex items-center space-x-3">
                            <Badge className={`px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(reservation.status)}`}>
                              {getStatusText(reservation.status)}
                            </Badge>
                            
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
            </div>
          )}

          {/* Vista de Agenda completa */}

          {/* Otras secciones */}
          {activeSection === 'reservations' && (
            <ReservationCalendar restaurantId={restaurantId} isDarkMode={isDarkMode} />
          )}

          {activeSection === 'tables' && (
            <TablePlan restaurantId={restaurantId} isDarkMode={isDarkMode} />
          )}

          {activeSection === 'clients' && (
            <div className="p-6 space-y-8">

              {/* Clientes VIP */}
              <Card className={`p-4 border-0 shadow-xl rounded-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/20' 
                  : 'bg-gradient-to-br from-gold-50 to-yellow-50'
              }`}>
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-900'
                }`}>⭐ Clientes VIP</h3>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-xl shadow-md transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                        <div className="w-5 h-5 bg-white rounded-lg"></div>
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-yellow-300' : 'text-yellow-900'
                        }`}>Ana Ruiz</h4>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                        }`}>Cliente Gold • 18 visitas</p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-yellow-500' : 'text-yellow-600'
                        }`}>Vienen todos los domingos • Mesa preferida: M12</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Oro</Badge>
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-xl shadow-md transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                        <div className="w-5 h-5 bg-white rounded-lg"></div>
                      </div>
                      <div>
                        <h4 className={`font-bold transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>Jose Lopez</h4>
                        <p className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Cliente Silver • 8 visitas</p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Celebran fechas especiales • Mesa preferida: M5</p>
                      </div>
                    </div>
                    <Badge className="bg-gray-100 text-gray-800">Plata</Badge>
                  </div>
                </div>
              </Card>

            </div>
          )}


          {activeSection === 'staff' && (
            <div className="p-6 space-y-8">

              {/* Personal en turno */}
              <Card className={`p-6 border-0 shadow-xl rounded-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50'
              }`}>
                <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-900'
                }`}>👥 Personal en Turno (6 de 8)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`flex items-center space-x-3 p-4 rounded-xl shadow-md transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white'
                  }`}>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>María Elena Vásquez</span>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>Gerente • 11:00-21:00</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 rounded-xl shadow-md transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white'
                  }`}>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>José Luis Hernández</span>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>Chef Principal • 10:00-20:00</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 rounded-xl shadow-md transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white'
                  }`}>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Ana Sofía Morales</span>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>Mesera • 11:30-21:30</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 rounded-xl shadow-md transition-all duration-300 ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-white'
                  }`}>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div>
                      <span className={`font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Roberto García</span>
                      <p className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>Mesero • 11:30-21:30</p>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          )}

          {activeSection === 'ai_chat' && (
            <div className="w-full max-w-full">
            <OpenAIChat 
              restaurantId={restaurantId}
              restaurantName={restaurantName}
              restaurantType={restaurantType}
              currentUserName="Gerente"
              isDarkMode={isDarkMode}
            />
            </div>
          )}


          {activeSection === 'settings' && (
            <div className="p-6 space-y-8">

              {/* Información básica */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl rounded-2xl">
                <h3 className="text-xl font-bold text-blue-900 mb-6">🏪 Información del Restaurante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Nombre</label>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">Restaurante El Buen Sabor</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Tipo</label>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">Restaurante Familiar</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Teléfono</label>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">+52-55-5555-0100</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Dirección</label>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">Av. Insurgentes Sur 1234, Col. Del Valle, CDMX</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Email</label>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">contacto@elbuensabor.mx</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Sitio Web</label>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">www.elbuensabor.mx</div>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
