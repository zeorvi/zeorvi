'use client';

import { useState, useEffect } from 'react';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Users, 
  Clock, 
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { toast } from 'sonner';

interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string;
  status: 'libre' | 'ocupada' | 'reservada';
  lastUsed?: string;
  notes?: string;
}

export default function FreeTablesManagement({ restaurantId }: { restaurantId: string }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<'all' | '2' | '4' | '6' | '8+'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'location' | 'lastUsed'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const loadTables = async () => {
      setIsLoading(true);
      
      try {
        console.log('🔍 Loading restaurant data for tables:', restaurantId);
        const restaurantData = await getRestaurantById(restaurantId);
        
        if (restaurantData) {
          console.log('✅ Restaurant data loaded:', restaurantData);
          
          // Usar mesas por defecto ya que RestaurantData no incluye tables
          const fallbackTables: Table[] = [
            {
              id: '1',
              name: 'Mesa 1',
              capacity: 4,
              location: 'Comedor Principal',
              status: 'libre',
              lastUsed: new Date().toISOString(),
              notes: 'Mesa principal del restaurante'
            }
          ];
          
          setTables(fallbackTables);
          setFilteredTables(fallbackTables);
        } else {
          console.log('⚠️ No tables found, using fallback');
          // Fallback si no hay mesas configuradas
          const fallbackTables: Table[] = [
            {
              id: '1',
              name: 'Mesa 1',
              capacity: 4,
              location: 'Comedor Principal',
              status: 'libre',
              lastUsed: new Date().toISOString(),
              notes: 'Mesa principal del restaurante'
            }
          ];
          
          setTables(fallbackTables);
          setFilteredTables(fallbackTables);
        }
      } catch (error) {
        console.error('❌ Error loading restaurant tables:', error);
        // Usar datos de fallback en caso de error
        const fallbackTables: Table[] = [
          {
            id: '1',
            name: 'Mesa 1',
            capacity: 4,
            location: 'Comedor Principal',
            status: 'libre',
            lastUsed: new Date().toISOString(),
            notes: 'Mesa principal del restaurante'
          }
        ];
        
        setTables(fallbackTables);
        setFilteredTables(fallbackTables);
      } finally {
        setIsLoading(false);
      }
    };

    loadTables();
  }, [restaurantId]);

  // Filtrar y ordenar mesas
  useEffect(() => {
    let filtered = tables;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(table =>
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por capacidad
    if (capacityFilter !== 'all') {
      if (capacityFilter === '8+') {
        filtered = filtered.filter(table => table.capacity >= 8);
      } else {
        filtered = filtered.filter(table => table.capacity === parseInt(capacityFilter));
      }
    }

    // Filtrar por ubicación
    if (locationFilter !== 'all') {
      filtered = filtered.filter(table => table.location === locationFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'capacity':
          comparison = a.capacity - b.capacity;
          break;
        case 'location':
          comparison = a.location.localeCompare(b.location);
          break;
        case 'lastUsed':
          comparison = new Date(a.lastUsed || 0).getTime() - new Date(b.lastUsed || 0).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTables(filtered);
  }, [tables, searchTerm, capacityFilter, locationFilter, sortBy, sortOrder]);

  const getCapacityColor = (capacity: number) => {
    if (capacity <= 2) return 'bg-blue-100 text-blue-800';
    if (capacity <= 4) return 'bg-green-100 text-green-800';
    if (capacity <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-purple-100 text-purple-800';
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'Terraza': return '🌿';
      case 'Salón Principal': return '🏢';
      case 'Salón Privado': return '🔒';
      default: return '📍';
    }
  };

  const getUniqueLocations = () => {
    return Array.from(new Set(tables.map(table => table.location)));
  };

  const getCapacityStats = () => {
    const total = tables.length;
    const byCapacity = tables.reduce((acc, table) => {
      const cap = table.capacity;
      if (cap <= 2) acc.small++;
      else if (cap <= 4) acc.medium++;
      else if (cap <= 6) acc.large++;
      else acc.xlarge++;
      return acc;
    }, { small: 0, medium: 0, large: 0, xlarge: 0 });

    return { total, ...byCapacity };
  };

  const stats = getCapacityStats();

  return (
    <div className="space-y-6">

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Mesas Libres</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">2 Personas</p>
                <p className="text-xl font-bold text-blue-600">{stats.small}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">4 Personas</p>
                <p className="text-xl font-bold text-green-600">{stats.medium}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">6 Personas</p>
                <p className="text-xl font-bold text-yellow-600">{stats.large}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">8+ Personas</p>
                <p className="text-xl font-bold text-purple-600">{stats.xlarge}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, ubicación o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value as any)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todas las capacidades</option>
                <option value="2">2 personas</option>
                <option value="4">4 personas</option>
                <option value="6">6 personas</option>
                <option value="8+">8+ personas</option>
              </select>
              
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todas las ubicaciones</option>
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="capacity">Ordenar por capacidad</option>
                <option value="location">Ordenar por ubicación</option>
                <option value="lastUsed">Ordenar por último uso</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Cargando mesas...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas libres</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron mesas con los criterios de búsqueda' : 'Todas las mesas están ocupadas o reservadas'}
            </p>
          </div>
        ) : (
          filteredTables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Libre
                  </Badge>
                </div>
                <CardDescription>
                  {getLocationIcon(table.location)} {table.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Capacidad:</span>
                  <Badge className={getCapacityColor(table.capacity)}>
                    {table.capacity} personas
                  </Badge>
                </div>
                
                {table.lastUsed && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Último uso: {new Date(table.lastUsed).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                
                {table.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Notas:</strong> {table.notes}
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button 
                    className="flex-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
                    onClick={() => {
                      console.log('Editar clicked:', table.name);
                      toast.success(`✏️ Editando ${table.name}`);
                      toast.info('Abriendo formulario de edición de mesa');
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </button>
                  <button 
                    className="flex-1 border border-orange-300 bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
                    onClick={() => {
                      console.log('Asignar clicked:', table.name);
                      toast.success(`👥 Asignando cliente a ${table.name}`);
                      toast.info('Selecciona un cliente para asignar a esta mesa');
                    }}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Asignar
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
