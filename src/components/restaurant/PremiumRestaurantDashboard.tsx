'use client';

import { useState, useEffect, useCallback, Suspense, lazy, memo } from 'react';
import { useRestaurantData } from '@/hooks/useRestaurantData';
import AuthErrorHandler from '@/components/auth/AuthErrorHandler';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Moon, RefreshCw, LogOut, Menu, X } from 'lucide-react';
import { ReservationLoading, TableLoading, AILoading } from '@/components/ui/optimized-loading';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Lazy loading de componentes pesados con prefetch
const ReservationCalendar = lazy(() => import('./ReservationCalendar'));
const TablePlan = lazy(() => import('./EnhancedTablePlan'));
const MobileNavigation = lazy(() => import('@/components/ui/MobileNavigation'));

// Precargar componentes más usados
if (typeof window !== 'undefined') {
  // Precargar después de 1 segundo
  setTimeout(() => {
    import('./ReservationCalendar');
    import('./EnhancedTablePlan');
  }, 1000);
}

interface PremiumRestaurantDashboardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

interface Reservation {
  id: string;
  date: string;
  time: string;
  clientName: string;
  partySize: number;
  table: string;
  status: 'confirmed' | 'occupied' | 'completed' | 'cancelled';
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
  const [restaurantStatus, setRestaurantStatus] = useState<{
    abierto: boolean;
    mensaje: string;
    horarios?: Array<{ Turno: string; Inicio: string; Fin: string }>;
  }>({ abierto: true, mensaje: 'Verificando estado...' });
  
  // Hooks para autenticación y datos del restaurante
  const { logout } = useClientAuth();
  const router = useRouter();
  const { 
    restaurant: restaurantData, 
    loading, 
    error: restaurantError, 
    refreshData 
  } = useRestaurantData(restaurantId);

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

  // Función para formatear fecha sin conversión a UTC
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para cargar reservas desde Google Sheets
  const loadReservationsFromGoogleSheets = useCallback(async () => {
    try {
      // Obtener solo reservas de HOY para la agenda del día
      const today = formatDateToLocal(new Date());
      const currentHour = new Date().getHours();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
      
      // PRIMERO: Verificar si el restaurante está abierto
      console.log('🔍 Verificando estado del restaurante:', { restaurantId, today, currentTime });
      const statusResponse = await fetch(`/api/google-sheets/horarios?restaurantId=${restaurantId}&fecha=${today}&hora=${currentTime}`);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 Respuesta de estado:', statusData);
        
        if (statusData.success) {
          setRestaurantStatus(statusData.status);
          
          // Si el restaurante está cerrado, limpiar reservas y no cargar más
          if (!statusData.status.abierto) {
            console.log('🏪 Restaurante cerrado, limpiando agenda. Estado:', statusData.status);
            setReservations([]);
            return; // Salir sin cargar reservas
          } else {
            console.log('✅ Restaurante abierto, cargando reservas');
          }
        }
      } else {
        console.error('❌ Error en la respuesta de estado del restaurante:', statusResponse.status);
      }
      
      // Solo cargar reservas si el restaurante está abierto
      const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}&fecha=${today}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convertir formato de Google Sheets al formato del dashboard
          const todayReservations = data.reservas
            .sort((a: Record<string, string>, b: Record<string, string>) => (a.Hora || '').localeCompare(b.Hora || ''))
            .map((reserva: Record<string, unknown>, index: number) => ({
              id: (reserva.ID as string) || `res_${Date.now()}_${index}`,
              date: (reserva.Fecha as string),
              time: (reserva.Hora as string),
              clientName: (reserva.Cliente as string),
              partySize: (reserva.Personas as number),
              table: (reserva.Mesa as string) || 'Por asignar',
              status: (() => {
                const estado = ((reserva.Estado as string) || '').toLowerCase().trim();
                console.log(`🔍 PremiumDashboard - Estado de reserva ${reserva.ID}: "${estado}"`);
                switch (estado) {
                  case 'ocupada': return 'occupied';
                  case 'completada': return 'completed';
                  case 'cancelada': return 'cancelled';
                  case 'confirmada': return 'confirmed';
                  case 'reservada': return 'confirmed';
                  case '':
                  case 'pendiente': return 'confirmed';
                  default: return 'confirmed';
                }
              })(),
              notes: (reserva.Notas as string) || '',
              phone: (reserva.Telefono as string) || ''
            }));

          // Eliminar duplicados por ID y asegurar keys únicas
          const uniqueReservations = todayReservations.reduce((acc: Reservation[], current: Reservation) => {
            const existing = acc.find(item => item.id === current.id);
            if (!existing) {
              acc.push({
                ...current,
                id: `${current.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              });
            }
            return acc;
          }, []);
          
          setReservations(uniqueReservations);
          console.log('📅 PremiumDashboard: Reservas de hoy cargadas desde Google Sheets:', uniqueReservations);
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
  }, [restaurantId]);

  useEffect(() => {
    // PRE-CARGAR reservas inmediatamente al montar el dashboard
    // Esto hace que los datos estén listos ANTES de que el usuario haga clic en "Agenda"
    if (restaurantData && !loading) {
      console.log('🚀 [Dashboard] Pre-cargando reservas en background...');
      loadReservationsFromGoogleSheets();
    }
  }, [restaurantData, loading, loadReservationsFromGoogleSheets]);

  // Auto-refresh DESHABILITADO - Ya no es necesario
  // La sincronización automática cada 3 min (cron job) mantiene la DB actualizada
  // y el sistema lee de DB que es instantáneo

  // Auto-refresh DESHABILITADO - El usuario controla manualmente los estados
  // useEffect(() => {
  //   if (!restaurantData || loading) return;

  //   const interval = setInterval(() => {
  //     console.log('🔄 Auto-refresh: Actualizando reservas desde Google Sheets...');
  //     loadReservationsFromGoogleSheets();
  //   }, 30000); // 30 segundos

  //   return () => clearInterval(interval);
  // }, [restaurantData, loading, loadReservationsFromGoogleSheets]);


  // Función para cambiar el estado de una reserva
  const handleReservationStatusChange = async (reservationId: string, newStatus: Reservation['status']) => {
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
      console.log('🔄 Enviando actualización a API:', { restaurantId, reservationId, newStatus, fecha: new Date().toISOString().split('T')[0] });
      
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
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        console.error('❌ Error actualizando estado de reserva:', response.status, errorData);
        
        // Mostrar error al usuario
        const errorMsg = typeof errorData === 'object' && errorData.error 
          ? errorData.error 
          : typeof errorData === 'string' 
          ? errorData 
          : 'Error desconocido';
        
        toast.error(`Error al actualizar: ${errorMsg}`);
        
        // NO revertir cambio local - mantener el estado seleccionado
        console.log('⚠️ Manteniendo cambio local aunque falle la actualización en Google Sheets');
      } else {
        const result = await response.json();
        console.log(`✅ Estado de reserva ${reservationId} actualizado a ${newStatus}:`, result);
        toast.success(`Estado actualizado a ${newStatus === 'confirmed' ? 'Reservada' : newStatus === 'occupied' ? 'Ocupada' : newStatus === 'completed' ? 'Completada' : 'Cancelada'}`);
      }
    } catch (error) {
      console.error('Error cambiando estado de reserva:', error);
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
        <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Lado izquierdo - Logo y título */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 lg:space-x-4">
              {/* Botón de menú móvil */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="outline"
                size="sm"
                className={`h-7 w-7 md:hidden p-0 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {isMobileMenuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
              </Button>
              
              <div className="relative">
                <div className="h-7 w-7 sm:h-8 sm:w-8 lg:h-12 lg:w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg">
                  <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6 bg-white rounded-md lg:rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-sm"></div>
                  </div>
                </div>
                <div className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 h-2 w-2 lg:h-3 lg:w-3 bg-green-400 rounded-full border border-white lg:border-2 animate-pulse"></div>
              </div>
              
              <div className="min-w-0 flex-1">
                <h1 className={`text-xs sm:text-sm md:text-base lg:text-xl font-bold tracking-tight truncate ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>{restaurantData?.name || restaurantName}</h1>
                
                <div className="hidden sm:block">
                  <p className={`text-[10px] sm:text-xs lg:text-sm font-medium capitalize ${
                    isDarkMode ? 'text-gray-400' : 'text-slate-500'
                  }`}>{restaurantType}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span className={`text-[10px] lg:text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-slate-600'
                      }`}>Sistema Activo</span>
                    </div>
                    <div className={`w-0.5 h-2 lg:h-3 rounded-full ${
                      isDarkMode ? 'bg-gray-600' : 'bg-slate-300'
                    }`}></div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className={`text-[10px] lg:text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-slate-600'
                      }`}>IA Conectada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lado derecho - Botones de acción */}
            <div className="flex items-center space-x-1 lg:space-x-2">
              {/* Botón de actualizar */}
              <Button
                onClick={async () => {
                  // Invalidar caché primero para forzar actualización
                  try {
                    await fetch('/api/cache/invalidate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ restaurantId, type: 'all' })
                    });
                  } catch (error) {
                    console.error('Error invalidando caché:', error);
                  }
                  
                  // Luego actualizar datos
                  refreshData();
                  loadReservationsFromGoogleSheets();
                  toast.success('Datos actualizados');
                }}
                variant="outline"
                size="sm"
                className="h-7 w-7 lg:h-9 lg:w-9 p-0 bg-blue-500 border-blue-600 text-white hover:bg-blue-600"
                title="Actualizar"
              >
                <RefreshCw className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </Button>
              
              {/* Botón de modo oscuro/claro */}
              <Button
                onClick={() => setIsDarkMode(!isDarkMode)}
                variant="outline"
                size="sm"
                className={`h-7 w-7 lg:h-9 lg:w-9 p-0 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
                title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> : <Moon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
              </Button>
              
              {/* Botón de cerrar sesión */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className={`h-7 w-7 lg:h-9 lg:w-9 p-0 ${
                  isDarkMode 
                    ? 'bg-red-800 border-red-600 text-white hover:bg-red-700' 
                    : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                }`}
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
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

      <div className="flex pt-11 sm:pt-11 md:pt-12 lg:pt-16">
        {/* Sidebar Responsive */}
        <div className={`fixed left-0 top-11 sm:top-11 md:top-12 lg:top-16 bottom-0 backdrop-blur-2xl shadow-2xl border-r z-40 overflow-y-auto transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/40 border-gray-700/30' 
            : 'bg-white/40 border-white/30'
        } ${
          // En móvil: mostrar solo si está abierto
          isMobileMenuOpen ? 'w-52 sm:w-56' : 'w-0 md:w-48 lg:w-64'
        } ${
          // En móvil: slide in/out
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="px-2 sm:px-3 lg:px-6 pb-2 sm:pb-3 lg:pb-6 pt-6 sm:pt-8 lg:pt-10">
            <nav className="space-y-1 lg:space-y-2">
              {[
                { id: 'agenda', label: 'Agenda del Día', color: 'blue' },
                { id: 'reservations', label: 'Gestión de Reservas', color: 'violet' },
                { id: 'tables', label: 'Control de Mesas', color: 'orange' },
                { id: 'clients', label: 'Base de Clientes', color: 'red' },
                { id: 'settings', label: 'Configuración', color: 'slate' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    // Cerrar menú móvil al seleccionar
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 lg:px-4 lg:py-3 rounded-lg lg:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    activeSection === item.id
                      ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-lg`
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-100/60 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Responsive */}
        <div className={`flex-1 max-w-none transition-all duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        } ${
          // Margen izquierdo para sidebar
          'md:ml-48 lg:ml-64'
        }`}>
          {activeSection === 'agenda' && (
            <div className="pt-4 sm:pt-6 md:pt-8 lg:pt-10 px-2 sm:px-3 md:px-4 lg:px-6 space-y-3 sm:space-y-4 lg:space-y-8">
              {/* Reservas del día */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <h2 className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>Agenda del Día</h2>
                    
                    {/* Indicador de estado del restaurante */}
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                      restaurantStatus.abierto 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        restaurantStatus.abierto ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span>
                        {restaurantStatus.abierto ? 'Abierto' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="hidden sm:flex px-3 py-1.5 lg:px-6 lg:py-3 rounded-lg lg:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg text-xs lg:text-sm">
                      Nueva Reserva
                    </Button>
                  </div>
                </div>
                
                {reservations.length === 0 ? (
                  <Card className={`p-12 text-center backdrop-blur-sm border-0 shadow-xl rounded-2xl ${
                    isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                  }`}>
                    <div className="space-y-6">
                      <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center ${
                        restaurantStatus.abierto ? 'bg-slate-100' : 'bg-red-100'
                      }`}>
                        <div className={`w-10 h-10 rounded-xl ${
                          restaurantStatus.abierto ? 'bg-slate-300' : 'bg-red-300'
                        }`}></div>
                      </div>
                      <div>
                        {restaurantStatus.abierto ? (
                          <>
                            <h3 className={`text-2xl font-bold mb-2 ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>No hay reservas programadas</h3>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>El restaurante está abierto pero no hay reservas para hoy</p>
                          </>
                        ) : (
                          <>
                            <h3 className={`text-2xl font-bold mb-2 ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>Restaurante Cerrado</h3>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>{restaurantStatus.mensaje}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ) : reservations.length > 0 ? (
                  <div className="space-y-2 lg:space-y-3">
                    {reservations.map((reservation) => (
                      <Card key={reservation.id} className={`p-2 sm:p-3 lg:p-4 backdrop-blur-sm border-0 shadow-lg rounded-lg lg:rounded-xl hover:shadow-xl transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
                      }`}>
                        {/* Layout responsive */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 lg:gap-4">
                          {/* Información principal */}
                          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                            {/* Hora */}
                            <div className="flex-shrink-0">
                              <div className="px-2 py-1 lg:w-12 lg:h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md lg:rounded-lg flex items-center justify-center">
                                <span className={`text-xs lg:text-sm font-bold ${isDarkMode ? 'text-black' : 'text-slate-700'}`}>
                                  {reservation.time}
                                </span>
                              </div>
                            </div>
                            
                            {/* Mesa */}
                            <div className="flex-shrink-0">
                              <div className="px-2 py-1 lg:px-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md shadow-md">
                                <span className="text-white font-bold text-xs">Mesa {reservation.table}</span>
                              </div>
                            </div>
                            
                            {/* Información del Cliente */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm lg:text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {reservation.clientName}
                              </h3>
                              <div className="flex items-center gap-2 lg:gap-3 text-xs">
                                <span className={`${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                                  {reservation.partySize} personas
                                </span>
                                <span className={`hidden lg:inline ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>•</span>
                                <span className={`hidden lg:inline truncate ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                  {reservation.phone}
                                </span>
                                {reservation.notes && (
                                  <>
                                    <span className={`lg:hidden ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>•</span>
                                    <span className={`lg:hidden italic truncate ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                      {reservation.notes}
                                    </span>
                                  </>
                                )}
                              </div>
                              {reservation.notes && (
                                <p className={`hidden lg:block italic text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                  {reservation.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Status */}
                          <div className="flex-shrink-0">
                            <select
                              value={reservation.status}
                              onChange={(e) => handleReservationStatusChange(reservation.id, e.target.value as Reservation['status'])}
                              className={`w-full sm:w-auto px-2 py-1 lg:px-3 rounded-md lg:rounded-full text-xs font-semibold border lg:border-2 cursor-pointer transition-colors ${
                                reservation.status === "confirmed"
                                  ? "text-orange-700 bg-orange-100 border-orange-300"
                                  : reservation.status === "occupied"
                                  ? "text-red-700 bg-red-100 border-red-300"
                                  : reservation.status === "completed"
                                  ? "text-gray-700 bg-gray-100 border-gray-300"
                                  : "text-rose-700 bg-rose-100 border-rose-300"
                              }`}
                            >
                              <option value="confirmed">Reservada</option>
                              <option value="occupied">Ocupada</option>
                              <option value="completed">Completada</option>
                              <option value="cancelled">Cancelada</option>
                            </select>
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

          {/* Otras secciones con Suspense - Mantener montadas para mejor rendimiento */}
          <div style={{ display: activeSection === 'reservations' ? 'block' : 'none' }} className="pt-2 sm:pt-3 md:pt-4 lg:pt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <ReservationLoading />
              </div>
            }>
              <ReservationCalendar 
                restaurantId={restaurantId} 
                isDarkMode={isDarkMode} 
                restaurantTables={[]}
              />
            </Suspense>
          </div>

          <div style={{ display: activeSection === 'tables' ? 'block' : 'none' }} className="pt-2 sm:pt-3 md:pt-4 lg:pt-6">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <TableLoading />
              </div>
            }>
              <TablePlan 
                restaurantId={restaurantId} 
                isDarkMode={isDarkMode}
              />
            </Suspense>
          </div>

          {activeSection === 'clients' && (
            <div className="pt-2 sm:pt-3 md:pt-4 lg:pt-6 px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6 md:space-y-8">
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






          {activeSection === 'settings' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">

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
