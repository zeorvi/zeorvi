import { useState, useEffect, useCallback } from 'react';
import { RealtimeNotification } from '@/lib/realtimeNotifications';

export function useRealtimeNotifications(restaurantId: string) {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Función para cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/realtime/notifications?restaurantId=${restaurantId}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }, [restaurantId]);

  // Función para enviar notificación
  const sendNotification = useCallback(async (type: string, data: any) => {
    try {
      const response = await fetch('/api/realtime/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          type,
          data
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return false;
    }
  }, [restaurantId]);

  // Polling cada 5 segundos para notificaciones
  useEffect(() => {
    if (!restaurantId) return;

    // Cargar notificaciones iniciales
    loadNotifications();

    // Polling cada 5 segundos
    const interval = setInterval(loadNotifications, 5000);

    return () => clearInterval(interval);
  }, [restaurantId, loadNotifications]);

  // WebSocket simulation con polling
  useEffect(() => {
    if (!restaurantId) return;

    let isActive = true;

    const pollNotifications = async () => {
      if (!isActive) return;

      try {
        const response = await fetch(`/api/realtime/notifications?restaurantId=${restaurantId}&limit=1`);
        const data = await response.json();
        
        if (data.success && data.notifications.length > 0) {
          const latestNotification = data.notifications[0];
          
          // Verificar si es una notificación nueva
          const isNew = !notifications.some(n => 
            n.timestamp === latestNotification.timestamp && 
            n.type === latestNotification.type
          );
          
          if (isNew) {
            setNotifications(prev => [latestNotification, ...prev].slice(0, 20));
            setLastUpdate(new Date());
            
            // Mostrar notificación visual (opcional)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Nueva ${latestNotification.type}`, {
                body: `Restaurante ${restaurantId}`,
                icon: '/favicon.ico'
              });
            }
          }
        }
        
        setIsConnected(true);
      } catch (error) {
        console.error('Error en polling de notificaciones:', error);
        setIsConnected(false);
      }

      // Polling cada 3 segundos para máxima velocidad
      setTimeout(pollNotifications, 3000);
    };

    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    pollNotifications();

    return () => {
      isActive = false;
    };
  }, [restaurantId, notifications]);

  return {
    notifications,
    isConnected,
    lastUpdate,
    sendNotification,
    refreshNotifications: loadNotifications
  };
}
