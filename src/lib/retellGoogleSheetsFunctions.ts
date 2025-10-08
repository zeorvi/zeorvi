import { GoogleSheetsService } from './googleSheetsService';
import { realtimeNotifications } from './realtimeNotifications';
import { TableManagementSystem } from './tableManagementSystem';

export interface ReservaRequest {
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  personas: number;
  notas?: string;
}

export interface DisponibilidadRequest {
  fecha: string;
  hora: string;
  personas: number;
}

export interface BuscarReservaRequest {
  cliente: string;
  telefono: string;
}

export class RetellGoogleSheetsFunctions {
  // Función 1: Verificar disponibilidad
  static async verificarDisponibilidad(request: DisponibilidadRequest, restaurantId: string, restaurantName: string): Promise<{
    disponible: boolean;
    mensaje: string;
    alternativas?: string[];
    mesasDisponibles?: number;
    mesasQueSeLiberan?: string[];
  }> {
    try {
      console.log('🔍 Verificando disponibilidad:', request);
      
      // 1. Verificar disponibilidad general (capacidad del restaurante)
      const disponibleGeneral = await GoogleSheetsService.verificarDisponibilidad(
        restaurantId,
        request.fecha,
        request.hora,
        request.personas
      );

      if (!disponibleGeneral.disponible) {
        // Generar alternativas del mismo día
        const alternativas = this.generarAlternativas(request.fecha, request.personas);
        return {
          disponible: false,
          mensaje: disponibleGeneral.mensaje || `Para ${request.personas} personas el ${request.fecha} a las ${request.hora} no tengo disponibilidad.`,
          alternativas: disponibleGeneral.alternativas || alternativas
        };
      }

      // 2. Verificar disponibilidad específica de mesas
      const disponibilidadMesas = await TableManagementSystem.verificarDisponibilidadMesas(
        request.fecha,
        request.hora,
        request.personas,
        restaurantId
      );

      if (disponibilidadMesas.disponible) {
        let mensaje = `Perfecto, tenemos disponibilidad para ${request.personas} personas el ${request.fecha} a las ${request.hora}.`;
        
        if (disponibilidadMesas.mesasQueSeLiberan && disponibilidadMesas.mesasQueSeLiberan.length > 0) {
          mensaje += ` Tendremos ${disponibilidadMesas.mesasQueSeLiberan.length} mesa${disponibilidadMesas.mesasQueSeLiberan.length > 1 ? 's' : ''} adicional${disponibilidadMesas.mesasQueSeLiberan.length > 1 ? 'es' : ''} liberándose antes de su hora.`;
        }

        return {
          disponible: true,
          mensaje,
          mesasDisponibles: disponibilidadMesas.mesasDisponibles,
          mesasQueSeLiberan: disponibilidadMesas.mesasQueSeLiberan
        };
      } else {
        // Generar alternativas del mismo día
        const alternativas = this.generarAlternativas(request.fecha, request.personas);
        return {
          disponible: false,
          mensaje: `No tenemos mesas disponibles para ${request.personas} personas el ${request.fecha} a las ${request.hora}.`,
          alternativas
        };
      }

    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      return {
        disponible: false,
        mensaje: 'Error verificando disponibilidad. Por favor, inténtelo de nuevo.'
      };
    }
  }

  // Función 2: Crear reserva
  static async crearReserva(request: ReservaRequest, restaurantId: string, restaurantName: string): Promise<{
    exito: boolean;
    mensaje: string;
    numeroReserva?: string;
  }> {
    try {
      console.log('📝 Creando reserva:', request);
      
      // Primero verificar disponibilidad
      const disponibilidad = await this.verificarDisponibilidad(
        {
          fecha: request.fecha,
          hora: request.hora,
          personas: request.personas
        },
        restaurantId,
        restaurantName
      );

      if (!disponibilidad.disponible) {
        return {
          exito: false,
          mensaje: disponibilidad.mensaje
        };
      }

      // 3. Asignar mesa automáticamente
      const mesaAsignada = await TableManagementSystem.asignarMesa(
        request.fecha,
        request.hora,
        request.personas,
        restaurantId
      );

      if (!mesaAsignada) {
        return {
          exito: false,
          mensaje: 'No hay mesas disponibles para esa hora. Por favor, pruebe con otro horario.'
        };
      }

      // Crear la reserva con mesa asignada
      const resultado = await GoogleSheetsService.crearReserva(
        restaurantId,
        request.fecha,
        request.hora,
        request.cliente,
        request.telefono,
        request.personas,
        'Comedor 1',
        request.notas || ''
      );

      if (resultado.success) {
        const numeroReserva = `RES${Date.now().toString().slice(-6)}`;
        
        // 🔥 NOTIFICACIÓN EN TIEMPO REAL
        realtimeNotifications.addNotification(restaurantId, {
          type: 'reservation_created',
          restaurantId: restaurantId,
          data: {
            ...request,
            numeroReserva,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
        
        console.log('🚀 Notificación en tiempo real enviada para nueva reserva');
        
        return {
          exito: true,
          mensaje: `Reserva confirmada para ${request.cliente} el ${request.fecha} a las ${request.hora} para ${request.personas} personas en la mesa ${mesaAsignada}.`,
          numeroReserva
        };
      } else {
        return {
          exito: false,
          mensaje: 'Error creando la reserva. Por favor, inténtelo de nuevo.'
        };
      }
    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      return {
        exito: false,
        mensaje: 'Error creando la reserva. Por favor, inténtelo de nuevo.'
      };
    }
  }

  // Función 3: Buscar reserva
  static async buscarReserva(request: BuscarReservaRequest, restaurantId: string): Promise<{
    encontrada: boolean;
    mensaje: string;
    reserva?: {
      Fecha: string;
      Hora: string;
      Personas: number;
      Cliente: string;
      Telefono: string;
      Estado: string;
      Mesa: string;
    };
  }> {
    try {
      console.log('🔍 Buscando reserva:', request);
      
      const reserva = await GoogleSheetsService.buscarReserva(
        restaurantId,
        request.cliente,
        request.telefono
      );

      if (reserva) {
        return {
          encontrada: true,
          mensaje: `Reserva encontrada para ${request.cliente} el ${reserva.Fecha} a las ${reserva.Hora} para ${reserva.Personas} personas.`,
          reserva
        };
      } else {
        return {
          encontrada: false,
          mensaje: `No he encontrado ninguna reserva a nombre de ${request.cliente} con el número ${request.telefono}.`
        };
      }
    } catch (error) {
      console.error('❌ Error buscando reserva:', error);
      return {
        encontrada: false,
        mensaje: 'Error buscando la reserva. Por favor, inténtelo de nuevo.'
      };
    }
  }

  // Función 4: Cancelar reserva
  static async cancelarReserva(request: BuscarReservaRequest, restaurantId: string): Promise<{
    cancelada: boolean;
    mensaje: string;
  }> {
    try {
      console.log('❌ Cancelando reserva:', request);
      
      // Primero buscar la reserva
      const busqueda = await this.buscarReserva(request, restaurantId);
      
      if (!busqueda.encontrada) {
        return {
          cancelada: false,
          mensaje: busqueda.mensaje
        };
      }

      // Cancelar la reserva
      const exito = await GoogleSheetsService.actualizarEstadoReserva(
        request.cliente,
        request.telefono,
        'cancelada',
        restaurantId
      );

      if (exito) {
        // 🔥 NOTIFICACIÓN EN TIEMPO REAL
        realtimeNotifications.addNotification(restaurantId, {
          type: 'reservation_cancelled',
          restaurantId: restaurantId,
          data: {
            ...request,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
        
        console.log('🚀 Notificación en tiempo real enviada para cancelación');
        
        return {
          cancelada: true,
          mensaje: `Reserva cancelada correctamente para ${request.cliente}.`
        };
      } else {
        return {
          cancelada: false,
          mensaje: 'Error cancelando la reserva. Por favor, inténtelo de nuevo.'
        };
      }
    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      return {
        cancelada: false,
        mensaje: 'Error cancelando la reserva. Por favor, inténtelo de nuevo.'
      };
    }
  }

  // Función auxiliar: Generar alternativas de horarios
  private static generarAlternativas(_fecha: string, _personas: number): string[] {
    const horarios = ['13:00', '14:00', '20:00', '22:00'];
    return horarios.map(hora => `${hora}`);
  }

  // Función auxiliar: Obtener horario (comida/cena)
  private static obtenerHorario(hora: string): string {
    const horaNum = parseInt(hora.split(':')[0]);
    if (horaNum >= 13 && horaNum <= 16) {
      return 'Comida';
    } else if (horaNum >= 20 && horaNum <= 23) {
      return 'Cena';
    }
    return 'Otro';
  }

  // Función auxiliar: Obtener reservas del día
  static async obtenerReservasHoy(restaurantId: string): Promise<{
    ID?: string;
    Fecha: string;
    Hora: string;
    Turno: string;
    Cliente: string;
    Telefono: string;
    Personas: number;
    Zona: string;
    Mesa: string;
    Estado: string;
    Notas?: string;
    Creado: string;
  }[]> {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      return await GoogleSheetsService.getReservasPorFecha(hoy, restaurantId);
    } catch (error) {
      console.error('❌ Error obteniendo reservas de hoy:', error);
      return [];
    }
  }

  // Función auxiliar: Obtener estadísticas
  static async obtenerEstadisticas(restaurantId: string): Promise<{
    totalReservas: number;
    reservasHoy: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
    reservasCanceladas: number;
  } | null> {
    try {
      return await GoogleSheetsService.getEstadisticas(restaurantId);
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
}
