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
  Users, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  Table
} from 'lucide-react';
import { toast } from 'sonner';

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  username: string;
  retellConfig?: any;
  twilioConfig?: any;
}

export default function RestaurantIdentifier() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Datos de ejemplo
  useEffect(() => {
    const mockRestaurants: Restaurant[] = [
      {
        id: 'rest_001',
        name: 'Restaurante El Buen Sabor',
        email: 'admin@elbuensabor.com',
        phone: '+34123456789',
        address: 'Calle Principal 123, Madrid',
        type: 'Familiar',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        username: 'elbuensabor',
        retellConfig: {
          agentId: 'agent_elbuensabor_001',
          voiceId: 'voice_familiar_spanish'
        },
        twilioConfig: {
          phoneNumber: '+34123456789',
          accountSid: 'AC_elbuensabor_123'
        }
      },
      {
        id: 'rest_002',
        name: 'La Parrilla del Chef',
        email: 'chef@laparrilla.com',
        phone: '+34666555444',
        address: 'Avenida Central 456, Barcelona',
        type: 'Gourmet',
        status: 'active',
        createdAt: new Date('2024-01-20'),
        username: 'laparrilla',
        retellConfig: {
          agentId: 'agent_laparrilla_002',
          voiceId: 'voice_gourmet_spanish'
        },
        twilioConfig: {
          phoneNumber: '+34666555444',
          accountSid: 'AC_laparrilla_456'
        }
      }
    ];
    setRestaurants(mockRestaurants);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copiado al portapapeles`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Familiar': 'bg-blue-100 text-blue-800 border-blue-200',
      'Gourmet': 'bg-purple-100 text-purple-800 border-purple-200',
      'Fast Food': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cafetería': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identificador de Restaurantes</h1>
          <p className="text-gray-600 mt-1">
            Sistema para identificar y gestionar restaurantes en la base de datos
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
          {restaurants.length} Restaurantes
        </Badge>
      </div>

      {/* Lista de Restaurantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Card 
            key={restaurant.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRestaurant?.id === restaurant.id 
                ? 'ring-2 ring-orange-500 bg-orange-50' 
                : 'hover:border-orange-300'
            }`}
            onClick={() => setSelectedRestaurant(restaurant)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                    <CardDescription className="text-sm">
                      ID: {restaurant.id}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Badge className={getStatusColor(restaurant.status)}>
                    {restaurant.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {restaurant.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {restaurant.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {restaurant.address}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getTypeColor(restaurant.type)}>
                  {restaurant.type}
                </Badge>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(restaurant.id, 'ID del restaurante');
                    }}
                  >
                    {copiedId === restaurant.id ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detalles del Restaurante Seleccionado */}
      {selectedRestaurant && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center text-orange-700">
              <Building className="h-6 w-6 mr-3" />
              Detalles de {selectedRestaurant.name}
            </CardTitle>
            <CardDescription>
              Información completa del restaurante seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Información Básica</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">ID del Restaurante:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {selectedRestaurant.id}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(selectedRestaurant.id, 'ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Usuario:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {selectedRestaurant.username}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm">{selectedRestaurant.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Teléfono:</span>
                    <span className="text-sm">{selectedRestaurant.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <Badge className={getTypeColor(selectedRestaurant.type)}>
                      {selectedRestaurant.type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge className={getStatusColor(selectedRestaurant.status)}>
                      {selectedRestaurant.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Configuraciones Técnicas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Configuraciones Técnicas</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Retell AI Agent ID:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                        {selectedRestaurant.retellConfig?.agentId || 'No configurado'}
                      </code>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Twilio Account SID:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                        {selectedRestaurant.twilioConfig?.accountSid || 'No configurado'}
                      </code>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Número Twilio:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded ml-2">
                      {selectedRestaurant.twilioConfig?.phoneNumber || 'No configurado'}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  window.open(`/admin/restaurant/${restaurant.id}`, '_blank');
                  toast.success('Abriendo tabla del restaurante...');
                }}
                className="bg-orange-100 text-orange-700 hover:bg-orange-200"
              >
                <Table className="h-4 w-4 mr-2" />
                Ver Tabla
              </Button>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
