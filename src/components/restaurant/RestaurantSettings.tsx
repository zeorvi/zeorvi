'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Restaurant, MenuItem, MenuCategory, SpecialOffer } from '@/lib/types/restaurant';

interface RestaurantSettingsProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

export default function RestaurantSettings({ restaurantId, restaurantName, restaurantType }: RestaurantSettingsProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'basic' | 'hours' | 'menu' | 'ai' | 'notifications'>('basic');
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const mockRestaurant: Restaurant = {
      id: restaurantId,
      name: restaurantName,
      type: restaurantType as any,
      address: 'Av. Reforma 123, Col. Centro, CDMX',
      phone: '+52-55-1234-5678',
      email: 'contacto@restaurante.com',
      website: 'https://www.restaurante.com',
      
      operatingHours: {
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '23:00', closed: false },
        saturday: { open: '10:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '21:00', closed: false }
      },
      
      aiAgent: {
        retellAgentId: 'agent_12345',
        phoneNumber: '+52-55-8765-4321',
        voiceSettings: {
          voice: 'es-ES-Standard-A',
          speed: 1.0,
          pitch: 0
        },
        language: 'es',
        personality: 'Amigable, profesional y servicial. Siempre saluda con entusiasmo y ayuda a los clientes.',
        customInstructions: [
          'Siempre preguntar por alergias alimentarias',
          'Ofrecer opciones vegetarianas cuando sea apropiado',
          'Informar sobre tiempos de espera estimados',
          'Confirmar todos los detalles de la reserva'
        ]
      },
      
      menu: {
        categories: [
          {
            id: 'cat_001',
            name: 'Entradas',
            description: 'Deliciosos aperitivos para comenzar',
            displayOrder: 1,
            active: true,
            items: [
              {
                id: 'item_001',
                name: 'Bruschetta Italiana',
                description: 'Pan tostado con tomate fresco, albahaca y mozzarella',
                price: 120,
                category: 'cat_001',
                allergens: ['gluten', 'lactosa'],
                dietary: ['vegetarian'],
                available: true,
                preparationTime: 10,
                ingredients: ['Pan', 'Tomate', 'Albahaca', 'Mozzarella', 'Aceite de oliva']
              }
            ]
          },
          {
            id: 'cat_002',
            name: 'Platos Principales',
            description: 'Nuestras especialidades de la casa',
            displayOrder: 2,
            active: true,
            items: [
              {
                id: 'item_002',
                name: 'Pizza Margherita',
                description: 'Pizza clásica con tomate, mozzarella y albahaca fresca',
                price: 250,
                category: 'cat_002',
                allergens: ['gluten', 'lactosa'],
                dietary: ['vegetarian'],
                available: true,
                preparationTime: 15,
                ingredients: ['Masa de pizza', 'Salsa de tomate', 'Mozzarella', 'Albahaca']
              }
            ]
          }
        ],
        specialOffers: [
          {
            id: 'offer_001',
            name: 'Happy Hour',
            description: '2x1 en bebidas seleccionadas',
            type: 'happy_hour',
            discount: 50,
            validFrom: '2025-09-01',
            validTo: '2025-12-31',
            conditions: ['Válido de lunes a viernes', 'De 17:00 a 19:00', 'Solo bebidas alcohólicas'],
            active: true
          }
        ]
      },
      
      tables: [],
      staff: [],
      inventory: [],
      
      notifications: {
        whatsapp: true,
        email: true,
        sms: false,
        push: true,
        slackWebhook: '',
        emailRecipients: ['gerente@restaurante.com', 'chef@restaurante.com']
      },
      
      settings: {
        timezone: 'America/Mexico_City',
        currency: 'MXN',
        taxRate: 16,
        serviceCharge: 10,
        reservationPolicy: 'Las reservas pueden cancelarse hasta 2 horas antes.',
        cancellationPolicy: 'Cancelaciones tardías pueden incurrir en cargo del 50%.',
        maxAdvanceBookingDays: 30,
        minAdvanceBookingHours: 2
      },
      
      createdAt: '2023-01-15T00:00:00Z',
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      status: 'active'
    };

    setRestaurant(mockRestaurant);
    setLoading(false);
  }, [restaurantId, restaurantName, restaurantType]);

  const handleSaveBasicInfo = (formData: FormData) => {
    if (!restaurant) return;
    
    const updatedRestaurant = {
      ...restaurant,
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      updatedAt: new Date().toISOString()
    };
    
    setRestaurant(updatedRestaurant);
    alert('Información básica actualizada correctamente');
  };

  const handleSaveHours = (day: string, hours: { open: string; close: string; closed: boolean }) => {
    if (!restaurant) return;
    
    const updatedRestaurant = {
      ...restaurant,
      operatingHours: {
        ...restaurant.operatingHours,
        [day]: hours
      },
      updatedAt: new Date().toISOString()
    };
    
    setRestaurant(updatedRestaurant);
  };

  const handleSaveAISettings = (formData: FormData) => {
    if (!restaurant) return;
    
    const updatedRestaurant = {
      ...restaurant,
      aiAgent: {
        ...restaurant.aiAgent,
        personality: formData.get('personality') as string,
        language: formData.get('language') as 'es' | 'en' | 'fr' | 'it',
        voiceSettings: {
          ...restaurant.aiAgent.voiceSettings,
          voice: formData.get('voice') as string,
          speed: parseFloat(formData.get('speed') as string),
          pitch: parseFloat(formData.get('pitch') as string)
        }
      },
      updatedAt: new Date().toISOString()
    };
    
    setRestaurant(updatedRestaurant);
    alert('Configuración de IA actualizada correctamente');
  };

  const handleAddMenuItem = (categoryId: string, item: Omit<MenuItem, 'id'>) => {
    if (!restaurant) return;
    
    const newItem: MenuItem = {
      ...item,
      id: `item_${Date.now()}`
    };
    
    const updatedCategories = restaurant.menu.categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    );
    
    const updatedRestaurant = {
      ...restaurant,
      menu: {
        ...restaurant.menu,
        categories: updatedCategories
      },
      updatedAt: new Date().toISOString()
    };
    
    setRestaurant(updatedRestaurant);
  };

  const handleUpdateMenuItem = (categoryId: string, updatedItem: MenuItem) => {
    if (!restaurant) return;
    
    const updatedCategories = restaurant.menu.categories.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            items: cat.items.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            )
          }
        : cat
    );
    
    const updatedRestaurant = {
      ...restaurant,
      menu: {
        ...restaurant.menu,
        categories: updatedCategories
      },
      updatedAt: new Date().toISOString()
    };
    
    setRestaurant(updatedRestaurant);
    setEditingMenuItem(null);
  };

  const handleDeleteMenuItem = (categoryId: string, itemId: string) => {
    if (!restaurant) return;
    
    const updatedCategories = restaurant.menu.categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
        : cat
    );
    
    const updatedRestaurant = {
      ...restaurant,
      menu: {
        ...restaurant.menu,
        categories: updatedCategories
      },
      updatedAt: new Date().toISOString()
    };
    
    setRestaurant(updatedRestaurant);
  };

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return days[day] || day;
  };

  if (loading || !restaurant) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            ⚙️ Configuración del Restaurante
          </h1>
          <p className="text-gray-600 mt-1">
            Administra la configuración de {restaurant.name}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button className="bg-green-600 hover:bg-green-700">
            💾 Guardar Todo
          </Button>
          <Button variant="outline">
            📋 Exportar Configuración
          </Button>
        </div>
      </div>

      {/* Navegación por secciones */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'basic', label: '🏪 Información Básica' },
          { id: 'hours', label: '🕒 Horarios' },
          { id: 'menu', label: '🍽️ Menú' },
          { id: 'ai', label: '🤖 IA Asistente' },
          { id: 'notifications', label: '🔔 Notificaciones' }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Información Básica */}
      {activeSection === 'basic' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">🏪 Información Básica</h2>
          
          <form action={handleSaveBasicInfo} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nombre del restaurante</Label>
                <Input id="name" name="name" defaultValue={restaurant.name} required />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo de establecimiento</Label>
                <select id="type" name="type" className="w-full p-2 border rounded-md" defaultValue={restaurant.type}>
                  <option value="restaurante">Restaurante</option>
                  <option value="cafeteria">Cafetería</option>
                  <option value="bar">Bar</option>
                  <option value="comida_rapida">Comida Rápida</option>
                  <option value="fine_dining">Fine Dining</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección completa</Label>
              <Input id="address" name="address" defaultValue={restaurant.address} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={restaurant.phone} required />
              </div>
              
              <div>
                <Label htmlFor="email">Email de contacto</Label>
                <Input id="email" name="email" type="email" defaultValue={restaurant.email} required />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Sitio web (opcional)</Label>
              <Input id="website" name="website" type="url" defaultValue={restaurant.website} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="timezone">Zona horaria</Label>
                <select id="timezone" name="timezone" className="w-full p-2 border rounded-md" defaultValue={restaurant.settings.timezone}>
                  <option value="America/Mexico_City">México (GMT-6)</option>
                  <option value="America/New_York">Nueva York (GMT-5)</option>
                  <option value="Europe/Madrid">Madrid (GMT+1)</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <select id="currency" name="currency" className="w-full p-2 border rounded-md" defaultValue={restaurant.settings.currency}>
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="taxRate">Tasa de impuestos (%)</Label>
                <Input id="taxRate" name="taxRate" type="number" step="0.1" defaultValue={restaurant.settings.taxRate} />
              </div>
            </div>

            <Button type="submit" className="w-full">
              💾 Guardar Información Básica
            </Button>
          </form>
        </Card>
      )}

      {/* Horarios de Operación */}
      {activeSection === 'hours' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">🕒 Horarios de Operación</h2>
          
          <div className="space-y-4">
            {Object.entries(restaurant.operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-24">
                  <span className="font-medium">{getDayName(day)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${day}-closed`}
                    checked={hours.closed}
                    onChange={(e) => handleSaveHours(day, { ...hours, closed: e.target.checked })}
                  />
                  <Label htmlFor={`${day}-closed`}>Cerrado</Label>
                </div>
                
                {!hours.closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label>Abre:</Label>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleSaveHours(day, { ...hours, open: e.target.value })}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label>Cierra:</Label>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleSaveHours(day, { ...hours, close: e.target.value })}
                        className="w-32"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">⚠️ Políticas de Reserva</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="reservationPolicy">Política de reservas</Label>
                <textarea 
                  id="reservationPolicy"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  defaultValue={restaurant.settings.reservationPolicy}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxAdvanceBooking">Días máximos de anticipación</Label>
                  <Input 
                    id="maxAdvanceBooking"
                    type="number"
                    defaultValue={restaurant.settings.maxAdvanceBookingDays}
                  />
                </div>
                
                <div>
                  <Label htmlFor="minAdvanceBooking">Horas mínimas de anticipación</Label>
                  <Input 
                    id="minAdvanceBooking"
                    type="number"
                    defaultValue={restaurant.settings.minAdvanceBookingHours}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Gestión de Menú */}
      {activeSection === 'menu' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">🍽️ Gestión de Menú</h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  ➕ Agregar Plato
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Plato</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const categoryId = restaurant.menu.categories[0]?.id;
                  if (categoryId) {
                    handleAddMenuItem(categoryId, {
                      name: formData.get('name') as string,
                      description: formData.get('description') as string,
                      price: parseFloat(formData.get('price') as string),
                      category: categoryId,
                      allergens: (formData.get('allergens') as string).split(',').map(a => a.trim()),
                      dietary: [],
                      available: true,
                      preparationTime: parseInt(formData.get('preparationTime') as string),
                      ingredients: (formData.get('ingredients') as string).split(',').map(i => i.trim())
                    });
                  }
                }} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre del plato</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="price">Precio</Label>
                      <Input id="price" name="price" type="number" step="0.01" required />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <textarea id="description" name="description" className="w-full p-2 border rounded-md" rows={3} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preparationTime">Tiempo de preparación (min)</Label>
                      <Input id="preparationTime" name="preparationTime" type="number" />
                    </div>
                    <div>
                      <Label htmlFor="allergens">Alérgenos (separados por coma)</Label>
                      <Input id="allergens" name="allergens" placeholder="gluten, lactosa, nueces" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="ingredients">Ingredientes (separados por coma)</Label>
                    <Input id="ingredients" name="ingredients" placeholder="tomate, mozzarella, albahaca" />
                  </div>
                  
                  <Button type="submit" className="w-full">Agregar Plato</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-6">
            {restaurant.menu.categories.map(category => (
              <div key={category.id} className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.name}</h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                
                <div className="space-y-3">
                  {category.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <span className="font-bold text-green-600">${item.price}</span>
                          {!item.available && (
                            <Badge className="bg-red-100 text-red-800">No disponible</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>⏱️ {item.preparationTime} min</span>
                          {item.allergens.length > 0 && (
                            <span>⚠️ {item.allergens.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingMenuItem(item)}
                        >
                          ✏️
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteMenuItem(category.id, item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Configuración de IA */}
      {activeSection === 'ai' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">🤖 Configuración del Asistente IA</h2>
          
          <form action={handleSaveAISettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="language">Idioma principal</Label>
                <select id="language" name="language" className="w-full p-2 border rounded-md" defaultValue={restaurant.aiAgent.language}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="voice">Voz del asistente</Label>
                <select id="voice" name="voice" className="w-full p-2 border rounded-md" defaultValue={restaurant.aiAgent.voiceSettings.voice}>
                  <option value="es-ES-Standard-A">Español - Mujer (Estándar)</option>
                  <option value="es-ES-Standard-B">Español - Hombre (Estándar)</option>
                  <option value="es-ES-Neural2-A">Español - Mujer (Neural)</option>
                  <option value="es-ES-Neural2-B">Español - Hombre (Neural)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="speed">Velocidad de habla</Label>
                <Input 
                  id="speed" 
                  name="speed" 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1"
                  defaultValue={restaurant.aiAgent.voiceSettings.speed}
                />
                <span className="text-sm text-gray-500">0.5x - 2.0x</span>
              </div>
              
              <div>
                <Label htmlFor="pitch">Tono de voz</Label>
                <Input 
                  id="pitch" 
                  name="pitch" 
                  type="range" 
                  min="-20" 
                  max="20" 
                  step="1"
                  defaultValue={restaurant.aiAgent.voiceSettings.pitch}
                />
                <span className="text-sm text-gray-500">-20 a +20</span>
              </div>
            </div>

            <div>
              <Label htmlFor="personality">Personalidad del asistente</Label>
              <textarea 
                id="personality"
                name="personality"
                className="w-full p-2 border rounded-md"
                rows={4}
                defaultValue={restaurant.aiAgent.personality}
                placeholder="Describe cómo debe comportarse el asistente IA..."
              />
            </div>

            <div>
              <Label>Instrucciones personalizadas</Label>
              <div className="space-y-2 mt-2">
                {restaurant.aiAgent.customInstructions.map((instruction, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={instruction} readOnly className="flex-1" />
                    <Button size="sm" variant="outline" type="button">🗑️</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" className="w-full">
                  ➕ Agregar Instrucción
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📞 Información de Contacto IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Número de teléfono IA</Label>
                  <Input value={restaurant.aiAgent.phoneNumber} readOnly />
                </div>
                <div>
                  <Label>ID del Agente Retell</Label>
                  <Input value={restaurant.aiAgent.retellAgentId} readOnly />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              💾 Guardar Configuración de IA
            </Button>
          </form>
        </Card>
      )}

      {/* Configuración de Notificaciones */}
      {activeSection === 'notifications' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">🔔 Configuración de Notificaciones</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Canales de Notificación</h3>
                
                {[
                  { key: 'email', label: '📧 Email', enabled: restaurant.notifications.email },
                  { key: 'whatsapp', label: '📱 WhatsApp', enabled: restaurant.notifications.whatsapp },
                  { key: 'sms', label: '💬 SMS', enabled: restaurant.notifications.sms },
                  { key: 'push', label: '🔔 Notificaciones Push', enabled: restaurant.notifications.push }
                ].map(channel => (
                  <div key={channel.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{channel.label}</span>
                    <input 
                      type="checkbox" 
                      defaultChecked={channel.enabled}
                      className="toggle"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Destinatarios de Email</h3>
                <div className="space-y-2">
                  {restaurant.notifications.emailRecipients.map((email, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={email} readOnly className="flex-1" />
                      <Button size="sm" variant="outline">🗑️</Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    ➕ Agregar Email
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-3">⚙️ Configuración Avanzada</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="slackWebhook">Webhook de Slack (opcional)</Label>
                  <Input 
                    id="slackWebhook"
                    placeholder="https://hooks.slack.com/services/..."
                    defaultValue={restaurant.notifications.slackWebhook}
                  />
                </div>
              </div>
            </div>

            <Button className="w-full">
              💾 Guardar Configuración de Notificaciones
            </Button>
          </div>
        </Card>
      )}

      {/* Modal de edición de elemento del menú */}
      {editingMenuItem && (
        <Dialog open={!!editingMenuItem} onOpenChange={() => setEditingMenuItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar {editingMenuItem.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const updatedItem: MenuItem = {
                ...editingMenuItem,
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                price: parseFloat(formData.get('price') as string),
                preparationTime: parseInt(formData.get('preparationTime') as string),
                available: (formData.get('available') as string) === 'true'
              };
              handleUpdateMenuItem(editingMenuItem.category, updatedItem);
            }} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del plato</Label>
                  <Input id="name" name="name" defaultValue={editingMenuItem.name} required />
                </div>
                <div>
                  <Label htmlFor="price">Precio</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingMenuItem.price} required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea 
                  id="description" 
                  name="description" 
                  className="w-full p-2 border rounded-md" 
                  rows={3} 
                  defaultValue={editingMenuItem.description}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preparationTime">Tiempo de preparación (min)</Label>
                  <Input 
                    id="preparationTime" 
                    name="preparationTime" 
                    type="number" 
                    defaultValue={editingMenuItem.preparationTime}
                  />
                </div>
                <div>
                  <Label htmlFor="available">Disponibilidad</Label>
                  <select 
                    id="available" 
                    name="available" 
                    className="w-full p-2 border rounded-md"
                    defaultValue={editingMenuItem.available.toString()}
                  >
                    <option value="true">Disponible</option>
                    <option value="false">No disponible</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Guardar Cambios</Button>
                <Button type="button" variant="outline" onClick={() => setEditingMenuItem(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
