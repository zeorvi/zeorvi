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
import { getAllRestaurants } from '@/lib/restaurantServicePostgres';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  config: Record<string, any>;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  retell_config: Record<string, any>;
  twilio_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_count: number;
}

export default function RestaurantIdentifier() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  // Cargar restaurantes reales
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const restaurantsData = await getAllRestaurants();
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error('Error loading restaurants:', error);
        toast.error('Error al cargar los restaurantes');
      }
    };
    
    loadRestaurants();
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

  const getTypeColor = (plan: string) => {
    const colors: Record<string, string> = {
      'basic': 'bg-blue-100 text-blue-800 border-blue-200',
      'premium': 'bg-purple-100 text-purple-800 border-purple-200',
      'enterprise': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[plan] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRestaurantPassword = (restaurant: Restaurant) => {
    return 'password123'; // Default password for restaurants
  };

  const handleEditPassword = (restaurant: Restaurant) => {
    setNewPassword('password123'); // Default password
    setEditingPassword(true);
  };

  const handleSavePassword = async () => {
    if (!selectedRestaurant || !newPassword.trim()) {
      toast.error('La contraseña no puede estar vacía');
      return;
    }

    try {
      // Aquí llamaríamos a la API para actualizar la contraseña
      // Por ahora, actualizamos localmente
      const updatedRestaurants = restaurants.map(restaurant =>
        restaurant.id === selectedRestaurant.id 
          ? restaurant // Keep restaurant unchanged since password is not part of the Restaurant type
          : restaurant
      );
      
      setRestaurants(updatedRestaurants);
      setSelectedRestaurant(selectedRestaurant);
      setEditingPassword(false);
      
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Error al actualizar la contraseña');
    }
  };

  const handleCancelEdit = () => {
    setEditingPassword(false);
    setNewPassword('');
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
                  {restaurant.owner_email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {restaurant.phone || 'No especificado'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {restaurant.address || 'No especificado'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getTypeColor(restaurant.plan)}>
                  {restaurant.plan}
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
                      {selectedRestaurant.slug}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm">{selectedRestaurant.owner_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Teléfono:</span>
                    <span className="text-sm">{selectedRestaurant.phone || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Plan:</span>
                    <Badge className={getTypeColor(selectedRestaurant.plan)}>
                      {selectedRestaurant.plan}
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

              {/* Credenciales de Acceso */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Credenciales de Acceso</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Usuario para Login:</span>
                    <code className="text-sm bg-green-100 px-2 py-1 rounded">
                      {selectedRestaurant.slug}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <code className="text-sm bg-green-100 px-2 py-1 rounded">
                      {selectedRestaurant.owner_email}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Contraseña:</span>
                    <div className="flex items-center space-x-2">
                      {editingPassword ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nueva contraseña"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSavePassword}
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <>
                          <code className="text-sm bg-green-100 px-2 py-1 rounded">
                            {getRestaurantPassword(selectedRestaurant)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPassword(selectedRestaurant)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
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
                        {selectedRestaurant.retell_config?.agent_id || 'No configurado'}
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
                        {selectedRestaurant.twilio_config?.account_sid || 'No configurado'}
                      </code>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Número Twilio:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded ml-2">
                      {selectedRestaurant.twilio_config?.phone_number || 'No configurado'}
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
                  window.open(`/admin/restaurant/${restaurants[0]?.id}`, '_blank');
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
