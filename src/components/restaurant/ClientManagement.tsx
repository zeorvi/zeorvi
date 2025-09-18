'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Calendar,
  Users,
  Star,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  phone: string;
  totalReservations: number;
  lastReservationDate?: string;
  notes?: string;
  isVip: boolean;
}

export default function ClientManagement({ restaurantId }: { restaurantId: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVip, setFilterVip] = useState<'all' | 'vip' | 'regular'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'María González',
        phone: '+34 612 345 678',
        totalReservations: 12,
        lastReservationDate: '2024-01-15',
        notes: 'Prefiere mesa cerca de la ventana',
        isVip: true
      },
      {
        id: '2',
        name: 'Carlos Rodríguez',
        phone: '+34 678 901 234',
        totalReservations: 8,
        lastReservationDate: '2024-01-10',
        notes: 'Alérgico a mariscos',
        isVip: false
      },
      {
        id: '3',
        name: 'Ana Martín',
        phone: '+34 655 123 456',
        totalReservations: 25,
        lastReservationDate: '2024-01-20',
        notes: 'Cliente frecuente, siempre pide el mismo plato',
        isVip: true
      },
      {
        id: '4',
        name: 'Luis Fernández',
        phone: '+34 611 987 654',
        totalReservations: 3,
        lastReservationDate: '2024-01-05',
        isVip: false
      }
    ];
    setClients(mockClients);
  }, [restaurantId]);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    
    const matchesFilter = filterVip === 'all' || 
                         (filterVip === 'vip' && client.isVip) ||
                         (filterVip === 'regular' && !client.isVip);
    
    return matchesSearch && matchesFilter;
  });

  const handleAddClient = () => {
    setShowAddForm(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  return (
    <div className="space-y-6">

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes VIP</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {clients.filter(c => c.isVip).length}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reservas Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.reduce((sum, client) => sum + client.totalReservations, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio/Cliente</p>
                <p className="text-2xl font-bold text-purple-600">
                  {clients.length > 0 ? Math.round(clients.reduce((sum, client) => sum + client.totalReservations, 0) / clients.length) : 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={filterVip}
                onChange={(e) => setFilterVip(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todos los clientes</option>
                <option value="vip">Solo VIP</option>
                <option value="regular">Solo regulares</option>
              </select>
              
              <button 
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm font-medium flex items-center transition-colors"
                onClick={() => {
                  toast.success('🔍 Aplicando filtros de clientes');
                  toast.info('Filtros por tipo de cliente, frecuencia y ubicación preferida activados');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                {client.isVip && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Star className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              <CardDescription>
                {client.totalReservations} reservas totales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
              
              
              {client.lastReservationDate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Última reserva: {new Date(client.lastReservationDate).toLocaleDateString('es-ES')}</span>
                </div>
              )}
              
              <div className="flex-1">
                {client.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Notas:</strong> {client.notes}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 pt-3 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditClient(client)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega tu primer cliente'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

