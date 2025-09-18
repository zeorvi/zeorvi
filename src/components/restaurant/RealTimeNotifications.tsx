'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  Phone, 
  MessageSquare, 
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'reservation' | 'call' | 'whatsapp' | 'system';
  title: string;
  message: string;
  time: string;
  unread: boolean;
  data?: any;
}

interface RealTimeNotificationsProps {
  restaurantId: string;
}

export default function RealTimeNotifications({ restaurantId }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'reservation',
      title: 'Nueva Reserva Confirmada',
      message: 'Mesa M6 reservada para Luis Fernández a las 20:00',
      time: '2 min',
      unread: true,
      data: { tableId: 'M6', clientName: 'Luis Fernández', time: '20:00' }
    },
    {
      id: '2',
      type: 'call',
      title: 'Llamada Recibida',
      message: 'Cliente interesado en reserva para 4 personas',
      time: '5 min',
      unread: true,
      data: { phone: '+34123456789', people: 4 }
    },
    {
      id: '3',
      type: 'whatsapp',
      title: 'Mensaje WhatsApp',
      message: 'Consulta sobre disponibilidad para mañana',
      time: '10 min',
      unread: false,
      data: { phone: '+34666555444' }
    }
  ]);
  const [isOpen, setIsOpen] = useState(false);

  // Simular notificaciones en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular nueva notificación ocasionalmente
      if (Math.random() < 0.1) { // 10% de probabilidad cada 30 segundos
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: 'reservation',
          title: 'Reserva Automática',
          message: `Nueva reserva creada desde llamada - Mesa M${Math.floor(Math.random() * 20) + 1}`,
          time: 'Ahora',
          unread: true,
          data: { 
            tableId: `M${Math.floor(Math.random() * 20) + 1}`,
            clientName: 'Cliente Automático',
            time: '20:00'
          }
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        toast.success('Nueva reserva recibida');
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, unread: false }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reservation':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'call':
        return <Phone className="h-4 w-4 text-blue-600" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'reservation':
        return 'border-l-green-500 bg-green-50';
      case 'call':
        return 'border-l-blue-500 bg-blue-50';
      case 'whatsapp':
        return 'border-l-green-400 bg-green-50';
      case 'system':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notificaciones</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Marcar todas como leídas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
                        notification.unread ? 'bg-opacity-100' : 'bg-opacity-50'
                      } hover:bg-opacity-75 transition-colors`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              notification.unread ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeNotification(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.unread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="mt-2 text-xs h-6"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marcar como leída
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

