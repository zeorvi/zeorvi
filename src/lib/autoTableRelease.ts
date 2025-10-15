/**
 * Sistema de Liberación Automática de Mesas
 * 
 * Libera mesas automáticamente después de 2 horas de su hora de reserva
 * si están en estado "Ocupada"
 */

import { GoogleSheetsService } from './googleSheetsService';

export class AutoTableReleaseService {
  /**
   * Liberar mesas automáticamente después de 2 horas
   * Cambiar de "Reservada" → "Completada" (= Mesa libre para el agente)
   */
  static async releaseExpiredTables(restaurantId: string): Promise<{
    success: boolean;
    released: number;
    tables: string[];
  }> {
    try {
      console.log(`🕐 [Auto-Release] Verificando mesas expiradas para ${restaurantId}...`);
      
      // Obtener fecha de hoy
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Obtener todas las reservas de hoy
      const reservas = await GoogleSheetsService.getReservas(restaurantId);
      const reservasHoy = reservas.filter(r => r.Fecha === todayStr);
      
      console.log(`📊 [Auto-Release] Encontradas ${reservasHoy.length} reservas para hoy`);
      
      const now = new Date();
      const releasedTables: string[] = [];
      
      for (const reserva of reservasHoy) {
        // Solo procesar reservas en estado "Reservada" o "Confirmada"
        const estadoNormalizado = (reserva.Estado || '').toLowerCase().trim();
        if (!['reservada', 'confirmada'].includes(estadoNormalizado)) {
          continue;
        }
        
        // Calcular tiempo desde la hora de reserva
        const [horaStr, minutosStr] = reserva.Hora.split(':');
        const reservaTime = new Date(today);
        reservaTime.setHours(parseInt(horaStr), parseInt(minutosStr || '0'), 0, 0);
        
        const horasPasadas = (now.getTime() - reservaTime.getTime()) / (1000 * 60 * 60);
        
        // Si han pasado más de 2 horas, liberar la mesa
        if (horasPasadas >= 2) {
          console.log(`⏰ [Auto-Release] Mesa ${reserva.Mesa} - Reserva de ${reserva.Cliente} a las ${reserva.Hora} ha pasado ${Math.floor(horasPasadas * 60)} minutos`);
          
          try {
            // Actualizar estado a "Completada" en Google Sheets
            const updated = await GoogleSheetsService.actualizarEstadoReserva(
              reserva.Cliente,
              reserva.Telefono,
              'Completada',
              restaurantId
            );
            
            if (updated) {
              releasedTables.push(reserva.Mesa);
              console.log(`✅ [Auto-Release] Mesa ${reserva.Mesa} liberada automáticamente (${Math.floor(horasPasadas * 60)} min desde reserva)`);
            } else {
              console.warn(`⚠️ [Auto-Release] No se pudo liberar mesa ${reserva.Mesa}`);
            }
          } catch (updateError) {
            console.error(`❌ [Auto-Release] Error liberando mesa ${reserva.Mesa}:`, updateError);
          }
        } else {
          const minutosRestantes = Math.ceil((2 - horasPasadas) * 60);
          console.log(`⏳ [Auto-Release] Mesa ${reserva.Mesa} - Faltan ${minutosRestantes} min para liberación automática`);
        }
      }
      
      if (releasedTables.length > 0) {
        console.log(`✅ [Auto-Release] ${releasedTables.length} mesas liberadas: ${releasedTables.join(', ')}`);
      } else {
        console.log(`✅ [Auto-Release] No hay mesas para liberar en este momento`);
      }
      
      return {
        success: true,
        released: releasedTables.length,
        tables: releasedTables
      };
      
    } catch (error) {
      console.error(`❌ [Auto-Release] Error:`, error);
      return {
        success: false,
        released: 0,
        tables: []
      };
    }
  }

  /**
   * Verificar el estado de las mesas y devolver resumen
   */
  static async getTableStatus(restaurantId: string): Promise<{
    ocupadas: number;
    porExpirar: number; // Menos de 30 min para expirar
    proximas: number; // Próximas a expirar (30-60 min)
    details: Array<{
      mesa: string;
      cliente: string;
      hora: string;
      minutosOcupada: number;
      minutosParaLiberar: number;
    }>;
  }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const reservas = await GoogleSheetsService.getReservas(restaurantId);
      const reservasOcupadas = reservas.filter(
        r => {
          if (r.Fecha !== todayStr) return false;
          const estado = (r.Estado || '').toLowerCase().trim();
          return ['reservada', 'confirmada'].includes(estado);
        }
      );
      
      let porExpirar = 0;
      let proximas = 0;
      const details: any[] = [];
      
      for (const reserva of reservasOcupadas) {
        const [horaStr, minutosStr] = reserva.Hora.split(':');
        const reservaTime = new Date(today);
        reservaTime.setHours(parseInt(horaStr), parseInt(minutosStr || '0'), 0, 0);
        
        const minutosOcupada = Math.floor((today.getTime() - reservaTime.getTime()) / (1000 * 60));
        const minutosParaLiberar = 120 - minutosOcupada;
        
        if (minutosParaLiberar <= 30 && minutosParaLiberar > 0) {
          porExpirar++;
        } else if (minutosParaLiberar <= 60 && minutosParaLiberar > 30) {
          proximas++;
        }
        
        details.push({
          mesa: reserva.Mesa,
          cliente: reserva.Cliente,
          hora: reserva.Hora,
          minutosOcupada,
          minutosParaLiberar: Math.max(0, minutosParaLiberar)
        });
      }
      
      return {
        ocupadas: reservasOcupadas.length,
        porExpirar,
        proximas,
        details
      };
      
    } catch (error) {
      console.error(`❌ [Auto-Release] Error obteniendo estado:`, error);
      return {
        ocupadas: 0,
        porExpirar: 0,
        proximas: 0,
        details: []
      };
    }
  }
}

