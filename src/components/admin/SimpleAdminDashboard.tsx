'use client';

import { useState, useEffect } from 'react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, Users, Plus, Settings, RefreshCw, Trash2, AlertTriangle, Phone, Bot, Database, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllRestaurants, deleteRestaurant, updateRestaurantStatus, type RestaurantData } from '@/lib/restaurantServicePostgres';
import UpdateCredentials from './UpdateCredentials';
import RetellAgentsManager from './RetellAgentsManager';

export default function SimpleAdminDashboard() {
  const router = useRouter();
  const { logout } = useClientAuth();
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showUpdateCredentials, setShowUpdateCredentials] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [showRetellAgents, setShowRetellAgents] = useState(false);

  const loadRestaurants = async (showToast = false) => {
    setIsLoading(true);
    try {
      const restaurantData = await getAllRestaurants();
      setRestaurants(restaurantData);
      setLastUpdated(new Date());
      if (showToast) {
        toast.success(`✅ Lista actualizada - ${restaurantData.length} restaurantes`);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast.error('Error al cargar los restaurantes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Solo carga inicial - sin actualización automática
    loadRestaurants();

    // Actualización automática deshabilitada - solo manual
    // const interval = setInterval(() => {
    //   console.log('🔄 Auto-updating restaurant list...');
    //   loadRestaurants();
    // }, 2 * 60 * 1000); // 2 minutos

    // Actualización al enfocar ventana deshabilitada
    // const handleFocus = () => {
    //   console.log('🔍 Window focused - updating restaurant list...');
    //   loadRestaurants();
    // };

    // window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      // clearInterval(interval);
      // window.removeEventListener('focus', handleFocus);
    };
  }, []);

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

  const handleDeleteRestaurant = async (restaurantId: string, restaurantName: string) => {
    const confirmed = window.confirm(
      `⚠️ ¿Estás seguro de que quieres ELIMINAR completamente el restaurante "${restaurantName}"?\n\n` +
      `Esta acción NO se puede deshacer y eliminará:\n` +
      `• Toda la información del restaurante\n` +
      `• Las credenciales de acceso\n` +
      `• La configuración de mesas\n` +
      `• Todos los datos asociados\n\n` +
      `Escribe "ELIMINAR" para confirmar:`
    );

    if (!confirmed) return;

    const confirmText = window.prompt(
      `Para confirmar la eliminación de "${restaurantName}", escribe exactamente: ELIMINAR`
    );

    if (confirmText !== 'ELIMINAR') {
      toast.error('Eliminación cancelada - texto de confirmación incorrecto');
      return;
    }

    try {
      const success = await deleteRestaurant(restaurantId);
      if (success) {
        toast.success(`✅ Restaurante "${restaurantName}" eliminado correctamente`);
        // Recargar la lista
        loadRestaurants();
      }
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Error al eliminar el restaurante');
    }
  };

  const handleToggleStatus = async (restaurantId: string, currentStatus: string, restaurantName: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activar' : 'desactivar';
    const statusText = newStatus === 'active' ? 'ACTIVO' : 'INACTIVO';

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres ${action.toUpperCase()} el restaurante "${restaurantName}"?\n\n` +
      `Estado actual: ${currentStatus === 'active' ? 'ACTIVO' : 'INACTIVO'}\n` +
      `Nuevo estado: ${statusText}\n\n` +
      `${newStatus === 'inactive' ? '⚠️ Al desactivar, las credenciales no funcionarán para login.' : '✅ Al activar, las credenciales volverán a funcionar.'}`
    );

    if (!confirmed) return;

    try {
      const success = await updateRestaurantStatus(restaurantId, newStatus);
      if (success) {
        toast.success(`✅ Restaurante "${restaurantName}" ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`);
        // Recargar la lista
        loadRestaurants();
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      toast.error('Error al actualizar el estado del restaurante');
    }
  };

  const handleUpdateCredentials = (restaurant: RestaurantData) => {
    setSelectedRestaurant(restaurant);
    setShowUpdateCredentials(true);
  };

  const handleCredentialsUpdated = () => {
    setShowUpdateCredentials(false);
    setSelectedRestaurant(null);
    toast.success('Credenciales actualizadas correctamente');
  };

  const handleSyncRestaurants = async () => {
    const confirmed = window.confirm(
      `🔄 ¿Sincronizar restaurantes con la base de datos?\n\n` +
      `Esta acción insertará los restaurantes de ejemplo:\n` +
      `• El Buen Sabor\n` +
      `• La Gaviota\n\n` +
      `Solo se crearán si no existen.\n\n` +
      `¿Continuar?`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      toast.info('🔄 Sincronizando restaurantes...');

      const response = await fetch('/api/admin/sync-restaurants', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ ${data.message}`);
        // Recargar la lista
        loadRestaurants();
      } else {
        toast.error(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Error syncing restaurants:', error);
      toast.error('Error al sincronizar restaurantes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-cyan-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Panel de Administración
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Estadísticas */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-6 shadow-2xl shadow-cyan-500/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white ml-3">Restaurantes</h3>
              </div>
              <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {isLoading ? '...' : restaurants.filter(r => r.status === 'active').length}
              </div>
              <p className="text-sm text-gray-300">Restaurantes activos</p>
            </div>
          </div>

          {/* Crear Restaurante */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-6 shadow-2xl shadow-purple-500/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white ml-3">Acciones</h3>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/admin/create-restaurant')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Restaurante
                </Button>
                <Button 
                  onClick={() => router.push('/admin/create-restaurant')}
                  variant="outline" 
                  className="w-full bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
                <Button 
                  onClick={() => router.push('/admin/agent-test')}
                  variant="outline" 
                  className="w-full bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Prueba Agentes IA
                </Button>
                <Button 
                  onClick={() => setShowRetellAgents(!showRetellAgents)}
                  variant="outline" 
                  className="w-full bg-transparent border-blue-400/50 text-blue-300 hover:bg-blue-400/20 hover:border-blue-400"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Agentes Retell AI
                  {showRetellAgents ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                <Button 
                  onClick={handleSyncRestaurants}
                  disabled={isLoading}
                  variant="outline" 
                  className="w-full bg-transparent border-green-400/50 text-green-300 hover:bg-green-400/20 hover:border-green-400 disabled:opacity-50"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sincronizando...' : 'Sincronizar Restaurantes'}
                </Button>
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-pink-400/30 p-6 shadow-2xl shadow-pink-500/20">
              <h3 className="text-lg font-bold text-white mb-4">Información del Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-300">Sistema funcionando correctamente</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <p className="text-sm text-gray-300">Último acceso: Hoy</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Lista de Restaurantes */}
        <div className="relative group mt-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-6 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xl font-bold text-white">Lista de Restaurantes</h3>
                  {lastUpdated && (
                    <p className="text-xs text-gray-400">
                      Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => loadRestaurants(true)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Actualizar'}
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-400/30">
                    <th className="text-left py-4 px-4 text-cyan-300 font-semibold">Nombre</th>
                    <th className="text-left py-4 px-4 text-cyan-300 font-semibold">Email</th>
                    <th className="text-center py-4 px-4 text-cyan-300 font-semibold">Estado</th>
                    <th className="text-center py-4 px-4 text-cyan-300 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                          <span className="text-gray-300">Cargando restaurantes...</span>
                        </div>
                      </td>
                    </tr>
                  ) : restaurants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <span className="text-gray-400">No hay restaurantes registrados</span>
                      </td>
                    </tr>
                  ) : (
                    restaurants.map((restaurant) => (
                      <tr key={restaurant.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">{restaurant.name}</td>
                        <td className="py-4 px-4 text-gray-300">{restaurant.owner_email}</td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            onClick={() => handleToggleStatus(restaurant.id, restaurant.status, restaurant.name)}
                            variant="outline"
                            size="sm"
                            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg border-none ${
                              restaurant.status === 'active' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                            }`}
                          >
                            {restaurant.status === 'active' ? '🟢 Activo' : '🔴 Inactivo'}
                          </Button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button 
                              onClick={() => router.push(`/admin/restaurant/${restaurant.id}`)}
                              variant="outline" 
                              size="sm"
                              className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
                            >
                              Ver
                            </Button>
                            <Button
                              onClick={() => handleUpdateCredentials(restaurant)}
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/20 hover:border-yellow-400"
                              title="Actualizar credenciales"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.name)}
                              variant="outline"
                              size="sm"
                              className="bg-transparent border-red-400/50 text-red-300 hover:bg-red-400/20 hover:border-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sección de Gestión de Agentes Retell */}
        {showRetellAgents && (
          <div className="relative group mt-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-blue-400/30 p-6 shadow-2xl shadow-blue-500/20">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="text-xl font-bold text-white">Gestión de Agentes Retell AI</h3>
                  <p className="text-sm text-gray-400">Configura y gestiona los agentes de voz para cada restaurante</p>
                </div>
              </div>
              <RetellAgentsManager />
            </div>
          </div>
        )}
      </main>

      {/* Modal de Actualización de Credenciales */}
      {showUpdateCredentials && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actualizar Credenciales - {selectedRestaurant.name}
              </h3>
              <UpdateCredentials
                userId={selectedRestaurant.id}
                currentEmail={selectedRestaurant.owner_email}
                currentUsername={selectedRestaurant.name.toLowerCase().replace(/\s+/g, '')}
                onSuccess={handleCredentialsUpdated}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowUpdateCredentials(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
