'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  ArrowLeft
} from 'lucide-react';
import RestaurantIdentifier from '@/components/admin/RestaurantIdentifier';

export default function RestaurantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Gestión de Restaurantes
                </h1>
                <p className="text-sm text-gray-500">
                  Identifica y gestiona todos los restaurantes
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button 
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => window.open('/admin', '_blank')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Restaurante
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar restaurante por nombre, ID o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Gourmet">Gourmet</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Cafetería">Cafetería</option>
                </select>
                
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Restaurantes</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">10</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                  <p className="text-2xl font-bold text-orange-600">156</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Identificador de Restaurantes */}
        <RestaurantIdentifier />

        {/* Vista de Tablas de Restaurantes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-orange-600" />
              <span>Vista de Tablas de Restaurantes</span>
            </CardTitle>
            <CardDescription>
              Accede directamente a la gestión de mesas y reservas de cada restaurante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mock data para mostrar las tablas */}
              {[
                { id: 'rest_001', name: 'El Buen Sabor', status: 'active', tables: 12, reservations: 45 },
                { id: 'rest_002', name: 'La Parrilla del Chef', status: 'active', tables: 8, reservations: 32 },
                { id: 'rest_003', name: 'Café Central', status: 'inactive', tables: 6, reservations: 18 }
              ].map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                      <Badge className={restaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {restaurant.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Mesas:</span>
                        <span className="font-medium">{restaurant.tables}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reservas hoy:</span>
                        <span className="font-medium">{restaurant.reservations}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => window.open(`/admin/restaurant/${restaurant.id}`, '_blank')}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Ver Tabla
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Masivas */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Acciones Masivas</CardTitle>
            <CardDescription>
              Realiza acciones en múltiples restaurantes a la vez
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Datos
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar Restaurantes
              </Button>
              <Button variant="outline" className="text-green-600 hover:text-green-700">
                <Settings className="h-4 w-4 mr-2" />
                Activar Seleccionados
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Settings className="h-4 w-4 mr-2" />
                Desactivar Seleccionados
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
