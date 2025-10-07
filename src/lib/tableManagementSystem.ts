/**
 * Sistema de gestión automática de mesas
 * - Asigna mesas automáticamente
 * - Libera mesas después de 2 horas
 * - Verifica disponibilidad futura
 * - Sincroniza con Google Sheets
 */

import { RestaurantTableGenerator } from '@/lib/restaurantTableGenerator';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

export interface Mesa {
  id: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  estado: 'libre' | 'ocupada' | 'reservada';
  reservaActual?: {
    id: string;
    cliente: string;
    horaInicio: string;
    horaFin: string;
    personas: number;
  };
}

export interface ReservaConMesa {
  id: string;
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  personas: number;
  mesaAsignada: string;
  horaFin: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada';
}

export class TableManagementSystem {
  private static readonly DURACION_RESERVA = 2; // 2 horas
  // Cache en memoria como fallback cuando Google Sheets no está disponible
  private static readonly MESAS_POR_RESTAURANTE: Record<string, Mesa[]> = {
    'rest_003': [ // La Gaviota - 12 mesas
      { id: 'mesa_1', numero: '1', capacidad: 2, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_2', numero: '2', capacidad: 2, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_3', numero: '3', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_4', numero: '4', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_5', numero: '5', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_6', numero: '6', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_t1', numero: 'T1', capacidad: 2, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t2', numero: 'T2', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t3', numero: 'T3', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t4', numero: 'T4', capacidad: 6, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t5', numero: 'T5', capacidad: 8, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_privada', numero: 'P', capacidad: 12, ubicacion: 'Privada', estado: 'libre' }
    ],
    'rest_004': [ // El Buen Sabor - 10 mesas
      { id: 'mesa_1', numero: '1', capacidad: 2, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_2', numero: '2', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_3', numero: '3', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_4', numero: '4', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_5', numero: '5', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_t1', numero: 'T1', capacidad: 2, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t2', numero: 'T2', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t3', numero: 'T3', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t4', numero: 'T4', capacidad: 6, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t5', numero: 'T5', capacidad: 8, ubicacion: 'Terraza', estado: 'libre' }
    ]
  };

  /**
   * Asignar mesa automáticamente para una reserva
   */
  static async asignarMesa(
    fecha: string,
    hora: string,
    personas: number,
    restaurantId: string,
    preferenciaUbicacion?: string
  ): Promise<string | null> {
    try {
      console.log(`🎯 Asignando mesa para ${personas} personas el ${fecha} a las ${hora}`);

      // 1. Obtener mesas del restaurante
      const mesas = this.MESAS_POR_RESTAURANTE[restaurantId] || [];
      
      // 2. Calcular hora de fin de la reserva
      const horaFin = this.calcularHoraFin(hora);
      
      // 3. Verificar mesas disponibles en ese horario
      const mesasDisponibles = await this.verificarMesasDisponibles(
        mesas,
        fecha,
        hora,
        horaFin,
        restaurantId
      );

      // 4. Filtrar por capacidad y preferencia
      let mesasCandidatas = mesasDisponibles.filter(mesa => 
        mesa.capacidad >= personas && 
        (!preferenciaUbicacion || mesa.ubicacion === preferenciaUbicacion)
      );

      // 5. Si no hay con preferencia, buscar sin preferencia
      if (mesasCandidatas.length === 0) {
        mesasCandidatas = mesasDisponibles.filter(mesa => mesa.capacidad >= personas);
      }

      // 6. Si no hay mesas disponibles, retornar null
      if (mesasCandidatas.length === 0) {
        console.log(`❌ No hay mesas disponibles para ${personas} personas el ${fecha} a las ${hora}`);
        return null;
      }

      // 7. Seleccionar la mejor mesa (menor capacidad que cumpla el requisito)
      const mesaSeleccionada = mesasCandidatas.sort((a, b) => a.capacidad - b.capacidad)[0];

      // 8. Marcar mesa como reservada
      await this.marcarMesaOcupada(
        mesaSeleccionada.id,
        fecha,
        hora,
        horaFin,
        restaurantId
      );

      console.log(`✅ Mesa ${mesaSeleccionada.numero} asignada para ${personas} personas`);
      return mesaSeleccionada.numero;

    } catch (error) {
      console.error('❌ Error asignando mesa:', error);
      return null;
    }
  }

  /**
   * Verificar disponibilidad de mesas considerando liberaciones automáticas
   */
  static async verificarDisponibilidadMesas(
    fecha: string,
    hora: string,
    personas: number,
    restaurantId: string
  ): Promise<{
    disponible: boolean;
    mesasDisponibles: number;
    mensaje: string;
    mesasQueSeLiberan?: string[];
  }> {
    try {
      console.log(`🔍 Verificando disponibilidad de mesas para ${personas} personas el ${fecha} a las ${hora}`);

      const mesas = this.MESAS_POR_RESTAURANTE[restaurantId] || [];
      const horaFin = this.calcularHoraFin(hora);

      // 1. Verificar mesas disponibles
      const mesasDisponibles = await this.verificarMesasDisponibles(
        mesas,
        fecha,
        hora,
        horaFin,
        restaurantId
      );

      // 2. Filtrar por capacidad
      const mesasAdecuadas = mesasDisponibles.filter(mesa => mesa.capacidad >= personas);

      // 3. Verificar mesas que se liberarán antes de la hora solicitada
      const mesasQueSeLiberan = await this.obtenerMesasQueSeLiberan(
        mesas,
        fecha,
        hora,
        restaurantId
      );

      const mesasQueSeLiberanAdecuadas = mesasQueSeLiberan.filter(mesa => mesa.capacidad >= personas);

      const totalMesasDisponibles = mesasAdecuadas.length + mesasQueSeLiberanAdecuadas.length;

      if (totalMesasDisponibles > 0) {
        return {
          disponible: true,
          mesasDisponibles: totalMesasDisponibles,
          mensaje: `Tenemos ${totalMesasDisponibles} mesa${totalMesasDisponibles > 1 ? 's' : ''} disponible${totalMesasDisponibles > 1 ? 's' : ''} para ${personas} personas el ${fecha} a las ${hora}.`,
          mesasQueSeLiberan: mesasQueSeLiberanAdecuadas.map(m => m.numero)
        };
      } else {
        return {
          disponible: false,
          mesasDisponibles: 0,
          mensaje: `No tenemos mesas disponibles para ${personas} personas el ${fecha} a las ${hora}.`
        };
      }

    } catch (error) {
      console.error('❌ Error verificando disponibilidad de mesas:', error);
      return {
        disponible: false,
        mesasDisponibles: 0,
        mensaje: 'Error verificando disponibilidad de mesas.'
      };
    }
  }

  /**
   * Liberar mesas automáticamente (se ejecuta cada hora)
   */
  static async liberarMesasAutomaticamente(restaurantId: string): Promise<void> {
    try {
      console.log(`🔄 Liberando mesas automáticamente para restaurante ${restaurantId}`);

      const mesas = this.MESAS_POR_RESTAURANTE[restaurantId] || [];
      const ahora = new Date();
      const horaActual = ahora.toTimeString().slice(0, 5);

      for (const mesa of mesas) {
        if (mesa.estado === 'ocupada' && mesa.reservaActual) {
          const horaFinReserva = mesa.reservaActual.horaFin;
          
          // Si la hora actual es mayor o igual a la hora de fin, liberar mesa
          if (horaActual >= horaFinReserva) {
            mesa.estado = 'libre';
            mesa.reservaActual = undefined;
            
            console.log(`🆓 Mesa ${mesa.numero} liberada automáticamente`);
            
            // Actualizar en Google Sheets (opcional)
            await this.actualizarEstadoMesaEnSheets(mesa, restaurantId);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error liberando mesas automáticamente:', error);
    }
  }

  /**
   * Obtener estado actual de todas las mesas
   * Prioriza Google Sheets, fallback a memoria
   */
  static async obtenerEstadoMesas(restaurantId: string): Promise<Mesa[]> {
    try {
      // 1. Intentar leer mesas desde Google Sheets
      console.log(`📊 Leyendo mesas desde Google Sheets para ${restaurantId}`);
      const mesasSheets = await GoogleSheetsService.getMesas(restaurantId);
      
      if (mesasSheets && mesasSheets.length > 0) {
        // Convertir formato de Google Sheets a formato Mesa
        const mesas = mesasSheets.map(mesaSheet => ({
          id: `mesa_${mesaSheet.ID}`,
          numero: mesaSheet.ID,
          capacidad: mesaSheet.Capacidad,
          ubicacion: mesaSheet.Zona,
          estado: 'libre' as const, // Estado por defecto, se actualizará con reservas
          reservaActual: undefined
        }));
        
        console.log(`✅ ${mesas.length} mesas cargadas desde Google Sheets`);
        
        // Actualizar cache en memoria
        this.MESAS_POR_RESTAURANTE[restaurantId] = mesas;
        
        // Liberar mesas automáticamente antes de retornar estado
        await this.liberarMesasAutomaticamente(restaurantId);
        
        return mesas;
      }
    } catch (error) {
      console.warn(`⚠️ Error leyendo mesas desde Google Sheets:`, error);
    }
    
    // 2. Fallback: usar mesas en memoria o generar automáticamente
    let mesas = this.MESAS_POR_RESTAURANTE[restaurantId];
    
    if (!mesas) {
      console.log(`🆕 Generando mesas automáticamente para restaurante ${restaurantId}`);
      const mesasGeneradas = RestaurantTableGenerator.getTablesForRestaurant(restaurantId);
      // Convertir a formato Mesa
      mesas = mesasGeneradas.map(m => ({
        ...m,
        estado: 'libre' as const,
        reservaActual: undefined
      }));
      
      // Guardar en memoria para futuras consultas
      this.MESAS_POR_RESTAURANTE[restaurantId] = mesas;
    }
    
    // Liberar mesas automáticamente antes de retornar estado
    await this.liberarMesasAutomaticamente(restaurantId);
    
    return mesas;
  }

  // ========== MÉTODOS PRIVADOS ==========

  private static calcularHoraFin(horaInicio: string): string {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const horaFin = new Date();
    horaFin.setHours(horas + this.DURACION_RESERVA, minutos);
    return horaFin.toTimeString().slice(0, 5);
  }

  private static async verificarMesasDisponibles(
    mesas: Mesa[],
    fecha: string,
    horaInicio: string,
    horaFin: string,
    restaurantId: string
  ): Promise<Mesa[]> {
    // Obtener mesas actualizadas (puede incluir nuevas mesas generadas)
    const mesasActuales = await this.obtenerEstadoMesas(restaurantId);
    
    return mesasActuales.filter(mesa => {
      if (mesa.estado === 'libre') return true;
      if (mesa.estado === 'ocupada' && mesa.reservaActual) {
        // Verificar si hay conflicto de horarios
        const reservaInicio = mesa.reservaActual.horaInicio;
        const reservaFin = mesa.reservaActual.horaFin;
        
        // Si la nueva reserva termina antes de que empiece la existente
        // o empieza después de que termine la existente, está disponible
        return horaFin <= reservaInicio || horaInicio >= reservaFin;
      }
      return false;
    });
  }

  private static async obtenerMesasQueSeLiberan(
    mesas: Mesa[],
    fecha: string,
    hora: string,
    restaurantId: string
  ): Promise<Mesa[]> {
    return mesas.filter(mesa => {
      if (mesa.estado === 'ocupada' && mesa.reservaActual) {
        const horaFinReserva = mesa.reservaActual.horaFin;
        return horaFinReserva < hora; // Se libera antes de la hora solicitada
      }
      return false;
    });
  }

  private static async marcarMesaOcupada(
    mesaId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    restaurantId: string
  ): Promise<void> {
    const mesas = this.MESAS_POR_RESTAURANTE[restaurantId] || [];
    const mesa = mesas.find(m => m.id === mesaId);
    
    if (mesa) {
      mesa.estado = 'ocupada';
      mesa.reservaActual = {
        id: `res_${Date.now()}`,
        cliente: 'Pendiente',
        horaInicio,
        horaFin,
        personas: 0
      };
    }
  }

  private static async actualizarEstadoMesaEnSheets(mesa: Mesa, restaurantId: string): Promise<void> {
    // Aquí podrías actualizar el estado de la mesa en Google Sheets
    // Por ejemplo, crear una hoja "Mesas" con el estado actual
    console.log(`📊 Actualizando estado de mesa ${mesa.numero} en Google Sheets`);
  }
}
