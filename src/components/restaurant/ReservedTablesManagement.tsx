'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Users, 
  Clock, 
  MapPin,
  AlertCircle,
  RefreshCw,
  SortAsc,
  SortDesc,
  Phone,
  CheckCircle,
  Calendar,
  Edit,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ReservedTable {
  id: string;
  name: string;
  capacity: number;
  location: string;
  reservation: {
    id: string;
    clientName: string;
    phone: string;
    email?: string;
    partySize: number;
    date: string;
    time: string;
    notes?: string;
    createdAt: string;
  };
  status: 'reservada';
  reservedUntil: string;
}

export default function ReservedTablesManagement({ restaurantId }: { restaurantId: string }) {
  const [tables, setTables] = useState<ReservedTable[]>([]);
  const [filteredTables, setFilteredTables] = useState<ReservedTable[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<'all' | '2' | '4' | '6' | '8+'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'location' | 'time'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const loadTables = () => {
      setIsLoading(true);
      
      setTimeout(() => {
        const mockTables: ReservedTable[] = [
          {
            id: '1',
            name: 'Mesa 3',
            capacity: 6,
            location: 'Salón Principal',
            reservation: {
              id: 'res_1',
              clientName: 'Luis Fernández',
              phone: '+34 611 987 654',
              email: 'luis@email.com',
              partySize: 4,
              date: '2024-01-21',
              time: '20:30',
              notes: 'Cena de aniversario',
              createdAt: '2024-01-18T10:30:00Z'
            },
            status: 'reservada',
            reservedUntil: '2024-01-21T20:30:00Z'
          },
          {
            id: '2',
            name: 'Mesa 6',
            capacity: 4,
            location: 'Terraza',
            reservation: {
              id: 'res_2',
              clientName: 'Elena García',
              phone: '+34 644 555 666',
              partySize: 2,
              date: '2024-01-22',
              time: '13:00',
              notes: 'Almuerzo de trabajo',
              createdAt: '2024-01-19T14:20:00Z'
            },
            status: 'reservada',
            reservedUntil: '2024-01-22T13:00:00Z'
          },
          {
            id: '3',
            name: 'Mesa 7',
            capacity: 8,
            location: 'Salón Privado',
            reservation: {
              id: 'res_3',
              clientName: 'Roberto Silva',
              phone: '+34 633 777 888',
              email: 'roberto@email.com',
              partySize: 6,
              date: '2024-01-23',
              time: '19:00',
              notes: 'Celebración familiar',
              createdAt: '2024-01-20T09:15:00Z'
            },
            status: 'reservada',
            reservedUntil: '2024-01-23T19:00:00Z'
          },
          {
            id: '4',
            name: 'Mesa 9',
            capacity: 2,
            location: 'Terraza',
            reservation: {
              id: 'res_4',
              clientName: 'Carmen López',
              phone: '+34 622 333 444',
              partySize: 2,
              date: '2024-01-24',
              time: '21:00',
              notes: 'Cena romántica',
              createdAt: '2024-01-21T16:45:00Z'
            },
            status: 'reservada',
            reservedUntil: '2024-01-24T21:00:00Z'
          }
        ];
        
        setTables(mockTables);
        setFilteredTables(mockTables);
        setIsLoading(false);
      }, 1000);
    };

    loadTables();
  }, [restaurantId]);

  // Filtrar y ordenar mesas (memoizado para mejor rendimiento)
  const filteredAndSortedTables = useMemo(() => {
    let filtered = tables;

    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(table =>
        table.name.toLowerCase().includes(searchLower) ||
        table.location.toLowerCase().includes(searchLower) ||
        table.reservation.clientName.toLowerCase().includes(searchLower) ||
        table.reservation.phone.includes(searchTerm)
      );
    }

    // Filtrar por capacidad
    if (capacityFilter !== 'all') {
      if (capacityFilter === '8+') {
        filtered = filtered.filter(table => table.capacity >= 8);
      } else {
        const capacity = parseInt(capacityFilter);
        filtered = filtered.filter(table => table.capacity === capacity);
      }
    }

    // Filtrar por ubicación
    if (locationFilter !== 'all') {
      filtered = filtered.filter(table => table.location === locationFilter);
    }

    // Filtrar por fecha
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(table => table.reservation.date === todayStr);
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      filtered = filtered.filter(table => table.reservation.date === tomorrowStr);
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(table => new Date(table.reservation.date) <= weekFromNow);
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
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
        case 'time':
          comparison = a.reservation.time.localeCompare(b.reservation.time);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tables, searchTerm, capacityFilter, locationFilter, dateFilter, sortBy, sortOrder]);

  // Actualizar filteredTables cuando cambien los filtros
  useEffect(() => {
    setFilteredTables(filteredAndSortedTables);
  }, [filteredAndSortedTables]);

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

  // Memoizar ubicaciones únicas
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(tables.map(table => table.location)));
  }, [tables]);

  const getTimeUntilReservation = useCallback((date: string, time: string) => {
    const reservationDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMs = reservationDateTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Pasada';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `En ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `En ${diffHours}h ${diffMinutes}m`;
    } else {
      return `En ${diffMinutes}m`;
    }
  }, []);

  // Memoizar estadísticas de reservas
  const stats = useMemo(() => {
    const total = tables.length;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayReservations = tables.filter(table => table.reservation.date === today).length;
    const tomorrowReservations = tables.filter(table => table.reservation.date === tomorrow).length;
    const totalGuests = tables.reduce((sum, table) => sum + table.reservation.partySize, 0);

    return { total, todayReservations, tomorrowReservations, totalGuests };
  }, [tables]);

  return (
    <div className="space-y-6">

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Reservas</p>
                <p className="text-xl font-bold text-yellow-600">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Hoy</p>
                <p className="text-xl font-bold text-orange-600">{stats.todayReservations}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Mañana</p>
                <p className="text-xl font-bold text-blue-600">{stats.tomorrowReservations}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Comensales</p>
                <p className="text-xl font-bold text-green-600">{stats.totalGuests}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
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
                  placeholder="Buscar por mesa, cliente o teléfono..."
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
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="today">Hoy</option>
                <option value="tomorrow">Mañana</option>
                <option value="week">Esta semana</option>
                <option value="all">Todas</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="name">Ordenar por mesa</option>
                <option value="capacity">Ordenar por capacidad</option>
                <option value="location">Ordenar por ubicación</option>
                <option value="time">Ordenar por hora</option>
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

      {/* Lista de Mesas Reservadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Cargando mesas reservadas...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas reservadas</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron mesas con los criterios de búsqueda' : 'No hay reservas para mostrar'}
            </p>
          </div>
        ) : (
          filteredTables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    Reservada
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
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeUntilReservation(table.reservation.date, table.reservation.time)}</span>
                </div>

                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-medium text-gray-900 mb-1">Cliente</div>
                  <div className="text-sm text-gray-600">{table.reservation.clientName}</div>
                  <div className="text-xs text-gray-500">{table.reservation.partySize} personas</div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{(() => {
                    const fecha = new Date(`${table.reservation.date}T00:00:00`);
                    const fechaLocal = fecha.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      timeZone: "Europe/Madrid"
                    });
                    return fechaLocal;
                  })()} a las {table.reservation.time}</span>
                </div>

                {table.reservation.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Notas:</strong> {table.reservation.notes}
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button 
                    className="flex-1 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
                    onClick={() => {
                      console.log('Llamar clicked:', table.reservation.clientName);
                      toast.success(`📞 Llamando a ${table.reservation.clientName}`);
                      toast.info(`Teléfono: ${table.reservation.phone}`);
                    }}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Llamar
                  </button>
                  <button 
                    className="flex-1 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-medium flex items-center justify-center transition-colors"
                    onClick={() => {
                      console.log('Modificar clicked:', table.name);
                      toast.success(`✏️ Modificando reserva en ${table.name}`);
                      toast.info(`Cliente: ${table.reservation.clientName}`);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modificar
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
