import { google } from 'googleapis';
import { RESTAURANT_SHEETS, getRestaurantSheetId, getRestaurantName } from './restaurantSheets';

export interface Reserva {
  ID?: string;
  Fecha: string;
  Hora: string;
  Turno: string;
  Cliente: string;
  Telefono: string;
  Personas: number;
  Zona: string;
  Mesa: string;
  Estado: 'pendiente' | 'confirmada' | 'cancelada';
  Notas?: string;
  Creado: string;
}

export interface Mesa {
  ID: string;
  Zona: string;
  Capacidad: number;
  Turnos: string;
  Estado: string;
  Notas?: string;
}

export class GoogleSheetsService {
  static async getClient() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }

  static getSheetId(restaurantId: string): string {
    const sheetId = getRestaurantSheetId(restaurantId);
    if (!sheetId) {
      throw new Error(`No se encontró hoja para ${restaurantId}`);
    }
    return sheetId;
  }

  // ✅ Leer reservas
  static async getReservas(restaurantId: string): Promise<Reserva[]> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Reservas!A2:L",
      });
      
      const values = res.data.values || [];
      return values.map(row => ({
        ID: row[0] || '',
        Fecha: row[1] || '',
        Hora: row[2] || '',
        Turno: row[3] || '',
        Cliente: row[4] || '',
        Telefono: row[5] || '',
        Personas: parseInt(row[6]) || 0,
        Zona: row[7] || '',
        Mesa: row[8] || '',
        Estado: (row[9] as 'pendiente' | 'confirmada' | 'cancelada') || 'pendiente',
        Notas: row[10] || '',
        Creado: row[11] || new Date().toISOString(),
      }));
    } catch (error) {
      console.error(`Error leyendo reservas para ${restaurantId}:`, error);
      return [];
    }
  }

  // ✅ Añadir nueva reserva
  static async addReserva(restaurantId: string, reserva: Omit<Reserva, 'ID' | 'Creado'>): Promise<{ success: boolean; ID?: string }> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const reservaId = `R${Date.now()}`;
      const creado = new Date().toISOString();
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Reservas!A:L",
        valueInputOption: "USER_ENTERED",
        requestBody: { 
          values: [[
            reservaId,
            reserva.Fecha,
            reserva.Hora,
            reserva.Turno,
            reserva.Cliente,
            reserva.Telefono,
            reserva.Personas.toString(),
            reserva.Zona,
            reserva.Mesa,
            reserva.Estado,
            reserva.Notas || '',
            creado
          ]]
        },
      });
      
      console.log(`✅ Reserva creada: ${reservaId} para ${restaurantId}`);
      return { success: true, ID: reservaId };
    } catch (error) {
      console.error(`Error creando reserva para ${restaurantId}:`, error);
      return { success: false };
    }
  }

  // ✅ Actualizar o cancelar reserva (por ID)
  static async updateReserva(restaurantId: string, id: string, nuevosDatos: Partial<Reserva>): Promise<{ success: boolean }> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);

      // Leer todas las reservas
      const data = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Reservas!A2:L",
      });
      
      const values = data.data.values || [];
      const index = values.findIndex(row => row[0] === id);
      
      if (index === -1) {
        throw new Error("Reserva no encontrada");
      }

      // Mezclar nuevos datos
      const row = values[index];
      const updated = [
        id,
        nuevosDatos.Fecha || row[1],
        nuevosDatos.Hora || row[2],
        nuevosDatos.Turno || row[3],
        nuevosDatos.Cliente || row[4],
        nuevosDatos.Telefono || row[5],
        nuevosDatos.Personas?.toString() || row[6],
        nuevosDatos.Zona || row[7],
        nuevosDatos.Mesa || row[8],
        nuevosDatos.Estado || row[9],
        nuevosDatos.Notas || row[10],
        nuevosDatos.Creado || row[11],
      ];

      // Escribir de nuevo
      const rowIndex = index + 2; // +2 porque empieza en fila 2
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Reservas!A${rowIndex}:L${rowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [updated] },
      });
      
      console.log(`✅ Reserva actualizada: ${id} para ${restaurantId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error actualizando reserva ${id} para ${restaurantId}:`, error);
      return { success: false };
    }
  }

  // ✅ Leer mesas
  static async getMesas(restaurantId: string): Promise<Mesa[]> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Mesas!A2:F",
      });
      
      const values = res.data.values || [];
      return values.map(row => ({
        ID: row[0] || '',
        Zona: row[1] || '',
        Capacidad: parseInt(row[2]) || 0,
        Turnos: row[3] || '',
        Estado: row[4] || 'Libre',
        Notas: row[5] || '',
      }));
    } catch (error) {
      console.error(`Error leyendo mesas para ${restaurantId}:`, error);
      return [];
    }
  }

  // ✅ Leer turnos
  static async getTurnos(restaurantId: string): Promise<Array<{ Turno: string; Inicio: string; Fin: string }>> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Turnos!A2:C",
      });
      
      const values = res.data.values || [];
      return values.map(row => ({
        Turno: row[0] || '',
        Inicio: row[1] || '',
        Fin: row[2] || '',
      }));
    } catch (error) {
      console.error(`Error leyendo turnos para ${restaurantId}:`, error);
      return [];
    }
  }

  // ✅ Verificar disponibilidad
  static async verificarDisponibilidad(
    restaurantId: string, 
    fecha: string, 
    hora: string, 
    personas: number, 
    zona?: string
  ): Promise<{ disponible: boolean; mesa?: string; mensaje: string; alternativas?: string[] }> {
    try {
      const mesas = await this.getMesas(restaurantId);
      const reservas = await this.getReservas(restaurantId);
      
      // Filtrar mesas por zona y capacidad
      let mesasDisponibles = mesas.filter(mesa => 
        mesa.Capacidad >= personas && 
        mesa.Estado === 'Libre' &&
        (!zona || mesa.Zona === zona)
      );
      
      // Filtrar por turno según la hora
      const turno = this.determinarTurno(hora);
      mesasDisponibles = mesasDisponibles.filter(mesa => 
        mesa.Turnos.includes(turno)
      );
      
      // Verificar reservas existentes para esa fecha/hora
      const reservasExistentes = reservas.filter(reserva => 
        reserva.Fecha === fecha && 
        reserva.Hora === hora && 
        (reserva.Estado === 'confirmada' || reserva.Estado === 'pendiente')
      );
      
      const mesasOcupadas = reservasExistentes.map(r => r.Mesa);
      const mesasLibres = mesasDisponibles.filter(mesa => 
        !mesasOcupadas.includes(mesa.ID)
      );
      
      if (mesasLibres.length > 0) {
        const mesaElegida = mesasLibres[0];
        return {
          disponible: true,
          mesa: mesaElegida.ID,
          mensaje: `Mesa ${mesaElegida.ID} disponible en ${mesaElegida.Zona} para ${personas} personas`
        };
      } else {
        // Buscar alternativas
        const alternativas = mesasDisponibles.map(mesa => 
          `Mesa ${mesa.ID} en ${mesa.Zona} (${mesa.Capacidad} personas)`
        );
        
        return {
          disponible: false,
          mensaje: `No hay mesas disponibles para ${personas} personas en ${zona || 'cualquier zona'} a las ${hora}`,
          alternativas: alternativas.slice(0, 3) // Máximo 3 alternativas
        };
      }
    } catch (error) {
      console.error(`Error verificando disponibilidad para ${restaurantId}:`, error);
      return {
        disponible: false,
        mensaje: 'Error verificando disponibilidad'
      };
    }
  }

  // ✅ Función auxiliar para determinar turno
  private static determinarTurno(hora: string): string {
    const horaNum = parseInt(hora.split(':')[0]);
    if (horaNum >= 13 && horaNum <= 16) {
      return 'Comida';
    } else if (horaNum >= 20 && horaNum <= 23) {
      return 'Cena';
    }
    return 'Comida'; // Default
  }

  // ✅ Buscar reserva por cliente y teléfono
  static async buscarReserva(restaurantId: string, cliente: string, telefono: string): Promise<Reserva | null> {
    try {
      const reservas = await this.getReservas(restaurantId);
      return reservas.find(reserva => 
        reserva.Cliente.toLowerCase() === cliente.toLowerCase() && 
        reserva.Telefono === telefono
      ) || null;
    } catch (error) {
      console.error(`Error buscando reserva para ${restaurantId}:`, error);
      return null;
    }
  }

  // ✅ Obtener estadísticas
  static async getEstadisticas(restaurantId: string): Promise<{
    totalReservas: number;
    reservasHoy: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
    reservasCanceladas: number;
  }> {
    try {
      const reservas = await this.getReservas(restaurantId);
      const hoy = new Date().toISOString().split('T')[0];
      
      return {
        totalReservas: reservas.length,
        reservasHoy: reservas.filter(r => r.Fecha === hoy).length,
        reservasConfirmadas: reservas.filter(r => r.Estado === 'confirmada').length,
        reservasPendientes: reservas.filter(r => r.Estado === 'pendiente').length,
        reservasCanceladas: reservas.filter(r => r.Estado === 'cancelada').length,
      };
    } catch (error) {
      console.error(`Error obteniendo estadísticas para ${restaurantId}:`, error);
      return {
        totalReservas: 0,
        reservasHoy: 0,
        reservasConfirmadas: 0,
        reservasPendientes: 0,
        reservasCanceladas: 0,
      };
    }
  }
}
