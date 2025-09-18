'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { addUserMappingWithUsername } from '@/lib/userMapping';
// import { sendCredentialsEmail } from '@/lib/emailService';
// import { getAllRestaurantTypes, getRestaurantTypeConfig } from '@/lib/restaurantConfigs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Users, Phone, Mail, LogOut, Settings, Eye, Trash2, RefreshCw, BarChart3, Wand2 } from 'lucide-react';
import UserCredentials from '@/components/admin/UserCredentials';

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

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    twilioNumber: '',
    restaurantType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [showCredentials, setShowCredentials] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState<{
    username: string;
    email: string;
    password: string;
    restaurantName: string;
    restaurantType?: string;
  } | null>(null);
  const router = useRouter();

  // Datos de ejemplo para demostración
  useEffect(() => {
    const mockRestaurants: Restaurant[] = [
      {
        id: '1',
        name: 'Restaurante El Buen Sabor',
        email: 'admin@elbuensabor.com',
        phone: '+1234567890',
        address: 'Calle Principal 123, Ciudad',
        twilioNumber: '+1234567890',
        status: 'active',
        createdAt: '2024-01-15',
      },
      {
        id: '2',
        name: 'La Parrilla del Chef',
        email: 'chef@laparrilla.com',
        phone: '+1234567891',
        address: 'Avenida Central 456, Ciudad',
        twilioNumber: '+1234567891',
        status: 'active',
        createdAt: '2024-01-20',
      },
    ];
    setRestaurants(mockRestaurants);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generar nombre de usuario basado en el nombre del restaurante
      const username = formData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);

      // Generar contraseña temporal
      const tempPassword = 'Temp' + Math.random().toString(36).substring(2, 8) + '!';

      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        tempPassword
      );
      
      // 2. No enviar emails automáticamente - entregar credenciales directamente
      
      // 3. Obtener configuración del tipo de restaurante
      // const restaurantConfig = getRestaurantTypeConfig(formData.restaurantType);
      
      // 4. Agregar al mapeo de usuarios con configuraciones específicas
      const newUserMapping = {
        username,
        email: formData.email,
        role: 'restaurant' as const,
        restaurantId: userCredential.user.uid,
        restaurantName: formData.restaurantName,
        restaurantType: formData.restaurantType,
        airtableBaseId: `app${username}${Date.now()}`,
        airtableUrl: `https://airtable.com/embed/app${username}${Date.now()}/tblReservas?backgroundColor=orange&view=viwReservasHoy`,
        retellConfig: {
          agentId: `agent_${username}_${Date.now()}`,
          apiKey: `retell_key_${username}_${Math.random().toString(36).substring(2, 8)}`,
          voiceId: 'voice_spanish',
          language: 'es-ES'
        },
        twilioConfig: {
          accountSid: `AC_${username}_${Date.now()}`,
          authToken: `auth_${username}_${Math.random().toString(36).substring(2, 8)}`,
          phoneNumber: formData.twilioNumber,
          whatsappNumber: formData.twilioNumber
        }
      };
      
      addUserMappingWithUsername(newUserMapping);
      
      // 4. Agregar a la lista local
      const newRestaurant: Restaurant = {
        id: userCredential.user.uid,
        name: formData.restaurantName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        twilioNumber: formData.twilioNumber,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      setRestaurants(prev => [...prev, newRestaurant]);
      
      toast.success('✅ Restaurante creado exitosamente');
      toast.info('📋 Entrega las credenciales directamente al restaurante');
      toast.success('🎉 El restaurante puede hacer login inmediatamente');
      
      // Mostrar credenciales en modal
      setNewUserCredentials({
        username,
        email: formData.email,
        password: tempPassword,
        restaurantName: formData.restaurantName,
        restaurantType: formData.restaurantType
      });
      setShowCredentials(true);
      
      // Limpiar formulario
      setFormData({
        restaurantName: '',
        email: '',
        phone: '',
        address: '',
        twilioNumber: '',
        restaurantType: '',
      });
    } catch (error: any) {
      console.error('Error al crear restaurante:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este email ya está registrado');
      } else {
        toast.error(error.message || 'Error al crear restaurante');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada exitosamente');
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const toggleRestaurantStatus = (id: string) => {
    setRestaurants(prev => 
      prev.map(restaurant => 
        restaurant.id === id 
          ? { ...restaurant, status: restaurant.status === 'active' ? 'inactive' : 'active' }
          : restaurant
      )
    );
    toast.success('Estado del restaurante actualizado');
  };

  const deleteRestaurant = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este restaurante?')) {
      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== id));
      toast.success('Restaurante eliminado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-orange-600">
                Restaurante IA Plataforma - Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Crear Restaurante
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Gestionar Restaurantes ({restaurants.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Create Restaurant Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Nuevo Restaurante
                  </CardTitle>
                  <CardDescription>
                    Crea una nueva cuenta de restaurante con todas las configuraciones necesarias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                        <Input
                          id="restaurantName"
                          name="restaurantName"
                          placeholder="Mi Restaurante"
                          value={formData.restaurantName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Usuario (Email)</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="admin@restaurante.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="restaurantType">Tipo de Restaurante</Label>
                      <select
                        id="restaurantType"
                        name="restaurantType"
                        value={formData.restaurantType}
                        onChange={(e) => setFormData(prev => ({ ...prev, restaurantType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="">Selecciona un tipo</option>
                        <option value="Familiar">Familiar</option>
                        <option value="Gourmet">Gourmet</option>
                        <option value="Casual">Casual</option>
                        <option value="Fast Food">Fast Food</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono del Restaurante</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="+34 912 345 678"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Este número aparecerá en la gestión de restaurantes
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twilioNumber">Número Twilio</Label>
                        <Input
                          id="twilioNumber"
                          name="twilioNumber"
                          placeholder="+1234567890"
                          value={formData.twilioNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Calle Principal 123, Ciudad"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creando...' : 'Crear Restaurante'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Restaurantes Activos</span>
                    <span className="font-semibold">{restaurants.filter(r => r.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Restaurantes</span>
                    <span className="font-semibold">{restaurants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reservas Hoy</span>
                    <span className="font-semibold">156</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Manage Restaurants Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Lista de Restaurantes
                  </span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Restaurante</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Teléfono</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Creado</th>
                        <th className="text-left py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.map((restaurant) => (
                        <tr key={restaurant.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{restaurant.name}</div>
                              <div className="text-sm text-gray-500">{restaurant.address}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">{restaurant.email}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="font-mono text-sm">{restaurant.phone}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              restaurant.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {restaurant.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{restaurant.createdAt}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRestaurantStatus(restaurant.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteRestaurant(restaurant.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Modal de credenciales */}
      {showCredentials && newUserCredentials && (
        <UserCredentials
          username={newUserCredentials.username}
          email={newUserCredentials.email}
          password={newUserCredentials.password}
          restaurantName={newUserCredentials.restaurantName}
          onClose={() => {
            setShowCredentials(false);
            setNewUserCredentials(null);
          }}
        />
      )}
    </div>
  );
}
