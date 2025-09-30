import { google } from 'googleapis';

// Configuración de Google Sheets
const SHEET_ID = process.env.GOOGLE_SHEETS_ID || 'tu_id_de_la_hoja';

// Función para obtener el nombre de la hoja según el restaurante
function getSheetName(): string {
  return 'Reservas'; // Ahora siempre usamos la hoja "Reservas" dentro del Google Sheets del restaurante
}

// Función para obtener el spreadsheet ID del restaurante
function getRestaurantSpreadsheetId(): string {
  // En un sistema real, esto vendría de una base de datos
  // Por ahora, usamos el SHEET_ID por defecto
  return SHEET_ID;
}

// Configurar autenticación
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH || 'google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface Reserva {
  id?: string;
  fecha: string;
  hora: string;
  horario: string;
  cliente: string;
  telefono: string;
  personas: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  mesa?: string;
  notas?: string;
  creado: string;
  restaurante?: string;
  restauranteId?: string;
}

export class GoogleSheetsService {
  // Leer reservas de un restaurante específico
  static async getReservas(restaurantId: string, restaurantName: string, spreadsheetId?: string): Promise<Reserva[]> {
    try {
      const sheetName = getSheetName();
      const targetSpreadsheetId = spreadsheetId || getRestaurantSpreadsheetId();
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSpreadsheetId,
        range: `${sheetName}!A2:H1000`, // Desde fila 2 hasta 1000 (8 columnas: A-H)
      });

      const rows = response.data.values || [];
      
      return rows.map((row, index) => ({
        id: `res_${restaurantId}_${index}`,
        fecha: row[0] || '',
        hora: row[1] || '',
        horario: row[2] || '',
        cliente: row[3] || '',
        telefono: row[4] || '',
        personas: parseInt(row[5]) || 0,
        mesa: row[6] || '',
        estado: (row[7] as 'pendiente' | 'confirmada' | 'cancelada') || 'pendiente',
        notas: '',
        creado: new Date().toISOString(),
        restaurante: restaurantName,
        restauranteId: restaurantId,
      }));
    } catch (error) {
      console.error(`Error leyendo reservas de ${restaurantName}:`, error);
      return [];
    }
  }

  // Leer todas las reservas de todos los restaurantes
  static async getAllReservas(): Promise<Reserva[]> {
    try {
      // Obtener lista de hojas
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });

      const sheetsList = response.data.sheets || [];
      const reservationSheets = sheetsList.filter(sheet => 
        sheet.properties?.title?.startsWith('Reservas_')
      );

      let allReservations: Reserva[] = [];

      for (const sheet of reservationSheets) {
        const sheetName = sheet.properties?.title || '';
        const restaurantName = sheetName.replace('Reservas_', '').replace(/_/g, ' ');
        const restaurantId = `rest_${restaurantName.toLowerCase().replace(/\s+/g, '_')}`;
        
        const reservations = await this.getReservas(restaurantId, restaurantName);
        allReservations = [...allReservations, ...reservations];
      }

      return allReservations;
    } catch (error) {
      console.error('Error leyendo todas las reservas:', error);
      return [];
    }
  }

  // Leer reservas por fecha de un restaurante específico
  static async getReservasPorFecha(fecha: string, restaurantId: string, restaurantName: string): Promise<Reserva[]> {
    const reservas = await this.getReservas(restaurantId, restaurantName);
    return reservas.filter(reserva => reserva.fecha === fecha);
  }

  // Verificar disponibilidad para un restaurante específico
  static async verificarDisponibilidad(fecha: string, hora: string, personas: number, restaurantId: string, restaurantName: string): Promise<boolean> {
    const reservas = await this.getReservasPorFecha(fecha, restaurantId, restaurantName);
    const reservasEnEsaHora = reservas.filter(r => r.hora === hora && r.estado === 'confirmada');
    
    // Simular capacidad máxima (puedes ajustar esto)
    const capacidadMaxima = 50; // personas
    const personasReservadas = reservasEnEsaHora.reduce((sum, r) => sum + r.personas, 0);
    
    return (personasReservadas + personas) <= capacidadMaxima;
  }

  // Crear nueva reserva
  static async crearReserva(reserva: Omit<Reserva, 'creado'>, spreadsheetId?: string): Promise<boolean> {
    try {
      if (!reserva.restauranteId || !reserva.restaurante) {
        throw new Error('restauranteId y restaurante son requeridos');
      }

      const sheetName = getSheetName();
      const targetSpreadsheetId = spreadsheetId || getRestaurantSpreadsheetId();
      // const reservaId = reserva.id || `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const nuevaFila = [
        reserva.fecha,
        reserva.hora,
        reserva.horario,
        reserva.cliente,
        reserva.telefono,
        reserva.personas.toString(),
        reserva.mesa || '',
        reserva.estado,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: targetSpreadsheetId,
        range: `${sheetName}!A:H`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [nuevaFila],
        },
      });

      console.log('✅ Reserva creada en Google Sheets:', reserva);
      return true;
    } catch (error) {
      console.error('❌ Error creando reserva en Google Sheets:', error);
      return false;
    }
  }

  // Actualizar estado de reserva
  static async actualizarEstadoReserva(cliente: string, telefono: string, nuevoEstado: string, restaurantId: string, restaurantName: string): Promise<boolean> {
    try {
      const reservas = await this.getReservas(restaurantId, restaurantName);
      const reservaIndex = reservas.findIndex(r => 
        r.cliente.toLowerCase() === cliente.toLowerCase() && 
        r.telefono === telefono
      );

      if (reservaIndex === -1) {
        console.log('❌ Reserva no encontrada');
        return false;
      }

      const sheetName = getSheetName();
      const filaIndex = reservaIndex + 2; // +2 porque empezamos desde fila 2
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!H${filaIndex}`, // Columna H es "estado"
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[nuevoEstado]],
        },
      });

      console.log('✅ Estado de reserva actualizado:', nuevoEstado);
      return true;
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      return false;
    }
  }

  // Buscar reserva por cliente
  static async buscarReserva(cliente: string, telefono: string, restaurantId: string, restaurantName: string): Promise<Reserva | null> {
    const reservas = await this.getReservas(restaurantId, restaurantName);
    return reservas.find(r => 
      r.cliente.toLowerCase() === cliente.toLowerCase() && 
      r.telefono === telefono
    ) || null;
  }

  // Obtener estadísticas de un restaurante específico
  static async getEstadisticas(restaurantId: string, restaurantName: string): Promise<{
    totalReservas: number;
    reservasHoy: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
  }> {
    const reservas = await this.getReservas(restaurantId, restaurantName);
    const hoy = new Date().toISOString().split('T')[0];
    
    return {
      totalReservas: reservas.length,
      reservasHoy: reservas.filter(r => r.fecha === hoy).length,
      reservasConfirmadas: reservas.filter(r => r.estado === 'confirmada').length,
      reservasPendientes: reservas.filter(r => r.estado === 'pendiente').length,
    };
  }

  // Obtener estadísticas globales de todos los restaurantes
  static async getEstadisticasGlobales(): Promise<{
    totalReservas: number;
    reservasHoy: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
    restaurantesActivos: number;
  }> {
    const reservas = await this.getAllReservas();
    const hoy = new Date().toISOString().split('T')[0];
    
    // Contar restaurantes únicos
    const restaurantesUnicos = new Set(reservas.map(r => r.restauranteId));
    
    return {
      totalReservas: reservas.length,
      reservasHoy: reservas.filter(r => r.fecha === hoy).length,
      reservasConfirmadas: reservas.filter(r => r.estado === 'confirmada').length,
      reservasPendientes: reservas.filter(r => r.estado === 'pendiente').length,
      restaurantesActivos: restaurantesUnicos.size,
    };
  }
}

// Función para verificar si una hoja de restaurante existe
export async function verificarHojaRestaurante(): Promise<boolean> {
  try {
    const sheetName = getSheetName();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetExists = response.data.sheets?.some(sheet => 
      sheet.properties?.title === sheetName
    );

    return sheetExists || false;
  } catch (error) {
    console.error('❌ Error verificando hoja del restaurante:', error);
    return false;
  }
}

// Función para inicializar hoja de restaurante si no existe
export async function inicializarHojaRestaurante(): Promise<void> {
  try {
    const sheetName = getSheetName();
    
    // Verificar si la hoja existe
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetExists = response.data.sheets?.some(sheet => 
      sheet.properties?.title === sheetName
    );

    if (!sheetExists) {
      // Crear la hoja
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          }],
        },
      });

      // Agregar encabezados
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Fecha', 'Hora', 'Horario', 'Cliente', 'Teléfono', 'Personas', 'Mesa', 'Estado']],
        },
      });

      console.log(`✅ Hoja de Google Sheets inicializada`);
    }
  } catch (error) {
    console.error(`❌ Error inicializando hoja:`, error);
  }
}