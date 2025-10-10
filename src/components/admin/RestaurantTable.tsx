'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  twilioNumber: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'libre' | 'ocupada' | 'reservada';
  currentReservation?: {
    clientName: string;
    time: string;
    partySize: number;
  };
}

interface Reservation {
  id: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  tableName: string;
  status: 'confirmada' | 'pendiente' | 'cancelada';
}

export default function RestaurantTable({ 
  restaurantId, 
  onBack 
}: { 
  restaurantId: string; 
  onBack: () => void; 
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'tables' | 'reservations'>('tables');

  // Mock data - en producción vendría de la base de datos
  useEffect(() => {
    const loadRestaurantData = () => {
      setIsLoading(true);
      
      // Simular carga de datos
      setTimeout(() => {
        const mockRestaurant: Restaurant = {
          id: restaurantId,
          name: 'El Buen Sabor',
          email: 'info@elbuensabor.com',
          phone: '+34 912 345 678',
          address: 'Calle Mayor 123, Madrid, España',
          twilioNumber: '+34 612 345 678',
          status: 'active',
          createdAt: '2024-01-01'
        };

        const mockTables: Table[] = [
          { id: '1', name: 'Mesa 1', capacity: 2, status: 'libre' },
          { id: '2', name: 'Mesa 2', capacity: 4, status: 'ocupada', currentReservation: { clientName: 'María González', time: '20:00', partySize: 3 } },
          { id: '3', name: 'Mesa 3', capacity: 6, status: 'reservada', currentReservation: { clientName: 'Carlos Rodríguez', time: '21:30', partySize: 4 } },
          { id: '4', name: 'Mesa 4', capacity: 2, status: 'libre' },
          { id: '5', name: 'Mesa 5', capacity: 8, status: 'ocupada', currentReservation: { clientName: 'Ana Martín', time: '19:30', partySize: 6 } },
          { id: '6', name: 'Mesa 6', capacity: 4, status: 'libre' }
        ];

        const mockReservations: Reservation[] = [
          { id: '1', clientName: 'María González', phone: '+34 612 345 678', date: '2024-01-20', time: '20:00', partySize: 3, tableName: 'Mesa 2', status: 'confirmada' },
          { id: '2', clientName: 'Carlos Rodríguez', phone: '+34 678 901 234', date: '2024-01-20', time: '21:30', partySize: 4, tableName: 'Mesa 3', status: 'confirmada' },
          { id: '3', clientName: 'Ana Martín', phone: '+34 655 123 456', date: '2024-01-20', time: '19:30', partySize: 6, tableName: 'Mesa 5', status: 'confirmada' },
          { id: '4', clientName: 'Luis Fernández', phone: '+34 611 987 654', date: '2024-01-21', time: '20:30', partySize: 2, tableName: 'Mesa 1', status: 'pendiente' }
        ];

        setRestaurant(mockRestaurant);
        setTables(mockTables);
        setReservations(mockReservations);
        setIsLoading(false);
      }, 1000);
    };

    loadRestaurantData();
  }, [restaurantId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'libre': return 'bg-green-100 text-green-800';
      case 'ocupada': return 'bg-red-100 text-red-800';
      case 'reservada': return 'bg-yellow-100 text-yellow-800';
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'libre': return '🟢';
      case 'ocupada': return '🔴';
      case 'reservada': return '🟡';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
        <p className="text-gray-600">Cargando datos del restaurante...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Restaurante no encontrado</h3>
        <p className="text-gray-600">El restaurante seleccionado no existe</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-600">Gestión de mesas y reservas</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={restaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {restaurant.status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Información del Restaurante */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{restaurant.phone}</p>
                <p className="text-xs text-gray-500">Teléfono</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{restaurant.email}</p>
                <p className="text-xs text-gray-500">Email</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{restaurant.address}</p>
                <p className="text-xs text-gray-500">Dirección</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{restaurant.twilioNumber}</p>
                <p className="text-xs text-gray-500">Twilio</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex space-x-4">
        <Button
          variant={activeView === 'tables' ? 'default' : 'outline'}
          onClick={() => setActiveView('tables')}
          className={activeView === 'tables' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          <Building className="h-4 w-4 mr-2" />
          Mesas ({tables.length})
        </Button>
        <Button
          variant={activeView === 'reservations' ? 'default' : 'outline'}
          onClick={() => setActiveView('reservations')}
          className={activeView === 'reservations' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Reservas ({reservations.length})
        </Button>
      </div>

      {/* Contenido */}
      {activeView === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                  <Badge className={getStatusColor(table.status)}>
                    {getStatusIcon(table.status)} {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  Capacidad: {table.capacity} personas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {table.currentReservation && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{table.currentReservation.clientName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{table.currentReservation.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{table.currentReservation.partySize} personas</span>
                    </div>
                  </div>
                )}
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeView === 'reservations' && (
        <Card>
          <CardHeader>
            <CardTitle>Reservas del Restaurante</CardTitle>
            <CardDescription>
              Lista de todas las reservas activas y pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{reservation.clientName}</div>
                      <div className="text-sm text-gray-500">{reservation.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {(() => {
                        const fecha = new Date(`${reservation.date}T00:00:00`);
                        const fechaLocal = fecha.toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "Europe/Madrid"
                        });
                        return fechaLocal;
                      })()} a las {reservation.time}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reservation.partySize} personas • {reservation.tableName}
                    </div>
                  </div>
                  <Badge className={getStatusColor(reservation.status)}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

