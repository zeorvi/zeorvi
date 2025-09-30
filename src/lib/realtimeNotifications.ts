/**
 * Sistema de notificaciones en tiempo real para el dashboard
 */

export interface RealtimeNotification {
  type: 'reservation_created' | 'reservation_updated' | 'reservation_cancelled';
  restaurantId: string;
  data: any;
  timestamp: string;
}

class RealtimeNotificationService {
  private notifications: Map<string, RealtimeNotification[]> = new Map();
  private listeners: Map<string, ((notification: RealtimeNotification) => void)[]> = new Map();

  // Agregar notificación
  addNotification(restaurantId: string, notification: RealtimeNotification) {
    if (!this.notifications.has(restaurantId)) {
      this.notifications.set(restaurantId, []);
    }
    
    const restaurantNotifications = this.notifications.get(restaurantId)!;
    restaurantNotifications.push(notification);
    
    // Mantener solo las últimas 50 notificaciones
    if (restaurantNotifications.length > 50) {
      restaurantNotifications.shift();
    }
    
    // Notificar a todos los listeners
    this.notifyListeners(restaurantId, notification);
    
    console.log(`🔔 Notificación en tiempo real para ${restaurantId}:`, notification);
  }

  // Suscribirse a notificaciones
  subscribe(restaurantId: string, callback: (notification: RealtimeNotification) => void) {
    if (!this.listeners.has(restaurantId)) {
      this.listeners.set(restaurantId, []);
    }
    
    this.listeners.get(restaurantId)!.push(callback);
    
    return () => {
      const listeners = this.listeners.get(restaurantId);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Notificar a todos los listeners
  private notifyListeners(restaurantId: string, notification: RealtimeNotification) {
    const listeners = this.listeners.get(restaurantId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error notificando listener:', error);
        }
      });
    }
  }

  // Obtener notificaciones recientes
  getRecentNotifications(restaurantId: string, limit: number = 10): RealtimeNotification[] {
    const notifications = this.notifications.get(restaurantId) || [];
    return notifications.slice(-limit);
  }

  // Limpiar notificaciones antiguas
  cleanupOldNotifications() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    this.notifications.forEach((notifications, restaurantId) => {
      const recentNotifications = notifications.filter(n => n.timestamp > oneHourAgo);
      this.notifications.set(restaurantId, recentNotifications);
    });
  }
}

// Instancia singleton
export const realtimeNotifications = new RealtimeNotificationService();

// Limpiar notificaciones antiguas cada 30 minutos
setInterval(() => {
  realtimeNotifications.cleanupOldNotifications();
}, 30 * 60 * 1000);
