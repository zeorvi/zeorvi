'use client';

import { useState, useEffect } from 'react';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Bell
} from 'lucide-react';

interface RestaurantConfig {
  basicInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    description: string;
  };
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    reservationReminders: boolean;
    newReservationAlerts: boolean;
  };
}

export default function ConfigurationManagement({ 
  restaurantId, 
  restaurantName, 
  restaurantType 
}: { 
  restaurantId: string; 
  restaurantName: string; 
  restaurantType: string; 
}) {
  
  const [config, setConfig] = useState<RestaurantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'notifications'>('basic');

  // Cargar configuración real del restaurante
  useEffect(() => {
    const loadRestaurantConfig = async () => {
      setIsLoading(true);
      
      try {
        console.log('🔍 Loading restaurant config for:', restaurantId);
        const restaurantData = await getRestaurantById(restaurantId);
        
        if (restaurantData) {
          console.log('✅ Restaurant data loaded for config:', restaurantData);
          
          const dynamicConfig: RestaurantConfig = {
            basicInfo: {
              name: restaurantData.name,
              phone: restaurantData.phone || '+34 000 000 000',
              email: restaurantData.email,
              address: restaurantData.address || 'Dirección no especificada',
              description: `Restaurante tradicional - ${restaurantData.name}`
            },
            operatingHours: {
              monday: { open: '12:00', close: '23:00', closed: false },
              tuesday: { open: '12:00', close: '23:00', closed: false },
              wednesday: { open: '12:00', close: '23:00', closed: false },
              thursday: { open: '12:00', close: '23:00', closed: false },
              friday: { open: '12:00', close: '00:00', closed: false },
              saturday: { open: '12:00', close: '00:00', closed: false },
              sunday: { open: '12:00', close: '22:00', closed: false }
            },
            notifications: {
              emailNotifications: true,
              smsNotifications: true,
              reservationReminders: true,
              newReservationAlerts: true
            }
          };
          
          setConfig(dynamicConfig);
        } else {
          console.log('⚠️ No restaurant data found, using fallback');
          // Fallback config
          const fallbackConfig: RestaurantConfig = {
            basicInfo: {
              name: restaurantName,
              phone: '+34 000 000 000',
              email: 'info@restaurante.com',
              address: 'Dirección no especificada',
              description: 'Restaurante en configuración'
            },
            operatingHours: {
              monday: { open: '12:00', close: '23:00', closed: false },
              tuesday: { open: '12:00', close: '23:00', closed: false },
              wednesday: { open: '12:00', close: '23:00', closed: false },
              thursday: { open: '12:00', close: '23:00', closed: false },
              friday: { open: '12:00', close: '00:00', closed: false },
              saturday: { open: '12:00', close: '00:00', closed: false },
              sunday: { open: '12:00', close: '22:00', closed: false }
            },
            notifications: {
              emailNotifications: true,
              smsNotifications: true,
              reservationReminders: true,
              newReservationAlerts: true
            }
          };
          
          setConfig(fallbackConfig);
        }
      } catch (error) {
        console.error('❌ Error loading restaurant config:', error);
        // Usar configuración de fallback
        const fallbackConfig: RestaurantConfig = {
          basicInfo: {
            name: restaurantName,
            phone: '+34 000 000 000',
            email: 'info@restaurante.com',
            address: 'Dirección no especificada',
            description: 'Restaurante en configuración'
          },
          operatingHours: {
            monday: { open: '12:00', close: '23:00', closed: false },
            tuesday: { open: '12:00', close: '23:00', closed: false },
            wednesday: { open: '12:00', close: '23:00', closed: false },
            thursday: { open: '12:00', close: '23:00', closed: false },
            friday: { open: '12:00', close: '00:00', closed: false },
            saturday: { open: '12:00', close: '00:00', closed: false },
            sunday: { open: '12:00', close: '22:00', closed: false }
          },
          notifications: {
            emailNotifications: true,
            smsNotifications: true,
            reservationReminders: true,
            newReservationAlerts: true
          }
        };
        
        setConfig(fallbackConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantConfig();
  }, [restaurantId, restaurantName, restaurantType]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false);
      console.log('Configuración guardada:', config);
    }, 2000);
  };

  const handleInputChange = (section: keyof RestaurantConfig, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'basic', label: 'Información Básica', icon: Settings },
    { id: 'hours', label: 'Horarios', icon: Clock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
        <p className="text-gray-600">Cargando configuración...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar configuración</h3>
        <p className="text-gray-600">Intenta recargar la página</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión &gt; Configuración</h1>
          <p className="text-gray-600 mt-1">
            Configura los detalles y ajustes del restaurante
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-orange-600">
            {restaurantType}
          </Badge>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las Tabs */}
      <div className="space-y-6">
        {/* Información Básica */}
        {activeTab === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle>Información del Restaurante</CardTitle>
              <CardDescription>
                Datos básicos y contacto del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Restaurante</Label>
                  <Input
                    id="name"
                    value={config.basicInfo.name}
                    onChange={(e) => handleInputChange('basicInfo', 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="phone"
                      value={config.basicInfo.phone}
                      onChange={(e) => handleInputChange('basicInfo', 'phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={config.basicInfo.email}
                      onChange={(e) => handleInputChange('basicInfo', 'email', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="address"
                      value={config.basicInfo.address}
                      onChange={(e) => handleInputChange('basicInfo', 'address', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={config.basicInfo.description}
                  onChange={(e) => handleInputChange('basicInfo', 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Horarios */}
        {activeTab === 'hours' && (
          <Card>
            <CardHeader>
              <CardTitle>Horarios de Operación</CardTitle>
              <CardDescription>
                Configura los horarios de apertura y cierre del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(config.operatingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => handleInputChange('operatingHours', day, {
                          ...hours,
                          closed: !e.target.checked
                        })}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="font-medium capitalize">{day}</span>
                    </div>
                    {!hours.closed && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleInputChange('operatingHours', day, {
                            ...hours,
                            open: e.target.value
                          })}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span>a</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleInputChange('operatingHours', day, {
                            ...hours,
                            close: e.target.value
                          })}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notificaciones */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>
                Gestiona cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(config.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">
                        {key === 'emailNotifications' && 'Notificaciones por Email'}
                        {key === 'smsNotifications' && 'Notificaciones por SMS'}
                        {key === 'reservationReminders' && 'Recordatorios de Reservas'}
                        {key === 'newReservationAlerts' && 'Alertas de Nuevas Reservas'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}