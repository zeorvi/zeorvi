'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Link from 'next/link';

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  features: string[];
  googleSheets: {
    spreadsheetId: string;
    spreadsheetUrl: string;
    created: boolean;
  };
  retellAI: {
    agentId: string;
    webhookUrl: string;
    configured: boolean;
    error?: string;
  };
  dashboard: {
    url: string;
    available: boolean;
  };
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      
      // En un sistema real, aquí harías una llamada a la API para obtener todos los restaurantes
      // Por ahora, simulamos algunos restaurantes
      const mockRestaurants: RestaurantData[] = [
        {
          id: 'rest_001',
          name: 'Restaurante La Gaviota',
          address: 'Calle del Mar 123',
          phone: '555-0101',
          email: 'info@lagaviota.com',
          capacity: 50,
          features: ['Terraza', 'WiFi', 'Parking'],
          googleSheets: {
            spreadsheetId: 'spreadsheet_001',
            spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spreadsheet_001/edit',
            created: true
          },
          retellAI: {
            agentId: 'rest_001_agent',
            webhookUrl: '/api/retell/webhook',
            configured: true
          },
          dashboard: {
            url: '/dashboard/rest_001',
            available: true
          },
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'rest_002',
          name: 'Bistro Central',
          address: 'Avenida Principal 456',
          phone: '555-0202',
          email: 'contacto@bistrocentral.com',
          capacity: 30,
          features: ['WiFi', 'Barra'],
          googleSheets: {
            spreadsheetId: 'spreadsheet_002',
            spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spreadsheet_002/edit',
            created: true
          },
          retellAI: {
            agentId: 'rest_002_agent',
            webhookUrl: '/api/retell/webhook',
            configured: true
          },
          dashboard: {
            url: '/dashboard/rest_002',
            available: true
          },
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'rest_003',
          name: 'Casa del Chef',
          address: 'Plaza Mayor 789',
          phone: '555-0303',
          email: 'reservas@casadelchef.com',
          capacity: 40,
          features: ['Terraza', 'WiFi', 'Parking', 'Barra'],
          googleSheets: {
            spreadsheetId: 'spreadsheet_003',
            spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spreadsheet_003/edit',
            created: true
          },
          retellAI: {
            agentId: 'rest_003_agent',
            webhookUrl: '/api/retell/webhook',
            configured: true
          },
          dashboard: {
            url: '/dashboard/rest_003',
            available: true
          },
          createdAt: new Date().toISOString(),
          status: 'active'
        }
      ];

      setRestaurants(mockRestaurants);
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
      toast.error('Error cargando restaurantes');
    } finally {
      setLoading(false);
    }
  };

  const createNewRestaurant = async () => {
    try {
      setCreating(true);
      
      const newRestaurant = {
        name: 'Nuevo Restaurante',
        address: 'Dirección del restaurante',
        phone: '555-0000',
        email: 'info@nuevorestaurante.com',
        capacity: 50,
        features: ['WiFi']
      };

      const response = await fetch('/api/restaurants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRestaurant),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Restaurante creado exitosamente');
        loadRestaurants(); // Recargar la lista
      } else {
        toast.error(result.error || 'Error creando restaurante');
      }
    } catch (error) {
      console.error('Error creando restaurante:', error);
      toast.error('Error creando restaurante');
    } finally {
      setCreating(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Cargando restaurantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏪</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Gestión de Restaurantes</h1>
                <p className="text-sm text-slate-500">Cada restaurante tiene su propio Google Sheets, Retell AI y Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={createNewRestaurant}
                disabled={creating}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {creating ? '⏳ Creando...' : '➕ Nuevo Restaurante'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda */}
        <div className="mb-6">
          <Input
            placeholder="Buscar restaurantes por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{restaurants.length}</div>
            <div className="text-slate-600">Total Restaurantes</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {restaurants.filter(r => r.googleSheets.created).length}
            </div>
            <div className="text-slate-600">Google Sheets</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {restaurants.filter(r => r.retellAI.configured).length}
            </div>
            <div className="text-slate-600">Retell AI</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {restaurants.filter(r => r.dashboard.available).length}
            </div>
            <div className="text-slate-600">Dashboards</div>
          </Card>
        </div>

        {/* Lista de restaurantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header del restaurante */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{restaurant.name}</h3>
                    <p className="text-sm text-slate-500">{restaurant.address}</p>
                    <p className="text-sm text-slate-500">{restaurant.phone}</p>
                  </div>
                  <Badge variant={restaurant.status === 'active' ? 'default' : 'secondary'}>
                    {restaurant.status}
                  </Badge>
                </div>

                {/* Información del restaurante */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Capacidad:</span>
                    <span className="font-medium">{restaurant.capacity} personas</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">ID:</span>
                    <span className="font-mono text-xs">{restaurant.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Características:</span>
                    <span className="text-xs">{restaurant.features.join(', ')}</span>
                  </div>
                </div>

                {/* Estado de los servicios */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Google Sheets:</span>
                    <Badge variant={restaurant.googleSheets.created ? 'default' : 'destructive'}>
                      {restaurant.googleSheets.created ? '✅ Activo' : '❌ Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Retell AI:</span>
                    <Badge variant={restaurant.retellAI.configured ? 'default' : 'destructive'}>
                      {restaurant.retellAI.configured ? '✅ Activo' : '❌ Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Dashboard:</span>
                    <Badge variant={restaurant.dashboard.available ? 'default' : 'destructive'}>
                      {restaurant.dashboard.available ? '✅ Activo' : '❌ Inactivo'}
                    </Badge>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex space-x-2 pt-4">
                  <Link href={restaurant.dashboard.url} className="flex-1">
                    <Button className="w-full" size="sm">
                      📊 Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(restaurant.googleSheets.spreadsheetUrl, '_blank')}
                  >
                    📈 Sheets
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredRestaurants.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">No se encontraron restaurantes</h3>
              <p className="text-slate-600">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer restaurante para comenzar'}
              </p>
              {!searchTerm && (
                <Button onClick={createNewRestaurant} disabled={creating}>
                  {creating ? '⏳ Creando...' : '➕ Crear Primer Restaurante'}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
