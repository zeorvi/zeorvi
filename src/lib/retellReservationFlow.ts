import { GoogleSheetsService } from './googleSheetsService';

export interface ReservationRequest {
  customerName: string;
  phone: string;
  people: number;
  date: string;
  time: string;
  specialRequests?: string;
  restaurantId: string;
  restaurantName: string;
  spreadsheetId: string;
}

export interface AvailabilityCheck {
  available: boolean;
  reason?: string;
  suggestedTimes?: string[];
  maxCapacity?: number;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  message: string;
  reservation?: any;
}

export class RetellReservationFlow {
  /**
   * Flujo completo de reserva desde Retell AI
   */
  static async processReservationRequest(request: ReservationRequest): Promise<ReservationResult> {
    try {
      console.log('🔄 Procesando solicitud de reserva desde Retell AI:', request);

      // 1. Verificar disponibilidad
      const availability = await this.checkAvailability(
        request.date,
        request.time,
        request.people,
        request.restaurantId,
        request.restaurantName,
        request.spreadsheetId
      );

      if (!availability.available) {
        return {
          success: false,
          message: this.generateUnavailableMessage(availability, request),
        };
      }

      // 2. Crear la reserva
      const reservation = await this.createReservation(request, request.spreadsheetId);

      if (reservation.success) {
        // 3. Generar mensaje de confirmación
        const confirmationMessage = this.generateConfirmationMessage(request, reservation.reservation);

        return {
          success: true,
          reservationId: reservation.reservationId,
          message: confirmationMessage,
          reservation: reservation.reservation,
        };
      } else {
        return {
          success: false,
          message: 'Lo siento, hubo un error al procesar su reserva. Por favor, intente llamar nuevamente o contacte directamente al restaurante.',
        };
      }

    } catch (error) {
      console.error('❌ Error procesando reserva desde Retell AI:', error);
      return {
        success: false,
        message: 'Lo siento, hubo un error técnico. Por favor, contacte directamente al restaurante para hacer su reserva.',
      };
    }
  }

  /**
   * Verificar disponibilidad para una fecha y hora específica
   */
  static async checkAvailability(
    date: string,
    time: string,
    people: number,
    restaurantId: string,
    restaurantName: string,
    spreadsheetId: string
  ): Promise<AvailabilityCheck> {
    try {
      console.log(`🔍 Verificando disponibilidad: ${date} ${time} para ${people} personas`);

      // Verificar disponibilidad usando Google Sheets
      const disponible = await GoogleSheetsService.verificarDisponibilidad(
        restaurantId,
        date,
        time,
        people
      );

      if (disponible) {
        return {
          available: true,
          maxCapacity: 50, // Capacidad máxima del restaurante
        };
      }

      // Si no hay disponibilidad, obtener reservas existentes para sugerir horarios alternativos
      const reservasExistentes = await GoogleSheetsService.getReservasPorFecha(
        date,
        restaurantId
      );

      const reservasEnEsaHora = reservasExistentes.filter(r => r.Hora === time);
      const personasReservadas = reservasEnEsaHora.reduce((sum, r) => sum + r.Personas, 0);

      // Generar horarios alternativos
      const suggestedTimes = this.generateAlternativeTimes(time, date);

      return {
        available: false,
        reason: `No hay disponibilidad para ${time}. Ya hay ${personasReservadas} personas reservadas en ese horario.`,
        suggestedTimes,
        maxCapacity: 50,
      };

    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      return {
        available: false,
        reason: 'Error verificando disponibilidad. Por favor, contacte directamente al restaurante.',
      };
    }
  }

  /**
   * Crear reserva en Google Sheets
   */
  static async createReservation(
    request: ReservationRequest,
    spreadsheetId: string
  ): Promise<{ success: boolean; reservationId?: string; reservation?: any }> {
    try {
      console.log('➕ Creando reserva en Google Sheets:', request);

      const creada = await GoogleSheetsService.crearReserva(
        request.restaurantId,
        request.date,
        request.time,
        request.customerName,
        request.phone,
        request.people,
        'Por asignar',
        request.specialRequests || ''
      );

      if (creada.success) {
        const reservationId = creada.ID || `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          success: true,
          reservationId,
          reservation: {
            Fecha: request.date,
            Hora: request.time,
            Cliente: request.customerName,
            Telefono: request.phone,
            Personas: request.people,
            Zona: 'Por asignar',
            Mesa: 'Por asignar',
            Estado: 'confirmada',
            notas: request.specialRequests || '',
            id: reservationId,
            creado: new Date().toISOString(),
          },
        };
      } else {
        return {
          success: false,
        };
      }

    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Generar horarios alternativos
   */
  private static generateAlternativeTimes(requestedTime: string, date: string): string[] {
    const timeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    const requestedIndex = timeSlots.indexOf(requestedTime);
    
    if (requestedIndex === -1) {
      return timeSlots.slice(0, 3); // Devolver primeros 3 horarios
    }

    const alternatives = [];
    
    // Horarios antes
    for (let i = requestedIndex - 1; i >= 0 && alternatives.length < 2; i--) {
      alternatives.push(timeSlots[i]);
    }
    
    // Horarios después
    for (let i = requestedIndex + 1; i < timeSlots.length && alternatives.length < 3; i++) {
      alternatives.push(timeSlots[i]);
    }

    return alternatives;
  }

  /**
   * Generar mensaje cuando no hay disponibilidad
   */
  private static generateUnavailableMessage(availability: AvailabilityCheck, request: ReservationRequest): string {
    let message = `Lo siento, no tenemos disponibilidad para ${request.people} personas el ${request.date} a las ${request.time}.`;
    
    if (availability.reason) {
      message += ` ${availability.reason}`;
    }

    if (availability.suggestedTimes && availability.suggestedTimes.length > 0) {
      message += ` ¿Le gustaría probar con estos horarios alternativos: ${availability.suggestedTimes.join(', ')}?`;
    } else {
      message += ` ¿Podría intentar con otra fecha o contactar directamente al restaurante?`;
    }

    return message;
  }

  /**
   * Generar mensaje de confirmación
   */
  private static generateConfirmationMessage(request: ReservationRequest, reservation: any): string {
    const fecha = new Date(`${request.date}T00:00:00`);
    const dateFormatted = fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Madrid'
    });

    let message = `¡Perfecto! Su reserva ha sido confirmada. `;
    message += `Reserva para ${request.people} persona${request.people > 1 ? 's' : ''} el ${dateFormatted} a las ${request.time}. `;
    message += `Nombre: ${request.customerName}. `;
    message += `Teléfono: ${request.phone}. `;
    
    if (request.specialRequests) {
      message += `Solicitudes especiales: ${request.specialRequests}. `;
    }
    
    message += `La mesa se asignará cuando lleguen. ¡Esperamos verlos pronto!`;

    return message;
  }

  /**
   * Buscar reserva existente por cliente
   */
  static async findExistingReservation(
    customerName: string,
    phone: string,
    restaurantId: string,
    restaurantName: string
  ): Promise<any | null> {
    try {
      const reservation = await GoogleSheetsService.buscarReserva(
        restaurantId,
        customerName,
        phone
      );

      return reservation;
    } catch (error) {
      console.error('❌ Error buscando reserva existente:', error);
      return null;
    }
  }

  /**
   * Modificar reserva existente
   */
  static async modifyExistingReservation(
    customerName: string,
    phone: string,
    newDate: string,
    newTime: string,
    newPeople: number,
    restaurantId: string,
    restaurantName: string,
    spreadsheetId: string
  ): Promise<ReservationResult> {
    try {
      console.log(`🔄 Modificando reserva existente para ${customerName}`);

      // Verificar disponibilidad para el nuevo horario
      const availability = await this.checkAvailability(
        newDate,
        newTime,
        newPeople,
        restaurantId,
        restaurantName,
        spreadsheetId
      );

      if (!availability.available) {
        return {
          success: false,
          message: this.generateUnavailableMessage(availability, {
            customerName,
            phone,
            people: newPeople,
            date: newDate,
            time: newTime,
            restaurantId,
            restaurantName,
            spreadsheetId,
          }),
        };
      }

      // Buscar reserva existente
      const existingReservation = await this.findExistingReservation(
        customerName,
        phone,
        restaurantId,
        restaurantName
      );

      if (!existingReservation) {
        return {
          success: false,
          message: 'No se encontró una reserva existente para modificar.',
        };
      }

      // Actualizar reserva existente (esto requeriría implementar una función de actualización)
      // Por ahora, creamos una nueva reserva y cancelamos la anterior
      const newReservation = await this.createReservation({
        customerName,
        phone,
        people: newPeople,
        date: newDate,
        time: newTime,
        restaurantId,
        restaurantName,
        spreadsheetId,
      }, spreadsheetId);

      if (newReservation.success) {
        // Marcar reserva anterior como cancelada
        await GoogleSheetsService.actualizarEstadoReserva(
          customerName,
          phone,
          'cancelada',
          restaurantId
        );

        let confirmationMessage = `¡Perfecto! He modificado su reserva. `;
        confirmationMessage += `Nueva reserva para ${newPeople} persona${newPeople > 1 ? 's' : ''} el ${newDate} a las ${newTime}. `;
        confirmationMessage += `La reserva anterior ha sido cancelada. ¡Esperamos verlos pronto!`;

        return {
          success: true,
          reservationId: newReservation.reservationId,
          message: confirmationMessage,
          reservation: newReservation.reservation,
        };
      } else {
        return {
          success: false,
          message: 'Lo siento, no pude modificar su reserva. Por favor, contacte directamente al restaurante.',
        };
      }

    } catch (error) {
      console.error('❌ Error modificando reserva:', error);
      return {
        success: false,
        message: 'Lo siento, hubo un error al modificar su reserva. Por favor, contacte directamente al restaurante.',
      };
    }
  }
}
