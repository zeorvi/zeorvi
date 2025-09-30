'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RestaurantStats {
  id: string;
  name: string;
  stats: {
    totalReservas: number;
    reservasHoy: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
  } | null;
  error?: string;
}

interface GlobalStats {
  totalReservas: number;
  reservasHoy: number;
  reservasConfirmadas: number;
  reservasPendientes: number;
  restaurantesActivos: number;
}

export default function GoogleSheetsManager() {
  const [restaurants, setRestaurants] = useState<RestaurantStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Cargar estadísticas
  const loadStats = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas globales
      const globalResponse = await fetch('/api/google-sheets/admin?action=stats');
      if (globalResponse.ok) {
        const globalData = await globalResponse.json();
        setGlobalStats(globalData.estadisticas);
      }

      // Cargar estadísticas por restaurante
      const restaurantsResponse = await fetch('/api/google-sheets/admin?action=restaurants');
      if (restaurantsResponse.ok) {
        const restaurantsData = await restaurantsResponse.json();
        setRestaurants(restaurantsData.restaurantes);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar todas las hojas
  const initializeAllSheets = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/google-sheets/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'init-all' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`✅ ${data.message}`);
        await loadStats(); // Recargar estadísticas
      } else {
        const errorData = await response.json();
        toast.error(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error inicializando hojas:', error);
      toast.error('Error inicializando hojas');
    } finally {
      setInitializing(false);
    }
  };

  // Crear ejemplo para un restaurante específico
  const createExampleForRestaurant = async (restaurantId: string, restaurantName: string) => {
    try {
      const response = await fetch('/api/google-sheets/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'create-example',
          restaurantId,
          restaurantName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`✅ ${data.message}`);
        await loadStats(); // Recargar estadísticas
      } else {
        const errorData = await response.json();
        toast.error(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creando ejemplo:', error);
      toast.error('Error creando ejemplo');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">📊 Google Sheets Manager</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={loadStats}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
          </Button>
          <Button 
            onClick={initializeAllSheets}
            disabled={initializing}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {initializing ? '⚙️ Inicializando...' : '⚙️ Inicializar Todas las Hojas'}
          </Button>
        </div>
      </div>

      {/* Estadísticas Globales */}
      {globalStats && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-xl">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">📈 Estadísticas Globales</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{globalStats.totalReservas}</div>
              <div className="text-sm text-blue-800">Total Reservas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{globalStats.reservasHoy}</div>
              <div className="text-sm text-green-800">Reservas Hoy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{globalStats.reservasConfirmadas}</div>
              <div className="text-sm text-emerald-800">Confirmadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{globalStats.reservasPendientes}</div>
              <div className="text-sm text-amber-800">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{globalStats.restaurantesActivos}</div>
              <div className="text-sm text-purple-800">Restaurantes Activos</div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Restaurantes */}
      <Card className="p-6 border-0 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🏪 Restaurantes</h2>
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-600">ID: {restaurant.id}</p>
                
                {restaurant.stats ? (
                  <div className="flex space-x-4 mt-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {restaurant.stats.totalReservas} total
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {restaurant.stats.reservasHoy} hoy
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {restaurant.stats.reservasConfirmadas} confirmadas
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-800">
                      {restaurant.stats.reservasPendientes} pendientes
                    </Badge>
                  </div>
                ) : (
                  <Badge className="bg-red-100 text-red-800 mt-2">
                    {restaurant.error || 'Error cargando estadísticas'}
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => createExampleForRestaurant(restaurant.id, restaurant.name)}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  📝 Crear Ejemplo
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Información de Configuración */}
      <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-0 shadow-xl">
        <h2 className="text-2xl font-bold text-orange-900 mb-4">⚙️ Configuración Requerida</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span><strong>GOOGLE_SHEETS_ID:</strong> ID de tu hoja de Google Sheets</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span><strong>GOOGLE_CREDENTIALS_PATH:</strong> Ruta al archivo google-credentials.json</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span><strong>Permisos:</strong> La cuenta de servicio debe tener acceso de edición a la hoja</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-orange-100 rounded-lg">
          <p className="text-orange-800 text-sm">
            💡 <strong>Tip:</strong> Ejecuta <code>node scripts/setup-google-sheets.js</code> para configurar automáticamente todas las hojas.
          </p>
        </div>
      </Card>

    </div>
  );
}
