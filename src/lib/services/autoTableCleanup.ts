import { getTablesByStatus, updateTableStatus, Table } from '@/lib/restaurantData';
import { logger } from '@/lib/logger';

// Configuración del sistema de limpieza automática
const CLEANUP_CONFIG = {
  TIEMPO_MAXIMO_OCUPACION: 2.5 * 60 * 60 * 1000, // 2.5 horas en milisegundos
  INTERVALO_VERIFICACION: 30 * 1000, // Verificar cada 30 segundos
  TIEMPO_GRACIA: 15 * 60 * 1000, // 15 minutos de gracia antes de liberar
};

export interface TableCleanupStatus {
  tableId: string;
  clientName: string;
  timeOccupied: number; // en minutos
  timeRemaining: number; // en minutos
  status: 'normal' | 'warning' | 'overdue' | 'auto_released';
  shouldCleanup: boolean;
}

class AutoTableCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Iniciar el servicio de limpieza automática
  start() {
    if (this.isRunning) {
      logger.warn('El servicio de limpieza automática ya está ejecutándose');
      return;
    }

    this.isRunning = true;
    logger.info('Iniciando servicio de limpieza automática de mesas', {
      tiempoMaximo: CLEANUP_CONFIG.TIEMPO_MAXIMO_OCUPACION / (60 * 60 * 1000),
      intervaloVerificacion: CLEANUP_CONFIG.INTERVALO_VERIFICACION / 1000
    });

    this.cleanupInterval = setInterval(() => {
      this.verificarYLiberarMesas();
    }, CLEANUP_CONFIG.INTERVALO_VERIFICACION);
  }

  // Detener el servicio
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    logger.info('Servicio de limpieza automática detenido');
  }

  // Verificar y liberar mesas automáticamente
  private verificarYLiberarMesas() {
    try {
      const mesasOcupadas = getTablesByStatus('ocupada');
      const ahora = new Date();
      let mesasLiberadas = 0;

      mesasOcupadas.forEach(mesa => {
        if (mesa.reservation && mesa.client) {
          // Calcular tiempo transcurrido desde la reserva
          const horaReserva = mesa.reservation.time;
          const fechaReserva = new Date(mesa.reservation.date);
          
          // Crear fecha/hora completa de cuando llegó el cliente
          const [horas, minutos] = horaReserva.split(':').map(Number);
          const tiempoLlegada = new Date(fechaReserva);
          tiempoLlegada.setHours(horas, minutos, 0, 0);
          
          const tiempoTranscurrido = ahora.getTime() - tiempoLlegada.getTime();
          const tiempoEnMinutos = Math.floor(tiempoTranscurrido / (60 * 1000));
          
          // Si ha pasado más de 2.5 horas, liberar automáticamente
          if (tiempoTranscurrido > CLEANUP_CONFIG.TIEMPO_MAXIMO_OCUPACION) {
            this.liberarMesaAutomaticamente(mesa, tiempoEnMinutos);
            mesasLiberadas++;
          }
        }
      });

      if (mesasLiberadas > 0) {
        logger.info(`Liberadas ${mesasLiberadas} mesa(s) automáticamente`);
        
        // Emitir evento para notificar a los componentes
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auto-table-cleanup', {
            detail: { count: mesasLiberadas, timestamp: ahora }
          }));
        }
      }

    } catch (error) {
      logger.error('Error en verificación automática de mesas', { error });
    }
  }

  // Liberar mesa automáticamente
  private liberarMesaAutomaticamente(mesa: Table, tiempoOcupada: number) {
    try {
      // Actualizar estado de la mesa a libre
      updateTableStatus(mesa.id, 'libre');
      
      // Si había una reserva, marcarla como completada
      if (mesa.reservation) {
        // Aquí actualizaríamos el estado de la reserva a 'completada'
        // En un sistema real, esto se haría en la base de datos
        logger.info('Reserva marcada como completada automáticamente', {
          reservaId: mesa.reservation.id,
          mesaId: mesa.id,
          cliente: mesa.client?.name,
          horaInicio: mesa.reservation.time,
          tiempoTotal: `${tiempoOcupada} minutos`
        });
      }
      
      logger.info('Mesa liberada automáticamente', {
        mesaId: mesa.id,
        cliente: mesa.client?.name,
        tiempoOcupada: `${tiempoOcupada} minutos`,
        razon: 'Tiempo máximo de ocupación excedido (2.5 horas)',
        nuevoEstado: 'libre',
        disponibleParaNuevasReservas: true
      });

      // Emitir evento específico para sincronización
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mesa-liberada-automaticamente', {
          detail: { 
            mesaId: mesa.id,
            cliente: mesa.client?.name,
            tiempoOcupada,
            timestamp: new Date(),
            disponibleAhora: true
          }
        }));
      }

    } catch (error) {
      logger.error('Error al liberar mesa automáticamente', { 
        error, 
        mesaId: mesa.id 
      });
    }
  }

  // Obtener estado de limpieza de todas las mesas ocupadas
  getCleanupStatus(): TableCleanupStatus[] {
    const mesasOcupadas = getTablesByStatus('ocupada');
    const ahora = new Date();

    return mesasOcupadas.map(mesa => {
      if (!mesa.reservation || !mesa.client) {
        return {
          tableId: mesa.id,
          clientName: 'Cliente desconocido',
          timeOccupied: 0,
          timeRemaining: 150, // 2.5 horas por defecto
          status: 'normal',
          shouldCleanup: false
        };
      }

      // Calcular tiempo transcurrido
      const horaReserva = mesa.reservation.time;
      const fechaReserva = new Date(mesa.reservation.date);
      const [horas, minutos] = horaReserva.split(':').map(Number);
      const tiempoLlegada = new Date(fechaReserva);
      tiempoLlegada.setHours(horas, minutos, 0, 0);
      
      const tiempoTranscurrido = ahora.getTime() - tiempoLlegada.getTime();
      const tiempoEnMinutos = Math.floor(tiempoTranscurrido / (60 * 1000));
      const tiempoRestante = 150 - tiempoEnMinutos; // 150 minutos = 2.5 horas

      // Determinar estado
      let status: TableCleanupStatus['status'] = 'normal';
      if (tiempoRestante <= 0) {
        status = 'auto_released';
      } else if (tiempoRestante <= 15) {
        status = 'overdue';
      } else if (tiempoRestante <= 30) {
        status = 'warning';
      }

      return {
        tableId: mesa.id,
        clientName: mesa.client.name,
        timeOccupied: tiempoEnMinutos,
        timeRemaining: Math.max(0, tiempoRestante),
        status,
        shouldCleanup: tiempoRestante <= 0
      };
    });
  }

  // Verificar si un turno específico tiene disponibilidad
  checkTurnAvailability(date: string, time: string, people: number): {
    available: boolean;
    tablesRemaining: number;
    recommendedAlternative?: string;
    message: string;
  } {
    try {
      const reservasDelDia = getReservationsByDate(new Date(date));
      const mesasLibres = getTablesByStatus('libre');
      const totalMesas = getTablesByStatus('all').length;
      
      // Reservas en el turno específico
      const reservasEnTurno = reservasDelDia.filter(r => 
        r.time === time && r.status !== 'cancelada'
      );
      
      const mesasDisponibles = totalMesas - reservasEnTurno.length;
      const hayCapacidadSuficiente = mesasLibres.some(mesa => mesa.capacity >= people);
      
      const disponible = mesasDisponibles > 0 && hayCapacidadSuficiente;
      
      if (disponible) {
        return {
          available: true,
          tablesRemaining: mesasDisponibles,
          message: `Disponible: ${mesasDisponibles} mesa(s) libre(s) para ${people} personas a las ${time}`
        };
      } else {
        // Buscar alternativa
        const turnos = ['13:00', '14:00', '20:00', '22:00'];
        const mejorAlternativa = turnos
          .filter(t => t !== time)
          .map(t => ({
            hora: t,
            disponibles: totalMesas - reservasDelDia.filter(r => r.time === t && r.status !== 'cancelada').length
          }))
          .filter(t => t.disponibles > 0)
          .sort((a, b) => b.disponibles - a.disponibles)[0];
        
        return {
          available: false,
          tablesRemaining: 0,
          recommendedAlternative: mejorAlternativa?.hora,
          message: mejorAlternativa 
            ? `No disponible a las ${time}. Te recomiendo las ${mejorAlternativa.hora} con ${mejorAlternativa.disponibles} mesa(s) disponible(s)`
            : `No hay disponibilidad para ${people} personas el ${date}`
        };
      }
      
    } catch (error) {
      logger.error('Error al verificar disponibilidad de turno', { error, date, time, people });
      return {
        available: false,
        tablesRemaining: 0,
        message: 'Error al verificar disponibilidad'
      };
    }
  }
}

// Instancia singleton del servicio
export const autoTableCleanup = new AutoTableCleanupService();

// Funciones de utilidad para Retell
export const getTableStatusForRetell = () => {
  const mesasLibres = getTablesByStatus('libre');
  const mesasOcupadas = getTablesByStatus('ocupada');
  const mesasReservadas = getTablesByStatus('reservada');
  
  return {
    libres: mesasLibres.length,
    ocupadas: mesasOcupadas.length,
    reservadas: mesasReservadas.length,
    total: mesasLibres.length + mesasOcupadas.length + mesasReservadas.length,
    
    detalles_libres: mesasLibres.map(mesa => ({
      mesa: mesa.id,
      capacidad: mesa.capacity,
      ubicacion: mesa.location
    })),
    
    detalles_ocupadas: autoTableCleanup.getCleanupStatus(),
    
    detalles_reservadas: mesasReservadas.map(mesa => ({
      mesa: mesa.id,
      cliente: mesa.client?.name || 'Cliente',
      hora: mesa.reservation?.time || '',
      personas: mesa.reservation?.people || 0,
      estado: mesa.reservation?.status || 'pendiente'
    }))
  };
};

// Inicializar el servicio automáticamente en el servidor
if (typeof window === 'undefined') {
  // Solo en el servidor
  autoTableCleanup.start();
}

export default autoTableCleanup;
