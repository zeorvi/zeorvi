'use client';

import { useState, useEffect, useCallback, Suspense, lazy, memo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import AuthErrorHandler from '@/components/auth/AuthErrorHandler';
// import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, RefreshCw, LogOut, Menu, X } from 'lucide-react';
import { ReservationLoading, TableLoading, AILoading } from '@/components/ui/optimized-loading';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Lazy loading de componentes pesados
const OpenAIChat = lazy(() => import('@/components/ai/OpenAIChat'));
const ReservationCalendar = lazy(() => import('./ReservationCalendar'));
const TablePlan = lazy(() => import('./ProductionTablePlan'));
const UserCredentialsCard = lazy(() => import('./UserCredentialsCard'));
const MobileNavigation = lazy(() => import('@/components/ui/MobileNavigation'));

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

// Memoizar el componente principal para evitar re-renders innecesarios
const PremiumRestaurantDashboard = memo(function PremiumRestaurantDashboard({ 
  restaurantId, 
  restaurantName, 
  restaurantType 
}: PremiumRestaurantDashboardProps) {
  const [activeSection, setActiveSection] = useState('agenda');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Hooks para autenticación y datos del restaurante
  const { logout } = useClientAuth();
  const router = useRouter();
  const { 
    restaurant: restaurantData, 
    loading, 
    error: restaurantError, 
    refreshData 
  } = useRestaurantData(restaurantId);
  
  // Hook para gestión global de mesas - temporalmente deshabilitado
  // const { 
  //   updateTableStatus
  // } = useRestaurantTables(restaurantId);

  // Función placeholder para updateTableStatus
  const updateTableStatus = (tableId: string, status: string, data?: Record<string, unknown>) => {
    console.log('🔄 Updating table status:', { tableId, status, data });
    // TODO: Implementar actualización real de estado de mesa
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  // Función para cargar reservas desde Google Sheets
  const loadReservationsFromGoogleSheets = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(restaurantData?.name || restaurantName)}&fecha=${today}&spreadsheetId=${restaurantId}_spreadsheet`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convertir formato de Google Sheets al formato del dashboard
          const formattedReservations = data.reservas.map((reserva: Record<string, unknown>) => ({
            id: (reserva.id as string) || `res_${Date.now()}_${Math.random()}`,
            time: reserva.hora as string,
            clientName: reserva.cliente as string,
            partySize: reserva.personas as number,
            table: (reserva.mesa as string) || 'Por asignar',
            status: reserva.estado === 'confirmada' ? 'confirmed' : 
                   reserva.estado === 'pendiente' ? 'pending' : 'cancelled',
            notes: (reserva.notas as string) || '',
            phone: (reserva.telefono as string) || ''
          }));
          
          setReservations(formattedReservations);
          console.log('📅 PremiumDashboard: Reservas cargadas desde Google Sheets:', formattedReservations);
        } else {
          console.error('Error cargando reservas:', data.error);
          setReservations([]);
        }
      } else {
        console.error('Error en la respuesta de la API');
        setReservations([]);
      }
    } catch (error) {
      console.error('Error cargando reservas desde Google Sheets:', error);
      setReservations([]);
    }
  }, [restaurantId, restaurantData?.name, restaurantName]);

  useEffect(() => {
    // Cargar reservas cuando los datos del restaurante estén disponibles
    if (restaurantData && !loading) {
      loadReservationsFromGoogleSheets();
    }
  }, [restaurantData, loading, loadReservationsFromGoogleSheets]);




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

  // Mostrar error si hay problemas con la autenticación o carga de datos
  if (restaurantError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AuthErrorHandler 
            error={restaurantError}
            onRetry={refreshData}
            onLogin={() => router.push('/login')}
            showLoginButton={true}
          />
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
      {/* Header Responsive - FIJO */}
      <div className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-slate-200/50'
      }`}>
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Lado izquierdo - Logo y título */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Botón de menú móvil */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="outline"
                size="sm"
                className={`h-8 w-8 sm:h-9 sm:w-9 md:hidden transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              
              <div className="relative">
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                  <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 bg-white rounded-md md:rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-sm"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              
              <div className="min-w-0 flex-1">
                <h1 className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-tight transition-colors duration-300 truncate ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>{restaurantData?.name || restaurantName}</h1>
                
                <div className="hidden sm:block">
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
            </div>
            
            {/* Lado derecho - Botones de acción */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {/* Botón de actualización */}
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
                title="Actualizar datos"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Botón de modo oscuro/claro */}
              <Button
                onClick={() => setIsDarkMode(!isDarkMode)}
                variant="outline"
                size="sm"
                className={`h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </Button>
              
              {/* Botón de cerrar sesión */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className={`h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-red-800 border-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                }`}
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay móvil para cerrar menú */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex pt-12 sm:pt-14 md:pt-16 lg:pt-20">
        {/* Sidebar Responsive */}
        <div className={`fixed left-0 top-12 sm:top-14 md:top-16 lg:top-20 bottom-0 backdrop-blur-2xl shadow-2xl border-r z-40 overflow-y-auto transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/40 border-gray-700/30' 
            : 'bg-white/40 border-white/30'
        } ${
          // En móvil: mostrar solo si está abierto
          isMobileMenuOpen ? 'w-64' : 'w-0 md:w-56 lg:w-64'
        } ${
          // En desktop: siempre visible
          'md:translate-x-0'
        } ${
          // En móvil: slide in/out
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-3 sm:p-4 md:p-6">
            <nav className="space-y-1 sm:space-y-2">
              {[
                { id: 'agenda', label: 'Agenda del Día', color: 'blue' },
                { id: 'reservations', label: 'Gestión de Reservas', color: 'violet' },
                { id: 'tables', label: 'Control de Mesas', color: 'orange' },
                { id: 'clients', label: 'Base de Clientes', color: 'red' },
                { id: 'ai_chat', label: 'Chat con IA', color: 'purple' },
                { id: 'settings', label: 'Configuración', color: 'slate' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    // Cerrar menú móvil al seleccionar
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
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

        {/* Main Content Responsive */}
        <div className={`flex-1 max-w-none transition-all duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        } ${
          // En móvil: sin margen izquierdo
          // En desktop: margen para el sidebar
          'md:ml-56 lg:ml-64'
        }`}>
          {activeSection === 'agenda' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Reservas del día */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <h2 className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>Reservas de Hoy</h2>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className={`text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-slate-500'
                      }`}>Sincronización en tiempo real</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      onClick={loadReservationsFromGoogleSheets}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold shadow-lg text-xs sm:text-sm"
                    >
                      🔄 Actualizar
                    </Button>
                    <Button className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg text-xs sm:text-sm">
                      Nueva Reserva
                    </Button>
                  </div>
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
                ) : reservations.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {reservations.map((reservation) => (
                      <Card key={reservation.id} className={`p-3 sm:p-4 backdrop-blur-sm border-0 shadow-lg rounded-lg sm:rounded-xl hover:shadow-xl transition-all duration-300 ${
                        isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
                      }`}>
                        {/* Layout responsive: vertical en móvil, horizontal en desktop */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          {/* Información principal */}
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
                            {/* Hora */}
                            <div className="flex items-center space-x-2 sm:space-x-0 sm:flex-col sm:text-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md md:rounded-lg flex items-center justify-center shadow-md">
                                <span className={`text-xs sm:text-sm font-bold transition-colors duration-300 ${
                                  isDarkMode ? 'text-black' : 'text-slate-700'
                                }`}>{reservation.time}</span>
                              </div>
                              <span className="text-xs sm:hidden font-medium text-slate-600">Hora</span>
                            </div>
                            
                            {/* Mesa */}
                            <div className="flex items-center space-x-2 sm:space-x-0 sm:flex-col sm:text-center">
                              <div className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md shadow-md">
                                <span className="text-white font-bold text-xs">Mesa {reservation.table}</span>
                              </div>
                              <span className="text-xs sm:hidden font-medium text-slate-600">Mesa</span>
                            </div>
                            
                            {/* Información del Cliente */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm sm:text-base md:text-lg font-bold transition-colors duration-300 truncate ${
                                isDarkMode ? 'text-white' : 'text-slate-900'
                              }`}>{reservation.clientName}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs">
                                <span className={`font-medium transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-300' : 'text-slate-600'
                                }`}>{reservation.partySize} personas</span>
                                <span className={`hidden sm:inline transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-500' : 'text-slate-400'
                                }`}>•</span>
                                <span className={`font-medium transition-colors duration-300 truncate ${
                                  isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                }`}>{reservation.phone}</span>
                              </div>
                              {reservation.notes && (
                                <p className={`italic text-xs mt-1 transition-colors duration-300 ${
                                  isDarkMode ? 'text-gray-400' : 'text-slate-500'
                                }`}>{reservation.notes}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Status y Acciones */}
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <Badge className={`px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(reservation.status)} self-start sm:self-center`}>
                              {getStatusText(reservation.status)}
                            </Badge>
                            
                            {reservation.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => updateTableStatus(reservation.table, 'ocupada', {
                                    name: reservation.clientName,
                                    phone: reservation.phone || '',
                                    partySize: reservation.partySize,
                                    notes: reservation.notes || ''
                                  })}
                                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold text-xs"
                                >
                                  Ocupar Mesa
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateTableStatus(reservation.table, 'libre')}
                                  variant="outline"
                                  className="px-3 py-1 border border-green-200 text-green-600 hover:bg-green-50 rounded-md font-semibold text-xs"
                                >
                                  Liberar Mesa
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className={`text-gray-400 mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      📅 Sin reservas para hoy
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                      Las reservas aparecerán aquí cuando los clientes llamen a {restaurantData?.name || restaurantName}
                    </p>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-700' : 'text-gray-400'}`}>
                      🤖 Retell AI se encarga automáticamente de gestionar las reservas
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vista de Agenda completa */}

          {/* Otras secciones con Suspense para lazy loading */}
          {activeSection === 'reservations' && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <ReservationLoading />
              </div>
            }>
              <ReservationCalendar 
                key={`reservations-${restaurantId}-${restaurantData?.name}`}
                restaurantId={restaurantId} 
                isDarkMode={isDarkMode} 
                restaurantTables={[]}
              />
            </Suspense>
          )}

          {activeSection === 'tables' && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <TableLoading />
              </div>
            }>
              <TablePlan 
                key={`tables-${restaurantId}-${restaurantData?.name}`}
                restaurantId={restaurantId} 
                isDarkMode={isDarkMode} 
              />
            </Suspense>
          )}

          {activeSection === 'clients' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Clientes VIP */}
              <Card className={`p-3 sm:p-4 border-0 shadow-xl rounded-xl sm:rounded-2xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/20' 
                  : 'bg-gradient-to-br from-gold-50 to-yellow-50'
              }`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-900'
                }`}>⭐ Base de Clientes</h3>
                <div className="text-center py-6 sm:py-8">
                  <div className={`text-gray-400 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    👥 Sistema de clientes en desarrollo
                  </div>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                    Los datos de clientes se irán acumulando con el uso del sistema de {restaurantData?.name || restaurantName}
                  </p>
                </div>
              </Card>
            </div>
          )}




          {activeSection === 'ai_chat' && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <AILoading />
              </div>
            }>
              <div className="w-full max-w-full">
                <OpenAIChat 
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                  restaurantType={restaurantType}
                  currentUserName="Gerente"
                  isDarkMode={isDarkMode}
                />
              </div>
            </Suspense>
          )}


          {activeSection === 'settings' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Credenciales de Acceso */}
              <Suspense fallback={
                <Card className={`p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl rounded-xl sm:rounded-2xl transition-all duration-300 ${
                  isDarkMode ? 'from-blue-900/20 to-indigo-900/20' : 'from-blue-50 to-indigo-50'
                }`}>
                  <div className="animate-pulse space-y-3 sm:space-y-4">
                    <div className="h-4 sm:h-6 bg-blue-200 rounded w-1/3"></div>
                    <div className="h-3 sm:h-4 bg-blue-200 rounded w-1/2"></div>
                    <div className="h-3 sm:h-4 bg-blue-200 rounded w-2/3"></div>
                  </div>
                </Card>
              }>
                <UserCredentialsCard 
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                />
              </Suspense>

              {/* Información básica */}
              <Card className={`p-3 sm:p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl rounded-xl sm:rounded-2xl transition-all duration-300 ${
                isDarkMode ? 'from-blue-900/20 to-indigo-900/20' : 'from-blue-50 to-indigo-50'
              }`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 md:mb-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-900'
                }`}>🏪 Información del Restaurante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Nombre</label>
                      <div className={`p-2 sm:p-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-blue-700 text-white' : 'bg-white border-blue-200'
                      }`}>{restaurantData?.name || restaurantName}</div>
                    </div>
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Tipo</label>
                      <div className={`p-2 sm:p-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-blue-700 text-white' : 'bg-white border-blue-200'
                      }`}>{restaurantType}</div>
                    </div>
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Teléfono</label>
                      <div className={`p-2 sm:p-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-blue-700 text-white' : 'bg-white border-blue-200'
                      }`}>{restaurantData?.phone || '+34 000 000 000'}</div>
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Dirección</label>
                      <div className={`p-2 sm:p-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-blue-700 text-white' : 'bg-white border-blue-200'
                      }`}>{restaurantData?.address || 'Dirección no especificada'}</div>
                    </div>
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Email</label>
                      <div className={`p-2 sm:p-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-blue-700 text-white' : 'bg-white border-blue-200'
                      }`}>{restaurantData?.owner_email || 'email@restaurante.com'}</div>
                    </div>
                    <div>
                      <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-900'
                      }`}>Sitio Web</label>
                      <div className={`p-2 sm:p-3 rounded-lg border transition-colors duration-300 ${
                        isDarkMode ? 'bg-gray-800 border-blue-700 text-white' : 'bg-white border-blue-200'
                      }`}>www.{restaurantData?.name?.toLowerCase().replace(/\s+/g, '') || 'restaurante'}.com</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Navegación móvil */}
      <Suspense fallback={null}>
        <MobileNavigation
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isDarkMode={isDarkMode}
          restaurantName={restaurantData?.name || restaurantName}
        />
      </Suspense>
    </div>
  );
});

// Exportar el componente memoizado
export default PremiumRestaurantDashboard;
