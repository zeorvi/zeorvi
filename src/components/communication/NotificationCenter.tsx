'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai_insight' | 'reservation' | 'inventory' | 'staff';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  actions?: {
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }[];
  metadata?: {
    restaurantId?: string;
    userId?: string;
    orderId?: string;
    reservationId?: string;
    tableId?: string;
    [key: string]: any;
  };
  channels: ('push' | 'email' | 'sms' | 'whatsapp' | 'slack')[];
  expiresAt?: string;
}

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  slack: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    [key: string]: {
      enabled: boolean;
      channels: string[];
      priority: string;
    };
  };
}

interface NotificationCenterProps {
  restaurantId: string;
  userId: string;
}

export default function NotificationCenter({ restaurantId, userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'today'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Mock data - en producción vendría de la API
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 'notif_001',
        title: '🤖 Nuevo Insight de IA',
        message: 'Se detectó un patrón de cancelaciones los viernes. El asistente IA recomienda implementar confirmaciones automáticas.',
        type: 'ai_insight',
        priority: 'high',
        timestamp: '2025-09-21T14:30:00Z',
        read: false,
        actionRequired: true,
        actions: [
          { label: 'Ver Detalles', action: 'view_insight', style: 'primary' },
          { label: 'Implementar', action: 'implement_suggestion', style: 'secondary' },
          { label: 'Descartar', action: 'dismiss', style: 'danger' }
        ],
        channels: ['push', 'email'],
        metadata: { insightId: 'insight_001' }
      },
      {
        id: 'notif_002',
        title: '📦 Stock Crítico',
        message: 'Queso mozzarella: Solo quedan 0.5kg. El sistema ha enviado automáticamente una orden de reabastecimiento.',
        type: 'inventory',
        priority: 'urgent',
        timestamp: '2025-09-21T13:45:00Z',
        read: false,
        actionRequired: false,
        channels: ['push', 'sms', 'whatsapp'],
        metadata: { itemId: 'inv_002', currentStock: 0.5 }
      },
      {
        id: 'notif_003',
        title: '📅 Reserva Confirmada',
        message: 'Nueva reserva para 6 personas a las 20:00. Cliente: María García (+52-555-1234). Mesa asignada: M3.',
        type: 'reservation',
        priority: 'medium',
        timestamp: '2025-09-21T12:15:00Z',
        read: true,
        actionRequired: false,
        channels: ['push'],
        metadata: { reservationId: 'res_001', clientName: 'María García', tableId: 'M3' }
      },
      {
        id: 'notif_004',
        title: '👥 Empleado Llegó Tarde',
        message: 'Juan Pérez llegó 15 minutos tarde a su turno. Esta es su segunda tardanza esta semana.',
        type: 'staff',
        priority: 'medium',
        timestamp: '2025-09-21T14:15:00Z',
        read: false,
        actionRequired: true,
        actions: [
          { label: 'Hablar con Empleado', action: 'talk_employee', style: 'primary' },
          { label: 'Registrar Incidencia', action: 'create_incident', style: 'secondary' }
        ],
        channels: ['push', 'email'],
        metadata: { employeeId: 'emp_002', lateMinutes: 15 }
      },
      {
        id: 'notif_005',
        title: '💰 Meta de Ventas Alcanzada',
        message: '¡Felicidades! Has alcanzado el 105% de tu meta diaria de ventas ($15,750 de $15,000).',
        type: 'success',
        priority: 'low',
        timestamp: '2025-09-21T16:00:00Z',
        read: false,
        actionRequired: false,
        channels: ['push', 'email'],
        metadata: { actualSales: 15750, targetSales: 15000 }
      },
      {
        id: 'notif_006',
        title: '🔧 Mantenimiento Programado',
        message: 'Recordatorio: Mantenimiento de sistema POS programado para mañana a las 02:00. Duración estimada: 30 minutos.',
        type: 'info',
        priority: 'low',
        timestamp: '2025-09-21T10:00:00Z',
        read: true,
        actionRequired: false,
        channels: ['email'],
        expiresAt: '2025-09-22T02:30:00Z'
      }
    ];

    const mockSettings: NotificationSettings = {
      push: true,
      email: true,
      sms: false,
      whatsapp: true,
      slack: false,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00'
      },
      categories: {
        ai_insight: { enabled: true, channels: ['push', 'email'], priority: 'high' },
        reservation: { enabled: true, channels: ['push'], priority: 'medium' },
        inventory: { enabled: true, channels: ['push', 'sms', 'whatsapp'], priority: 'high' },
        staff: { enabled: true, channels: ['push', 'email'], priority: 'medium' },
        success: { enabled: true, channels: ['push'], priority: 'low' },
        info: { enabled: true, channels: ['email'], priority: 'low' }
      }
    };

    setNotifications(mockNotifications);
    setSettings(mockSettings);
    setLoading(false);
  }, [restaurantId, userId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai_insight': return '🤖';
      case 'reservation': return '📅';
      case 'inventory': return '📦';
      case 'staff': return '👥';
      case 'success': return '🎉';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ai_insight': return 'border-l-purple-500 bg-purple-50';
      case 'reservation': return 'border-l-blue-500 bg-blue-50';
      case 'inventory': return 'border-l-orange-500 bg-orange-50';
      case 'staff': return 'border-l-green-500 bg-green-50';
      case 'success': return 'border-l-emerald-500 bg-emerald-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} h`;
    } else {
      return date.toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleNotificationAction = (notificationId: string, action: string) => {
    console.log(`Executing action: ${action} for notification: ${notificationId}`);
    
    // Mock implementation - en producción ejecutaría la acción real
    switch (action) {
      case 'view_insight':
        alert('Abriendo detalles del insight...');
        break;
      case 'implement_suggestion':
        alert('Implementando sugerencia de IA...');
        break;
      case 'dismiss':
        handleDeleteNotification(notificationId);
        break;
      case 'talk_employee':
        alert('Abriendo perfil del empleado...');
        break;
      case 'create_incident':
        alert('Creando nueva incidencia...');
        break;
      default:
        console.log('Acción no reconocida');
    }
    
    handleMarkAsRead(notificationId);
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !notif.read) ||
      (filter === 'urgent' && notif.priority === 'urgent') ||
      (filter === 'today' && new Date(notif.timestamp).toDateString() === new Date().toDateString());
    
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || notif.type === selectedType;
    
    return matchesFilter && matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🔔 Centro de Notificaciones
          </h1>
          <p className="text-gray-600 mt-1">
            Mantente al día con todas las alertas y actualizaciones
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} sin leer
            </Badge>
          )}
          
          {urgentCount > 0 && (
            <Badge className="bg-orange-500 text-white animate-pulse">
              {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
            </Badge>
          )}
          
          <Button onClick={handleMarkAllAsRead} variant="outline">
            ✓ Marcar Todo Leído
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                ⚙️ Configurar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuración de Notificaciones</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Canales de Notificación</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {settings && Object.entries(settings).filter(([key]) => 
                      ['push', 'email', 'sms', 'whatsapp', 'slack'].includes(key)
                    ).map(([channel, enabled]) => (
                      <div key={channel} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{channel === 'push' ? '📱' : channel === 'email' ? '📧' : channel === 'sms' ? '💬' : channel === 'whatsapp' ? '📲' : '💼'}</span>
                          <span className="capitalize">{channel}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked={enabled as boolean}
                          className="toggle"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Horario Silencioso</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="quietHours"
                        defaultChecked={settings?.quietHours.enabled}
                      />
                      <Label htmlFor="quietHours">Activar horario silencioso</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Desde</Label>
                        <Input 
                          type="time" 
                          defaultValue={settings?.quietHours.start}
                        />
                      </div>
                      <div>
                        <Label>Hasta</Label>
                        <Input 
                          type="time" 
                          defaultValue={settings?.quietHours.end}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full">Guardar Configuración</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{notifications.length}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 text-sm font-medium">Sin Leer</p>
              <p className="text-2xl font-bold text-red-900">{unreadCount}</p>
            </div>
            <div className="text-2xl">🔴</div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">Urgentes</p>
              <p className="text-2xl font-bold text-orange-900">{urgentCount}</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Hoy</p>
              <p className="text-2xl font-bold text-green-900">
                {notifications.filter(n => new Date(n.timestamp).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="text-2xl">📅</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {['all', 'unread', 'urgent', 'today'].map(filterType => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType as any)}
            >
              {filterType === 'all' ? 'Todas' : 
               filterType === 'unread' ? 'Sin Leer' :
               filterType === 'urgent' ? 'Urgentes' : 'Hoy'}
            </Button>
          ))}
        </div>
        
        <select 
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">Todos los tipos</option>
          <option value="ai_insight">Insights IA</option>
          <option value="reservation">Reservas</option>
          <option value="inventory">Inventario</option>
          <option value="staff">Personal</option>
          <option value="success">Éxitos</option>
          <option value="info">Información</option>
        </select>
        
        <Input
          placeholder="Buscar notificaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {filteredNotifications.map(notification => (
          <Card 
            key={notification.id} 
            className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
              !notification.read ? 'ring-2 ring-blue-200' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority.toUpperCase()}
                    </Badge>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'} mb-2`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatTime(notification.timestamp)}</span>
                    <div className="flex items-center gap-1">
                      {notification.channels.map(channel => (
                        <span key={channel} title={`Enviado por ${channel}`}>
                          {channel === 'push' ? '📱' : 
                           channel === 'email' ? '📧' : 
                           channel === 'sms' ? '💬' : 
                           channel === 'whatsapp' ? '📲' : '💼'}
                        </span>
                      ))}
                    </div>
                    {notification.expiresAt && (
                      <span className="text-orange-600">
                        Expira: {new Date(notification.expiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={action.style === 'primary' ? 'default' : 'outline'}
                          onClick={() => handleNotificationAction(notification.id, action.action)}
                          className={action.style === 'danger' ? 'border-red-300 text-red-600 hover:bg-red-50' : ''}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-3">
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Marcar como leído"
                  >
                    ✓
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteNotification(notification.id)}
                  title="Eliminar notificación"
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay notificaciones
          </h3>
          <p className="text-gray-600">
            {filter === 'all' ? 'No tienes notificaciones en este momento.' :
             filter === 'unread' ? 'Todas las notificaciones están marcadas como leídas.' :
             filter === 'urgent' ? 'No hay notificaciones urgentes.' :
             'No hay notificaciones para hoy.'}
          </p>
        </Card>
      )}
    </div>
  );
}
