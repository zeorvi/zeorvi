import { google } from 'googleapis';

// Configurar autenticación
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS_PATH || 'google-credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

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

export class RestaurantSheetsManager {
  /**
   * Crear un Google Sheets completamente nuevo para un restaurante
   */
  static async createRestaurantSheets(config: RestaurantConfig): Promise<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    success: boolean;
  }> {
    try {
      console.log(`🏪 Creando Google Sheets independiente para: ${config.name}`);

      // 1. Crear nuevo archivo de Google Sheets
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Restaurante ${config.name} - Sistema de Reservas`,
          },
        },
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId!;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      console.log(`✅ Google Sheets creado: ${spreadsheetUrl}`);

      // 2. Configurar permisos del archivo
      await this.setupFilePermissions(spreadsheetId, config);

      // 3. Crear hojas dentro del nuevo Google Sheets
      await this.createSheetsInNewFile(spreadsheetId, config);

      // 4. Configurar datos iniciales
      await this.setupInitialData(spreadsheetId, config);

      return {
        spreadsheetId,
        spreadsheetUrl,
        success: true
      };

    } catch (error) {
      console.error(`❌ Error creando Google Sheets para ${config.name}:`, error);
      return {
        spreadsheetId: '',
        spreadsheetUrl: '',
        success: false
      };
    }
  }

  /**
   * Configurar permisos del archivo de Google Sheets
   */
  private static async setupFilePermissions(spreadsheetId: string, config: RestaurantConfig): Promise<void> {
    try {
      // Hacer el archivo accesible para el service account
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // Email del service account
        },
      });

      // Opcional: Hacer el archivo público para lectura (si quieres que el restaurante pueda verlo)
      // await drive.permissions.create({
      //   fileId: spreadsheetId,
      //   requestBody: {
      //     role: 'reader',
      //     type: 'anyone',
      //   },
      // });

      console.log(`✅ Permisos configurados para ${config.name}`);
    } catch (error) {
      console.error(`❌ Error configurando permisos:`, error);
    }
  }

  /**
   * Crear las hojas dentro del nuevo archivo de Google Sheets
   */
  private static async createSheetsInNewFile(spreadsheetId: string, config: RestaurantConfig): Promise<void> {
    try {
      // Eliminar la hoja por defecto
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const defaultSheet = spreadsheet.data.sheets?.find(sheet => 
        sheet.properties?.title === 'Sheet1'
      );

      if (defaultSheet) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              deleteSheet: {
                sheetId: defaultSheet.properties?.sheetId,
              },
            }],
          },
        });
      }

      // Crear hojas específicas del restaurante
      const sheetsToCreate = [
        { title: 'Reservas', rows: 1000 },
        { title: 'Mesas', rows: 100 },
        { title: 'Horarios', rows: 10 },
        { title: 'Disponibilidad', rows: 5000 },
        { title: 'Configuración', rows: 50 },
        { title: 'Retell AI', rows: 50 }
      ];

      const requests = sheetsToCreate.map(sheet => ({
        addSheet: {
          properties: {
            title: sheet.title,
            gridProperties: {
              rowCount: sheet.rows,
              columnCount: 10,
            },
          },
        },
      }));

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });

      console.log(`✅ Hojas creadas en Google Sheets de ${config.name}`);
    } catch (error) {
      console.error(`❌ Error creando hojas:`, error);
    }
  }

  /**
   * Configurar datos iniciales en las hojas
   */
  private static async setupInitialData(spreadsheetId: string, config: RestaurantConfig): Promise<void> {
    try {
      // 1. Configurar hoja de Reservas
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Reservas!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Fecha', 'Hora', 'Horario', 'Cliente', 'Teléfono', 'Personas', 'Mesa', 'Estado']],
        },
      });

      // Agregar reserva de ejemplo
      const hoy = new Date().toISOString().split('T')[0];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Reservas!A2:H2',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[hoy, '20:00', '20:00', 'Cliente Ejemplo', '555-0000', '4', 'Mesa 1', 'confirmada']],
        },
      });

      // 2. Configurar hoja de Mesas
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Mesas!A1:E1',
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
        spreadsheetId,
        range: `Mesas!A2:E${mesasData.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: mesasData,
        },
      });

      // 3. Configurar hoja de Horarios
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Horarios!A1:D1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Día', 'Hora Apertura', 'Hora Cierre', 'Abierto']],
        },
      });

      const horariosData = config.schedules.map(schedule => [
        schedule.day,
        schedule.openTime,
        schedule.closeTime,
        schedule.isOpen ? 'SÍ' : 'NO'
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Horarios!A2:D${horariosData.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: horariosData,
        },
      });

      // 4. Configurar hoja de Configuración
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Configuración!A1:C1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Configuración', 'Valor', 'Descripción']],
        },
      });

      const configData = [
        ['Restaurant ID', config.id, 'ID único del restaurante'],
        ['Restaurant Name', config.name, 'Nombre del restaurante'],
        ['Address', config.address, 'Dirección del restaurante'],
        ['Phone', config.phone, 'Teléfono del restaurante'],
        ['Email', config.email, 'Email del restaurante'],
        ['Capacity', config.capacity.toString(), 'Capacidad total del restaurante'],
        ['Features', config.features.join(', '), 'Características del restaurante'],
        ['Spreadsheet ID', spreadsheetId, 'ID del Google Sheets'],
        ['Created Date', new Date().toISOString(), 'Fecha de creación'],
        ['Status', 'Active', 'Estado del restaurante']
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Configuración!A2:C${configData.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: configData,
        },
      });

      // 5. Configurar hoja de Retell AI
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Retell AI!A1:C1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Configuración', 'Valor', 'Descripción']],
        },
      });

      const retellData = [
        ['Agent ID', `${config.id}_agent`, 'ID del agente de Retell AI'],
        ['Restaurant ID', config.id, 'ID del restaurante'],
        ['Restaurant Name', config.name, 'Nombre del restaurante'],
        ['Webhook URL', `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`, 'URL del webhook'],
        ['Spreadsheet ID', spreadsheetId, 'ID del Google Sheets'],
        ['API Endpoint', `/api/restaurants/${config.id}/reservations`, 'Endpoint de reservas'],
        ['Status', 'Ready', 'Estado de configuración'],
        ['Created Date', new Date().toISOString(), 'Fecha de configuración']
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Retell AI!A2:C${retellData.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: retellData,
        },
      });

      console.log(`✅ Datos iniciales configurados para ${config.name}`);
    } catch (error) {
      console.error(`❌ Error configurando datos iniciales:`, error);
    }
  }

  /**
   * Obtener información de un Google Sheets de restaurante
   */
  static async getRestaurantSheetsInfo(spreadsheetId: string): Promise<{
    title: string;
    url: string;
    sheets: string[];
    lastModified: string;
  } | null> {
    try {
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheetsList = spreadsheet.data.sheets?.map(sheet => 
        sheet.properties?.title || ''
      ) || [];

      return {
        title: spreadsheet.data.properties?.title || '',
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        sheets: sheetsList,
        lastModified: spreadsheet.data.properties?.timeZone || new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error obteniendo información del Google Sheets:`, error);
      return null;
    }
  }

  /**
   * Eliminar Google Sheets de un restaurante
   */
  static async deleteRestaurantSheets(spreadsheetId: string): Promise<boolean> {
    try {
      await drive.files.delete({
        fileId: spreadsheetId,
      });

      console.log(`✅ Google Sheets eliminado: ${spreadsheetId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error eliminando Google Sheets:`, error);
      return false;
    }
  }
}
