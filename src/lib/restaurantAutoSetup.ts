import { GoogleSheetsService } from './googleSheetsService';
import { google } from 'googleapis';

// Configuración de Google Sheets
const SHEET_ID = process.env.GOOGLE_SHEETS_ID || 'tu_id_de_la_hoja';
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH || 'google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export interface RestaurantConfig {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  tables: TableConfig[];
  schedules: ScheduleConfig[];
  features: string[];
}

export interface TableConfig {
  id: string;
  number: string;
  capacity: number;
  location: string;
  type: 'indoor' | 'outdoor' | 'private';
}

export interface ScheduleConfig {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export class RestaurantAutoSetup {
  /**
   * Crear configuración completa de restaurante automáticamente
   */
  static async createRestaurantSetup(config: RestaurantConfig): Promise<boolean> {
    try {
      console.log(`🏪 Creando configuración automática para: ${config.name}`);

      // 1. Crear hoja de reservas
      await this.createReservationsSheet(config);

      // 2. Crear hoja de mesas
      await this.createTablesSheet(config);

      // 3. Crear hoja de horarios
      await this.createSchedulesSheet(config);

      // 4. Crear hoja de disponibilidad
      await this.createAvailabilitySheet(config);

      // 5. Crear configuración de Retell AI
      await this.createRetellConfig(config);

      console.log(`✅ Configuración completa creada para ${config.name}`);
      return true;

    } catch (error) {
      console.error(`❌ Error creando configuración para ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Crear hoja de reservas para el restaurante
   */
  private static async createReservationsSheet(config: RestaurantConfig): Promise<void> {
    const sheetName = `Reservas_${config.name.replace(/\s+/g, '_')}`;
    
    try {
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

      // Agregar datos de ejemplo
      const hoy = new Date().toISOString().split('T')[0];
      const ejemploReserva = [
        hoy,
        '20:00',
        '20:00',
        'Cliente Ejemplo',
        '555-0000',
        '4',
        'Mesa 1',
        'confirmada'
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:H`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [ejemploReserva],
        },
      });

      console.log(`✅ Hoja de reservas creada: ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error creando hoja de reservas:`, error);
    }
  }

  /**
   * Crear hoja de mesas para el restaurante
   */
  private static async createTablesSheet(config: RestaurantConfig): Promise<void> {
    const sheetName = `Mesas_${config.name.replace(/\s+/g, '_')}`;
    
    try {
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
        range: `${sheetName}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['ID', 'Numero', 'Capacidad', 'Ubicación', 'Tipo']],
        },
      });

      // Agregar mesas del restaurante
      const mesasData = config.tables.map(table => [
        table.id,
        table.number,
        table.capacity.toString(),
        table.location,
        table.type
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A2:E${mesasData.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: mesasData,
        },
      });

      console.log(`✅ Hoja de mesas creada: ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error creando hoja de mesas:`, error);
    }
  }

  /**
   * Crear hoja de horarios para el restaurante
   */
  private static async createSchedulesSheet(config: RestaurantConfig): Promise<void> {
    const sheetName = `Horarios_${config.name.replace(/\s+/g, '_')}`;
    
    try {
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
        range: `${sheetName}!A1:D1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Día', 'Hora Apertura', 'Hora Cierre', 'Abierto']],
        },
      });

      // Agregar horarios del restaurante
      const horariosData = config.schedules.map(schedule => [
        schedule.day,
        schedule.openTime,
        schedule.closeTime,
        schedule.isOpen ? 'SÍ' : 'NO'
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A2:D${horariosData.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: horariosData,
        },
      });

      console.log(`✅ Hoja de horarios creada: ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error creando hoja de horarios:`, error);
    }
  }

  /**
   * Crear hoja de disponibilidad para el restaurante
   */
  private static async createAvailabilitySheet(config: RestaurantConfig): Promise<void> {
    const sheetName = `Disponibilidad_${config.name.replace(/\s+/g, '_')}`;
    
    try {
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
        range: `${sheetName}!A1:D1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Fecha', 'Hora', 'Mesa', 'Disponible']],
        },
      });

      // Generar disponibilidad para los próximos 30 días
      const hoy = new Date();
      const disponibilidadData = [];

      for (let i = 0; i < 30; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];

        // Horarios típicos de restaurante
        const horarios = ['12:00', '13:00', '14:00', '15:00', '19:00', '20:00', '21:00', '22:00'];

        for (const hora of horarios) {
          for (const mesa of config.tables) {
            disponibilidadData.push([
              fechaStr,
              hora,
              mesa.number,
              'SÍ'
            ]);
          }
        }
      }

      // Escribir en lotes para evitar límites de API
      const batchSize = 1000;
      for (let i = 0; i < disponibilidadData.length; i += batchSize) {
        const batch = disponibilidadData.slice(i, i + batchSize);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A${i + 2}:D${i + batch.length + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: batch,
          },
        });
      }

      console.log(`✅ Hoja de disponibilidad creada: ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error creando hoja de disponibilidad:`, error);
    }
  }

  /**
   * Crear configuración de Retell AI para el restaurante
   */
  private static async createRetellConfig(config: RestaurantConfig): Promise<void> {
    const sheetName = `Retell_${config.name.replace(/\s+/g, '_')}`;
    
    try {
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
        range: `${sheetName}!A1:C1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Configuración', 'Valor', 'Descripción']],
        },
      });

      // Agregar configuración de Retell AI
      const retellConfig = [
        ['Agent ID', `rest_${config.id}_agent`, 'ID del agente de Retell AI'],
        ['Restaurant ID', config.id, 'ID único del restaurante'],
        ['Restaurant Name', config.name, 'Nombre del restaurante'],
        ['Phone', config.phone, 'Teléfono del restaurante'],
        ['Capacity', config.capacity.toString(), 'Capacidad total del restaurante'],
        ['Features', config.features.join(', '), 'Características del restaurante'],
        ['Webhook URL', `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`, 'URL del webhook'],
        ['Reservations Sheet', `Reservas_${config.name.replace(/\s+/g, '_')}`, 'Hoja de reservas'],
        ['Tables Sheet', `Mesas_${config.name.replace(/\s+/g, '_')}`, 'Hoja de mesas'],
        ['Schedules Sheet', `Horarios_${config.name.replace(/\s+/g, '_')}`, 'Hoja de horarios'],
        ['Availability Sheet', `Disponibilidad_${config.name.replace(/\s+/g, '_')}`, 'Hoja de disponibilidad']
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A2:C${retellConfig.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: retellConfig,
        },
      });

      console.log(`✅ Configuración de Retell AI creada: ${sheetName}`);
    } catch (error) {
      console.error(`❌ Error creando configuración de Retell AI:`, error);
    }
  }
}
