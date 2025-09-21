'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Restaurant } from '@/lib/types/restaurant';

interface PlatformMetrics {
  totalRestaurants: number;
  activeRestaurants: number;
  totalUsers: number;
  totalCalls: number;
  totalRevenue: number;
  totalReservations: number;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  monthlyGrowth: {
    restaurants: number;
    users: number;
    revenue: number;
    calls: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'maintenance' | 'billing' | 'user_report';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  affectedRestaurants?: string[];
  metadata?: any;
}

interface RestaurantSummary extends Restaurant {
  metrics: {
    monthlyRevenue: number;
    totalCalls: number;
    averageRating: number;
    activeUsers: number;
    lastActivity: string;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    nextBilling: string;
    monthlyFee: number;
  };
}

interface SuperAdminDashboardProps {
  adminId: string;
  adminName: string;
}

export default function SuperAdminDashboard({ adminId, adminName }: SuperAdminDashboardProps) {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'restaurants' | 'alerts' | 'analytics' | 'settings'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'cancelled'>('all');

  // Mock data - en producción vendría de la API
  useEffect(() => {
    const mockMetrics: PlatformMetrics = {
      totalRestaurants: 47,
      activeRestaurants: 43,
      totalUsers: 156,
      totalCalls: 12847,
      totalRevenue: 2847650,
      totalReservations: 8934,
      systemHealth: {
        uptime: 99.97,
        responseTime: 145,
        errorRate: 0.03,
        activeConnections: 234
      },
      monthlyGrowth: {
        restaurants: 12.5,
        users: 18.3,
        revenue: 24.7,
        calls: 31.2
      }
    };

    const mockRestaurants: RestaurantSummary[] = [
      {
        id: 'rest_001',
        name: 'La Bella Italia',
        type: 'fine_dining',
        address: 'Polanco, CDMX',
        phone: '+52-55-1234-5678',
        email: 'info@labellaitalia.mx',
        operatingHours: {},
        aiAgent: {
          retellAgentId: 'agent_001',
          phoneNumber: '+52-55-8765-4321',
          voiceSettings: { voice: 'es-ES-Standard-A', speed: 1.0, pitch: 0 },
          language: 'es',
          personality: 'Elegante y profesional',
          customInstructions: []
        },
        menu: { categories: [], specialOffers: [] },
        tables: [],
        staff: [],
        inventory: [],
        notifications: {
          whatsapp: true, email: true, sms: false, push: true,
          emailRecipients: []
        },
        settings: {
          timezone: 'America/Mexico_City', currency: 'MXN', taxRate: 16,
          serviceCharge: 10, reservationPolicy: '', cancellationPolicy: '',
          maxAdvanceBookingDays: 30, minAdvanceBookingHours: 2
        },
        createdAt: '2023-01-15T00:00:00Z',
        updatedAt: '2025-09-21T10:00:00Z',
        createdBy: 'admin',
        status: 'active',
        metrics: {
          monthlyRevenue: 185750,
          totalCalls: 1247,
          averageRating: 4.8,
          activeUsers: 8,
          lastActivity: '2025-09-21T14:30:00Z'
        },
        subscription: {
          plan: 'premium',
          status: 'active',
          nextBilling: '2025-10-15',
          monthlyFee: 2500
        }
      },
      {
        id: 'rest_002',
        name: 'Tacos El Güero',
        type: 'comida_rapida',
        address: 'Roma Norte, CDMX',
        phone: '+52-55-2345-6789',
        email: 'contacto@tacoselguero.mx',
        operatingHours: {},
        aiAgent: {
          retellAgentId: 'agent_002',
          phoneNumber: '+52-55-9876-5432',
          voiceSettings: { voice: 'es-ES-Standard-B', speed: 1.1, pitch: 0 },
          language: 'es',
          personality: 'Casual y amigable',
          customInstructions: []
        },
        menu: { categories: [], specialOffers: [] },
        tables: [],
        staff: [],
        inventory: [],
        notifications: {
          whatsapp: true, email: true, sms: true, push: true,
          emailRecipients: []
        },
        settings: {
          timezone: 'America/Mexico_City', currency: 'MXN', taxRate: 16,
          serviceCharge: 0, reservationPolicy: '', cancellationPolicy: '',
          maxAdvanceBookingDays: 7, minAdvanceBookingHours: 1
        },
        createdAt: '2023-03-20T00:00:00Z',
        updatedAt: '2025-09-21T09:15:00Z',
        createdBy: 'admin',
        status: 'active',
        metrics: {
          monthlyRevenue: 89450,
          totalCalls: 2156,
          averageRating: 4.6,
          activeUsers: 4,
          lastActivity: '2025-09-21T13:45:00Z'
        },
        subscription: {
          plan: 'basic',
          status: 'active',
          nextBilling: '2025-10-20',
          monthlyFee: 999
        }
      },
      {
        id: 'rest_003',
        name: 'Café Central',
        type: 'cafeteria',
        address: 'Centro Histórico, CDMX',
        phone: '+52-55-3456-7890',
        email: 'hola@cafecentral.mx',
        operatingHours: {},
        aiAgent: {
          retellAgentId: 'agent_003',
          phoneNumber: '+52-55-0987-6543',
          voiceSettings: { voice: 'es-ES-Neural2-A', speed: 0.9, pitch: 0 },
          language: 'es',
          personality: 'Relajado y acogedor',
          customInstructions: []
        },
        menu: { categories: [], specialOffers: [] },
        tables: [],
        staff: [],
        inventory: [],
        notifications: {
          whatsapp: false, email: true, sms: false, push: true,
          emailRecipients: []
        },
        settings: {
          timezone: 'America/Mexico_City', currency: 'MXN', taxRate: 16,
          serviceCharge: 5, reservationPolicy: '', cancellationPolicy: '',
          maxAdvanceBookingDays: 14, minAdvanceBookingHours: 2
        },
        createdAt: '2023-06-10T00:00:00Z',
        updatedAt: '2025-09-20T16:20:00Z',
        createdBy: 'admin',
        status: 'suspended',
        metrics: {
          monthlyRevenue: 45200,
          totalCalls: 567,
          averageRating: 4.3,
          activeUsers: 3,
          lastActivity: '2025-09-19T18:30:00Z'
        },
        subscription: {
          plan: 'basic',
          status: 'suspended',
          nextBilling: '2025-10-10',
          monthlyFee: 999
        }
      }
    ];

    const mockAlerts: SystemAlert[] = [
      {
        id: 'alert_001',
        type: 'performance',
        severity: 'high',
        title: 'Alta latencia en servidor principal',
        message: 'El tiempo de respuesta promedio ha aumentado a 340ms en los últimos 30 minutos. Investigando posible causa.',
        timestamp: '2025-09-21T14:15:00Z',
        resolved: false,
        metadata: { server: 'prod-main-01', avgLatency: 340 }
      },
      {
        id: 'alert_002',
        type: 'billing',
        severity: 'medium',
        title: 'Pago pendiente - Café Central',
        message: 'El restaurante "Café Central" tiene un pago pendiente desde hace 5 días. Cuenta suspendida automáticamente.',
        timestamp: '2025-09-21T10:30:00Z',
        resolved: false,
        affectedRestaurants: ['rest_003'],
        metadata: { amount: 999, daysPending: 5 }
      },
      {
        id: 'alert_003',
        type: 'security',
        severity: 'low',
        title: 'Intentos de acceso fallidos',
        message: 'Se detectaron 15 intentos de acceso fallidos desde IP 192.168.1.100 en los últimos 60 minutos.',
        timestamp: '2025-09-21T13:45:00Z',
        resolved: true,
        metadata: { ip: '192.168.1.100', attempts: 15 }
      }
    ];

    setMetrics(mockMetrics);
    setRestaurants(mockRestaurants);
    setAlerts(mockAlerts);
    setLoading(false);
  }, [adminId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || restaurant.subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeAlerts = alerts.filter(alert => !alert.resolved);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🏢 Panel de Administración Central
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión completa de la plataforma - Bienvenido, {adminName}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeAlerts.length > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {activeAlerts.length} alerta{activeAlerts.length > 1 ? 's' : ''}
            </Badge>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                ➕ Nuevo Restaurante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Restaurante</DialogTitle>
              </DialogHeader>
              <form className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre del restaurante</Label>
                    <Input id="name" placeholder="Mi Restaurante" required />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <select id="type" className="w-full p-2 border rounded-md">
                      <option value="restaurante">Restaurante</option>
                      <option value="cafeteria">Cafetería</option>
                      <option value="bar">Bar</option>
                      <option value="comida_rapida">Comida Rápida</option>
                      <option value="fine_dining">Fine Dining</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" placeholder="Calle, Colonia, Ciudad" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="contacto@restaurante.com" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="+52-55-1234-5678" required />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan">Plan de suscripción</Label>
                    <select id="plan" className="w-full p-2 border rounded-md">
                      <option value="basic">Básico - $999/mes</option>
                      <option value="premium">Premium - $2,500/mes</option>
                      <option value="enterprise">Enterprise - $5,000/mes</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language">Idioma principal</Label>
                    <select id="language" className="w-full p-2 border rounded-md">
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
                
                <Button type="submit" className="w-full">
                  Crear Restaurante y Configurar IA
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: '📊 Resumen General', count: null },
          { id: 'restaurants', label: '🏪 Restaurantes', count: metrics.totalRestaurants },
          { id: 'alerts', label: '🚨 Alertas', count: activeAlerts.length },
          { id: 'settings', label: '⚙️ Configuración', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} {tab.count !== null && tab.count > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Resumen General */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Restaurantes Totales</p>
                  <p className="text-3xl font-bold text-blue-900">{metrics.totalRestaurants}</p>
                  <p className="text-blue-600 text-xs">+{metrics.monthlyGrowth.restaurants}% este mes</p>
                </div>
                <div className="text-3xl">🏪</div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(metrics.totalRevenue)}</p>
                  <p className="text-green-600 text-xs">+{metrics.monthlyGrowth.revenue}% este mes</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-700 text-sm font-medium">Llamadas IA</p>
                  <p className="text-3xl font-bold text-purple-900">{metrics.totalCalls.toLocaleString()}</p>
                  <p className="text-purple-600 text-xs">+{metrics.monthlyGrowth.calls}% este mes</p>
                </div>
                <div className="text-3xl">📞</div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-orange-900">{metrics.totalUsers}</p>
                  <p className="text-orange-600 text-xs">+{metrics.monthlyGrowth.users}% este mes</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </Card>
          </div>

          {/* Estado del sistema */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">🖥️ Estado del Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{metrics.systemHealth.uptime}%</div>
                <div className="text-sm text-gray-600">Tiempo de actividad</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{metrics.systemHealth.responseTime}ms</div>
                <div className="text-sm text-gray-600">Tiempo de respuesta</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{metrics.systemHealth.errorRate}%</div>
                <div className="text-sm text-gray-600">Tasa de errores</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{metrics.systemHealth.activeConnections}</div>
                <div className="text-sm text-gray-600">Conexiones activas</div>
              </div>
            </div>
          </Card>

          {/* Alertas recientes */}
          {activeAlerts.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">🚨 Alertas Activas</h3>
              
              <div className="space-y-3">
                {activeAlerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Gestión de Restaurantes */}
      {activeTab === 'restaurants' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">🏪 Gestión de Restaurantes</h2>
            
            <div className="flex items-center gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-2 border rounded-md"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
                <option value="cancelled">Cancelados</option>
              </select>
              
              <Input
                placeholder="Buscar restaurantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRestaurants.map(restaurant => (
              <Card key={restaurant.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{restaurant.type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">{restaurant.address}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(restaurant.subscription.status)}>
                        {restaurant.subscription.status}
                      </Badge>
                      <Badge className={getPlanColor(restaurant.subscription.plan)}>
                        {restaurant.subscription.plan}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Ingresos/mes:</span>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(restaurant.metrics.monthlyRevenue)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Llamadas:</span>
                      <div className="font-semibold">{restaurant.metrics.totalCalls}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Rating:</span>
                      <div className="font-semibold text-yellow-600">
                        ⭐ {restaurant.metrics.averageRating}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Usuarios:</span>
                      <div className="font-semibold">{restaurant.metrics.activeUsers}</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Suscripción:</span>
                      <span className="font-semibold">{formatCurrency(restaurant.subscription.monthlyFee)}/mes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Próximo pago:</span>
                      <span className="text-gray-900">
                        {new Date(restaurant.subscription.nextBilling).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      👁️ Ver Detalles
                    </Button>
                    <Button size="sm" variant="outline">
                      ⚙️
                    </Button>
                    <Button size="sm" variant="outline">
                      📊
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Gestión de Alertas */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">🚨 Centro de Alertas del Sistema</h2>
          
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`p-6 border-l-4 ${
                alert.severity === 'critical' ? 'border-red-500' :
                alert.severity === 'high' ? 'border-orange-500' :
                alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
              } ${alert.resolved ? 'bg-gray-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-500 capitalize">{alert.type.replace('_', ' ')}</span>
                      {alert.resolved && (
                        <Badge className="bg-green-100 text-green-800">Resuelto</Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{alert.title}</h3>
                    <p className="text-gray-700 mb-3">{alert.message}</p>
                    
                    {alert.affectedRestaurants && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">Restaurantes afectados: </span>
                        <span className="text-sm font-medium">{alert.affectedRestaurants.length}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  {!alert.resolved && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        🔍 Investigar
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        ✓ Resolver
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analíticas Avanzadas */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">📈 Analíticas de la Plataforma</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Crecimiento Mensual</h3>
              <div className="space-y-4">
                {Object.entries(metrics.monthlyGrowth).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(value, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-green-600 font-semibold">+{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Top Restaurantes por Ingresos</h3>
              <div className="space-y-3">
                {restaurants
                  .sort((a, b) => b.metrics.monthlyRevenue - a.metrics.monthlyRevenue)
                  .slice(0, 5)
                  .map((restaurant, index) => (
                    <div key={restaurant.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium">{restaurant.name}</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(restaurant.metrics.monthlyRevenue)}
                      </span>
                    </div>
                  ))
                }
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Configuración de la Plataforma */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">⚙️ Configuración de la Plataforma</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Configuración General</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="platformName">Nombre de la plataforma</Label>
                  <Input id="platformName" defaultValue="Restaurante AI Platform" />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Email de soporte</Label>
                  <Input id="supportEmail" defaultValue="soporte@restauranteai.com" />
                </div>
                <div>
                  <Label htmlFor="maxRestaurants">Límite de restaurantes</Label>
                  <Input id="maxRestaurants" type="number" defaultValue="100" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Configuración de IA</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="retellApiKey">Retell API Key</Label>
                  <Input id="retellApiKey" type="password" placeholder="••••••••••••••••" />
                </div>
                <div>
                  <Label htmlFor="defaultLanguage">Idioma por defecto</Label>
                  <select id="defaultLanguage" className="w-full p-2 border rounded-md">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="maxCallsPerMonth">Límite de llamadas por mes</Label>
                  <Input id="maxCallsPerMonth" type="number" defaultValue="10000" />
                </div>
              </div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Planes de Suscripción</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Básico', price: 999, features: ['1 Restaurante', '1000 Llamadas/mes', 'Soporte por Email'] },
                { name: 'Premium', price: 2500, features: ['3 Restaurantes', '5000 Llamadas/mes', 'Soporte Prioritario', 'Analíticas Avanzadas'] },
                { name: 'Enterprise', price: 5000, features: ['Restaurantes Ilimitados', 'Llamadas Ilimitadas', 'Soporte 24/7', 'API Personalizada'] }
              ].map(plan => (
                <div key={plan.name} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{plan.name}</h4>
                  <div className="text-2xl font-bold text-green-600 mb-3">
                    {formatCurrency(plan.price)}/mes
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
