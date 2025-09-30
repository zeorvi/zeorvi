import { GoogleSheetsService } from './googleSheetsService';

export interface RetellReservationData {
  customerName: string;
  phone: string;
  email?: string;
  people: number;
  date: string;
  time: string;
  schedule?: string; // Para la columna "horario"
  specialRequests?: string;
  tableId?: string;
  location?: string;
  restaurantId?: string;
  restaurantName?: string;
}

export class RetellSheetsSync {
  /**
   * Sincronizar una reserva desde Retell AI a Google Sheets
   */
  static async syncReservationToSheets(reservationData: RetellReservationData): Promise<boolean> {
    try {
      console.log('🔄 Sincronizando reserva desde Retell AI:', reservationData);

      if (!reservationData.restaurantId || !reservationData.restaurantName) {
        console.log('❌ Falta información del restaurante');
        return false;
      }

      // Verificar disponibilidad
      const disponible = await GoogleSheetsService.verificarDisponibilidad(
        reservationData.date,
        reservationData.time,
        reservationData.people,
        reservationData.restaurantId,
        reservationData.restaurantName
      );

      if (!disponible) {
        console.log('❌ No hay disponibilidad para esta fecha y hora');
        return false;
      }

      // Crear la reserva en Google Sheets
      const reserva = {
        fecha: reservationData.date,
        hora: reservationData.time,
        horario: reservationData.schedule || reservationData.time, // Usar schedule o time como fallback
        cliente: reservationData.customerName,
        telefono: reservationData.phone,
        personas: reservationData.people,
        mesa: reservationData.tableId || '',
        estado: 'confirmada' as const,
        notas: reservationData.specialRequests || '',
        restaurante: reservationData.restaurantName,
        restauranteId: reservationData.restaurantId
      };

      const creada = await GoogleSheetsService.crearReserva(reserva);

      if (creada) {
        console.log('✅ Reserva sincronizada exitosamente a Google Sheets');
        return true;
      } else {
        console.log('❌ Error creando reserva en Google Sheets');
        return false;
      }

    } catch (error) {
      console.error('❌ Error sincronizando reserva:', error);
      return false;
    }
  }

  /**
   * Extraer datos de reserva del análisis de Retell AI
   */
  static extractReservationFromAnalysis(analysis: any, summary: string): RetellReservationData | null {
    try {
      // Buscar patrones de reserva
      const reservationKeywords = ['reserva', 'reservar', 'mesa', 'cita', 'appointment', 'booking'];
      const hasReservation = reservationKeywords.some(keyword => 
        summary.toLowerCase().includes(keyword) || 
        JSON.stringify(analysis).toLowerCase().includes(keyword)
      );

      if (!hasReservation) {
        return null;
      }

      // Extraer información básica
      const customerName = analysis?.customer_name || analysis?.name || 'Cliente';
      const phone = analysis?.phone || analysis?.telefono || '';
      const people = analysis?.people || analysis?.personas || analysis?.guests || 2;
      const date = analysis?.date || analysis?.fecha || new Date().toISOString().split('T')[0];
      const time = analysis?.time || analysis?.hora || '20:00';
      const schedule = analysis?.schedule || analysis?.horario || time; // Usar horario específico si está disponible
      const specialRequests = analysis?.requests || analysis?.solicitudes || analysis?.notes || '';
      const restaurantId = analysis?.restaurant_id || analysis?.restaurantId || '';
      const restaurantName = analysis?.restaurant_name || analysis?.restaurantName || '';

      return {
        customerName,
        phone,
        people: parseInt(people.toString()),
        date,
        time,
        schedule,
        specialRequests,
        email: analysis?.email || '',
        tableId: analysis?.table || '',
        location: analysis?.location || 'Salón Principal',
        restaurantId,
        restaurantName
      };

    } catch (error) {
      console.error('❌ Error extrayendo datos de reserva:', error);
      return null;
    }
  }
}
