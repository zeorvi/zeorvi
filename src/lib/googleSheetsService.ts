import { google } from 'googleapis';

// Configuración de Google Sheets
const SHEET_ID = process.env.GOOGLE_SHEETS_ID || 'tu_id_de_la_hoja';
const SHEET_NAME = 'Reservas La Gaviota';

// Configurar autenticación
const auth = new google.auth.GoogleAuth({
  keyFile: 'google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface Reserva {
  fecha: string;
  hora: string;
  cliente: string;
  telefono: string;
  personas: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  notas?: string;
  creado: string;
}

export class GoogleSheetsService {
  // Leer todas las reservas
  static async getReservas(): Promise<Reserva[]> {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A2:H1000`, // Desde fila 2 hasta 1000
      });

      const rows = response.data.values || [];
      
      return rows.map((row, index) => ({
        fecha: row[0] || '',
        hora: row[1] || '',
        cliente: row[2] || '',
        telefono: row[3] || '',
        personas: parseInt(row[4]) || 0,
        estado: (row[5] as any) || 'pendiente',
        notas: row[6] || '',
        creado: row[7] || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error leyendo Google Sheets:', error);
      return [];
    }
  }

  // Leer reservas por fecha
  static async getReservasPorFecha(fecha: string): Promise<Reserva[]> {
    const reservas = await this.getReservas();
    return reservas.filter(reserva => reserva.fecha === fecha);
  }

  // Verificar disponibilidad
  static async verificarDisponibilidad(fecha: string, hora: string, personas: number): Promise<boolean> {
    const reservas = await this.getReservasPorFecha(fecha);
    const reservasEnEsaHora = reservas.filter(r => r.hora === hora && r.estado === 'confirmada');
    
    // Simular capacidad máxima (puedes ajustar esto)
    const capacidadMaxima = 50; // personas
    const personasReservadas = reservasEnEsaHora.reduce((sum, r) => sum + r.personas, 0);
    
    return (personasReservadas + personas) <= capacidadMaxima;
  }

  // Crear nueva reserva
  static async crearReserva(reserva: Omit<Reserva, 'creado'>): Promise<boolean> {
    try {
      const nuevaFila = [
        reserva.fecha,
        reserva.hora,
        reserva.cliente,
        reserva.telefono,
        reserva.personas.toString(),
        reserva.estado,
        reserva.notas || '',
        new Date().toISOString(),
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:H`,
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
  static async actualizarEstadoReserva(cliente: string, telefono: string, nuevoEstado: string): Promise<boolean> {
    try {
      const reservas = await this.getReservas();
      const reservaIndex = reservas.findIndex(r => 
        r.cliente.toLowerCase() === cliente.toLowerCase() && 
        r.telefono === telefono
      );

      if (reservaIndex === -1) {
        console.log('❌ Reserva no encontrada');
        return false;
      }

      const filaIndex = reservaIndex + 2; // +2 porque empezamos desde fila 2
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!F${filaIndex}`,
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
  static async buscarReserva(cliente: string, telefono: string): Promise<Reserva | null> {
    const reservas = await this.getReservas();
    return reservas.find(r => 
      r.cliente.toLowerCase() === cliente.toLowerCase() && 
      r.telefono === telefono
    ) || null;
  }

  // Obtener estadísticas
  static async getEstadisticas(): Promise<{
    totalReservas: number;
    reservasHoy: number;
    reservasConfirmadas: number;
    reservasPendientes: number;
  }> {
    const reservas = await this.getReservas();
    const hoy = new Date().toISOString().split('T')[0];
    
    return {
      totalReservas: reservas.length,
      reservasHoy: reservas.filter(r => r.fecha === hoy).length,
      reservasConfirmadas: reservas.filter(r => r.estado === 'confirmada').length,
      reservasPendientes: reservas.filter(r => r.estado === 'pendiente').length,
    };
  }
}

// Función para inicializar la hoja si no existe
export async function inicializarHoja(): Promise<void> {
  try {
    // Verificar si la hoja existe
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const sheetExists = response.data.sheets?.some(sheet => 
      sheet.properties?.title === SHEET_NAME
    );

    if (!sheetExists) {
      // Crear la hoja
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: SHEET_NAME,
              },
            },
          }],
        },
      });

      // Agregar encabezados
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Fecha', 'Hora', 'Cliente', 'Teléfono', 'Personas', 'Estado', 'Notas', 'Creado']],
        },
      });

      console.log('✅ Hoja de Google Sheets inicializada');
    }
  } catch (error) {
    console.error('❌ Error inicializando Google Sheets:', error);
  }
}
