// Servicio para sincronizar el calendario de Retell con el dashboard
import { Reservation } from '@/lib/restaurantData';

export interface RetellReservationData {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  time: string;
  people: number;
  tableId: string;
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  source: 'llamada';
  notes?: string;
  createdAt: string;
}

// Evento personalizado para notificar cambios en el calendario
export const CALENDAR_EVENTS = {
  RESERVATION_CREATED: 'retell:reservation:created',
  RESERVATION_UPDATED: 'retell:reservation:updated',
  RESERVATION_CANCELLED: 'retell:reservation:cancelled',
  AVAILABILITY_CHECKED: 'retell:availability:checked',
  RESERVATION_SEARCH: 'retell:reservation:search'
} as const;

// Clase para gestionar la sincronización
export class RetellCalendarSync {
  private static instance: RetellCalendarSync;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  static getInstance(): RetellCalendarSync {
    if (!RetellCalendarSync.instance) {
      RetellCalendarSync.instance = new RetellCalendarSync();
    }
    return RetellCalendarSync.instance;
  }

  // Agregar listener para eventos del calendario
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remover listener
  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emitir evento
  emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de evento ${event}:`, error);
        }
      });
    }
  }

  // Notificar que se creó una reserva desde Retell
  notifyReservationCreated(reservation: RetellReservationData): void {
    console.log('🎉 Nueva reserva creada por Retell:', reservation);
    
    // Emitir evento para actualizar el dashboard
    this.emit(CALENDAR_EVENTS.RESERVATION_CREATED, {
      type: 'reservation_created',
      source: 'retell_ai',
      data: reservation,
      timestamp: new Date().toISOString(),
      message: `Nueva reserva: ${reservation.clientName} - ${reservation.date} ${reservation.time}`
    });

    // Mostrar notificación en el dashboard si está disponible
    if (typeof window !== 'undefined' && window.localStorage) {
      const notification = {
        id: `retell_${reservation.id}`,
        type: 'success',
        title: '🎉 Nueva Reserva por Teléfono',
        message: `${reservation.clientName} - ${reservation.people} personas`,
        details: `${reservation.date} a las ${reservation.time} - Mesa ${reservation.tableId}`,
        timestamp: Date.now(),
        source: 'retell_ai'
      };

      // Guardar notificación en localStorage para que la vea el dashboard
      const notifications = JSON.parse(localStorage.getItem('retell_notifications') || '[]');
      notifications.unshift(notification);
      
      // Mantener solo las últimas 10 notificaciones
      notifications.splice(10);
      
      localStorage.setItem('retell_notifications', JSON.stringify(notifications));
      
      // Disparar evento personalizado del DOM
      window.dispatchEvent(new CustomEvent('retell:new_reservation', {
        detail: notification
      }));
    }
  }

  // Notificar consulta de disponibilidad
  notifyAvailabilityCheck(query: {
    date: string;
    time?: string;
    people?: number;
    availableSlots: string[];
    totalSlots: number;
  }): void {
    console.log('🔍 Consulta de disponibilidad desde Retell:', query);
    
    this.emit(CALENDAR_EVENTS.AVAILABILITY_CHECKED, {
      type: 'availability_checked',
      source: 'retell_ai',
      data: query,
      timestamp: new Date().toISOString()
    });
  }

  // Notificar cancelación de reserva
  notifyReservationCancelled(cancellation: {
    reservationId: string;
    clientName?: string;
    clientPhone?: string;
    reason?: string;
  }): void {
    console.log('❌ Reserva cancelada por Retell:', cancellation);
    
    this.emit(CALENDAR_EVENTS.RESERVATION_CANCELLED, {
      type: 'reservation_cancelled',
      source: 'retell_ai',
      data: cancellation,
      timestamp: new Date().toISOString(),
      message: `Reserva cancelada: ${cancellation.clientName || cancellation.clientPhone}`
    });

    // Mostrar notificación en el dashboard
    if (typeof window !== 'undefined' && window.localStorage) {
      const notification = {
        id: `cancel_${cancellation.reservationId}`,
        type: 'warning',
        title: '❌ Reserva Cancelada por Teléfono',
        message: `${cancellation.clientName || 'Cliente'} canceló su reserva`,
        details: cancellation.reason || 'Cancelación telefónica',
        timestamp: Date.now(),
        source: 'retell_ai'
      };

      const notifications = JSON.parse(localStorage.getItem('retell_notifications') || '[]');
      notifications.unshift(notification);
      notifications.splice(10);
      
      localStorage.setItem('retell_notifications', JSON.stringify(notifications));
      
      window.dispatchEvent(new CustomEvent('retell:reservation_cancelled', {
        detail: notification
      }));
    }
  }

  // Notificar búsqueda de reserva
  notifyReservationSearch(search: {
    phone?: string;
    name?: string;
    foundReservations: number;
    searchDate: string;
  }): void {
    console.log('🔍 Búsqueda de reserva desde Retell:', search);
    
    this.emit(CALENDAR_EVENTS.RESERVATION_SEARCH, {
      type: 'reservation_search',
      source: 'retell_ai',
      data: search,
      timestamp: new Date().toISOString()
    });
  }

  // Convertir datos de Retell a formato interno de Reservation
  convertToReservation(retellData: RetellReservationData): Omit<Reservation, 'createdAt'> {
    return {
      id: retellData.id,
      clientId: `retell_${retellData.clientPhone}`, // Usar teléfono como ID de cliente
      tableId: retellData.tableId,
      date: new Date(retellData.date),
      time: retellData.time,
      duration: 120, // 2 horas por defecto
      people: retellData.people,
      status: retellData.status,
      source: 'llamada',
      notes: `Cliente: ${retellData.clientName}, Teléfono: ${retellData.clientPhone}${retellData.notes ? `, Notas: ${retellData.notes}` : ''}`
    };
  }

  // Obtener estadísticas de reservas de Retell
  getRetellStats(): {
    totalReservations: number;
    todayReservations: number;
    pendingReservations: number;
    lastActivity: string | null;
  } {
    if (typeof window === 'undefined') {
      return {
        totalReservations: 0,
        todayReservations: 0,
        pendingReservations: 0,
        lastActivity: null
      };
    }

    const notifications = JSON.parse(localStorage.getItem('retell_notifications') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const todayReservations = notifications.filter((n: {timestamp: string; source: string; type: string}) => 
      n.source === 'retell_ai' && 
      n.type === 'success' &&
      new Date(n.timestamp).toISOString().split('T')[0] === today
    );

    return {
      totalReservations: notifications.filter((n: {source: string}) => n.source === 'retell_ai').length,
      todayReservations: todayReservations.length,
      pendingReservations: todayReservations.length, // Asumimos que las nuevas están pendientes
      lastActivity: notifications.length > 0 ? new Date(notifications[0].timestamp).toISOString() : null
    };
  }

  // Limpiar notificaciones antiguas
  cleanOldNotifications(daysToKeep: number = 7): void {
    if (typeof window === 'undefined') return;

    const notifications = JSON.parse(localStorage.getItem('retell_notifications') || '[]');
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const recentNotifications = notifications.filter((n: {timestamp: string}) => new Date(n.timestamp).getTime() > cutoffDate);
    
    localStorage.setItem('retell_notifications', JSON.stringify(recentNotifications));
  }
}

// Instancia singleton
export const retellCalendarSync = RetellCalendarSync.getInstance();

// Hook para usar en componentes React
export function useRetellCalendarSync() {
  const sync = RetellCalendarSync.getInstance();
  
  return {
    sync,
    onReservationCreated: (callback: (data: unknown) => void) => {
      sync.on(CALENDAR_EVENTS.RESERVATION_CREATED, callback);
      return () => sync.off(CALENDAR_EVENTS.RESERVATION_CREATED, callback);
    },
    onAvailabilityChecked: (callback: (data: unknown) => void) => {
      sync.on(CALENDAR_EVENTS.AVAILABILITY_CHECKED, callback);
      return () => sync.off(CALENDAR_EVENTS.AVAILABILITY_CHECKED, callback);
    },
    getStats: () => sync.getRetellStats(),
    cleanOldData: () => sync.cleanOldNotifications()
  };
}
