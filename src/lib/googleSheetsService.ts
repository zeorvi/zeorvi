import { google } from 'googleapis';
import { getSpreadsheetId } from './restaurantSheets';

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
  Estado: 'pendiente' | 'confirmada' | 'cancelada' | 'Pendiente' | 'Confirmada' | 'Cancelada';
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

// Función centralizada para obtener cliente de Google Sheets
function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export class GoogleSheetsService {
  static async getClient() {
    return getSheetsClient();
  }

  static getSheetId(restaurantId: string): string {
    return getSpreadsheetId(restaurantId);
  }

  // ✅ Leer reservas
  static async getReservas(restaurantId: string): Promise<Reserva[]> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Reservas!A2:K",
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

  // ✅ Añadir nueva reserva con validación de disponibilidad
  static async addReserva(restaurantId: string, reserva: Omit<Reserva, 'ID' | 'Creado'>): Promise<{ success: boolean; ID?: string; error?: string }> {
    try {
      // VALIDAR DISPONIBILIDAD ANTES DE CREAR LA RESERVA
      const disponibilidad = await this.verificarDisponibilidad(
        restaurantId,
        reserva.Fecha,
        reserva.Hora,
        reserva.Personas,
        reserva.Zona
      );

      if (!disponibilidad.disponible) {
        console.warn(`❌ Mesa no disponible para reserva: ${disponibilidad.mensaje}`);
        return { 
          success: false, 
          error: disponibilidad.mensaje 
        };
      }

      // Si la mesa especificada no está disponible, usar la mesa sugerida
      const mesaFinal = disponibilidad.mesa || reserva.Mesa;
      
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const reservaId = `R${Date.now()}`;
      const creado = new Date().toISOString();
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Reservas!A:K",
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
            mesaFinal, // Usar la mesa validada
            reserva.Estado,
            reserva.Notas || '',
            creado
          ]]
        },
      });
      
      console.log(`✅ Reserva creada exitosamente: ${reserva.Cliente} - Mesa ${mesaFinal} - ${reserva.Fecha} ${reserva.Hora}`);
      return { success: true, ID: reservaId };
    } catch (error) {
      console.error(`Error creando reserva para ${restaurantId}:`, error);
      return { success: false, error: 'Error interno del servidor' };
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
        range: "Reservas!A2:K",
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
        range: `Reservas!A${rowIndex}:K${rowIndex}`,
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

  // ✅ Leer días cerrados
  static async getDiasCerrados(restaurantId: string): Promise<string[]> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Configuracion!A2:B",
      });
      
      const values = res.data.values || [];
      const diasCerradosRow = values.find(row => row[0] === 'dias_cerrados' && row[1]);
      
      if (diasCerradosRow && diasCerradosRow[1]) {
        // Parsear la cadena separada por comas
        const diasCerrados = diasCerradosRow[1].split(',').map((dia: string) => dia.trim().toLowerCase());
        return diasCerrados;
      }
      
      return [];
    } catch (error) {
      console.error(`Error leyendo días cerrados para ${restaurantId}:`, error);
      return ['martes']; // Valor por defecto
    }
  }

  // ✅ Leer horarios
  static async getHorarios(restaurantId: string): Promise<Array<{ Dia: string; Inicio: string; Fin: string }>> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Horarios!A2:C",
      });
      
      const values = res.data.values || [];
      return values.map(row => ({
        Dia: row[0] || '',
        Inicio: row[1] || '',
        Fin: row[2] || '',
      }));
    } catch (error) {
      console.error(`Error leyendo horarios para ${restaurantId}:`, error);
      return [];
    }
  }

  // ✅ Guardar días cerrados
  static async saveDiasCerrados(restaurantId: string, diasCerrados: string[]): Promise<{ success: boolean }> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      // Primero, verificar si la hoja "Configuracion" existe, si no, crearla
      try {
        await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "Configuracion!A1",
        });
      } catch (error) {
        // Si la hoja no existe, crearla
        console.log('Creando hoja Configuracion...');
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: 'Configuracion'
                }
              }
            }]
          }
        });
      }
      
      // Crear o actualizar la hoja de configuración
      const configData = [
        ['Configuracion', 'Valor'],
        ['dias_cerrados', diasCerrados.join(',')]
      ];
      
      // Limpiar la hoja y escribir nueva configuración
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: "Configuracion!A:B",
      });
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Configuracion!A1:B2",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: configData
        }
      });
      
      console.log(`✅ Días cerrados guardados para ${restaurantId}: ${diasCerrados.join(', ')}`);
      return { success: true };
    } catch (error) {
      console.error(`Error guardando días cerrados para ${restaurantId}:`, error);
      return { success: false };
    }
  }

  // ✅ Verificar si el restaurante está abierto
  static async verificarRestauranteAbierto(
    restaurantId: string, 
    fecha: string, 
    hora: string
  ): Promise<{ abierto: boolean; mensaje: string; horarios?: Array<{ Turno: string; Inicio: string; Fin: string }> }> {
    try {
      // PRIMERO: Validar formato de fecha
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      if (!iso.test(fecha)) {
        return { abierto: false, mensaje: 'Fecha inválida (usa YYYY-MM-DD)' };
      }
      
      // Convertir fecha con ancla de mediodía para evitar problemas de zona horaria
      const fechaObj = new Date(`${fecha}T12:00:00`);
      if (isNaN(fechaObj.getTime())) {
        return { abierto: false, mensaje: 'Fecha inválida' };
      }
      
      const diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' });
      
      // Leer días cerrados desde Google Sheets
      const diasCerrados = await this.getDiasCerrados(restaurantId);
      
      if (diasCerrados.includes(diaSemana.toLowerCase())) {
        const diasTexto = diasCerrados.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        return {
          abierto: false,
          mensaje: `Restaurante cerrado los ${diasTexto}`
        };
      }

      const turnos = await this.getTurnos(restaurantId);
      
      if (turnos.length === 0) {
        return {
          abierto: true, // Si no hay horarios configurados, asumir que está abierto
          mensaje: 'Horarios no configurados, asumiendo que está abierto'
        };
      }

      // Verificar si la hora está dentro de algún turno
      const horaNum = parseInt(hora.split(':')[0]);
      
      for (const turno of turnos) {
        const inicioNum = parseInt(turno.Inicio.split(':')[0]);
        const finNum = parseInt(turno.Fin.split(':')[0]);
        
        if (horaNum >= inicioNum && horaNum < finNum) {
          return {
            abierto: true,
            mensaje: `Restaurante abierto en horario de ${turno.Turno}`,
            horarios: turnos
          };
        }
      }
      
      // Si no está en ningún turno, está cerrado
      const horariosTexto = turnos.map(t => `${t.Turno}: ${t.Inicio}-${t.Fin}`).join(', ');
      return {
        abierto: false,
        mensaje: `Restaurante cerrado. Horarios: ${horariosTexto}`,
        horarios: turnos
      };
      
    } catch (error) {
      console.error(`Error verificando horarios para ${restaurantId}:`, error);
      return {
        abierto: true, // En caso de error, asumir que está abierto
        mensaje: 'Error verificando horarios, asumiendo que está abierto'
      };
    }
  }

  // ✅ Calcular disponibilidad futura considerando liberación de mesas
  static async calcularDisponibilidadFutura(
    restaurantId: string,
    fecha: string,
    hora: string,
    personas: number,
    zona?: string
  ): Promise<{ disponible: boolean; mesa?: string; mensaje: string; alternativas?: string[] }> {
    try {
      console.log(`🔍 Calculando disponibilidad futura: ${restaurantId}, ${fecha}, ${hora}, ${personas}, ${zona}`);
      
      const mesas = await this.getMesas(restaurantId);
      const reservas = await this.getReservas(restaurantId);
      
      console.log(`🔍 Mesas encontradas:`, mesas.length);
      console.log(`🔍 Reservas encontradas:`, reservas.length);
      
      // Convertir fecha y hora a timestamp para cálculos
      const fechaHoraSolicitada = new Date(`${fecha}T${hora}:00`);
      
      // Filtrar mesas por zona y capacidad (tolerante a mayúsculas/minúsculas)
      let mesasDisponibles = mesas.filter(mesa => {
        const estadoOk = String(mesa.Estado || '').toLowerCase() === 'libre'; // tolera mayúsculas/minúsculas
        const zonaOk = !zona || String(mesa.Zona || '').toLowerCase() === String(zona).toLowerCase();
        return (mesa.Capacidad >= personas) && estadoOk && zonaOk;
      });
      
      // Filtrar por turno según la hora
      const turno = this.determinarTurno(hora);
      mesasDisponibles = mesasDisponibles.filter(mesa => 
        Array.isArray(mesa.Turnos) && mesa.Turnos.includes(turno)
      );
      
      // Verificar reservas existentes para esa fecha/hora
      const reservasExistentes = reservas.filter(reserva => 
        reserva.Fecha === fecha && 
        reserva.Hora === hora && 
        (reserva.Estado.toLowerCase() === 'confirmada' || reserva.Estado.toLowerCase() === 'pendiente')
      );
      
      // Verificar mesas que se liberarán antes de la hora solicitada
      const mesasQueSeLiberan = [];
      for (const reserva of reservas) {
        if (reserva.Estado.toLowerCase() === 'confirmada' || reserva.Estado.toLowerCase() === 'pendiente') {
          const fechaHoraReserva = new Date(`${reserva.Fecha}T${reserva.Hora}:00`);
          
          // Calcular cuándo se liberará la mesa (2 horas después)
          const fechaHoraLiberacion = new Date(fechaHoraReserva.getTime() + (2 * 60 * 60 * 1000));
          
          // Si la mesa se liberará antes de la hora solicitada, está disponible
          if (fechaHoraLiberacion <= fechaHoraSolicitada) {
            mesasQueSeLiberan.push({
              mesa: reserva.Mesa,
              liberacion: fechaHoraLiberacion.toISOString(),
              reservaAnterior: reserva
            });
          }
        }
      }
      
      // Combinar mesas libres con mesas que se liberarán
      const mesasOcupadas = reservasExistentes.map(r => r.Mesa);
      const mesasLibres = mesasDisponibles.filter(mesa => 
        !mesasOcupadas.includes(mesa.ID)
      );
      
      // Agregar mesas que se liberarán
      const mesasLiberadas = mesasQueSeLiberan.filter(libera => 
        !mesasOcupadas.includes(libera.mesa) &&
        mesasDisponibles.some(mesa => mesa.ID === libera.mesa)
      );
      
      const todasLasMesasDisponibles = [
        ...mesasLibres,
        ...mesasLiberadas.map(libera => 
          mesasDisponibles.find(mesa => mesa.ID === libera.mesa)
        ).filter(Boolean)
      ];
      
      if (todasLasMesasDisponibles.length > 0) {
        const mesaElegida = todasLasMesasDisponibles[0];
        
        if (!mesaElegida) {
          return {
            disponible: false,
            mensaje: 'No hay mesas disponibles para el turno solicitado'
          };
        }
        
        const esLiberada = mesasLiberadas.some(libera => libera.mesa === mesaElegida.ID);
        
        let mensaje = `Mesa ${mesaElegida.ID} disponible en ${mesaElegida.Zona} para ${personas} personas`;
        if (esLiberada) {
          const liberacion = mesasLiberadas.find(libera => libera.mesa === mesaElegida.ID);
          if (liberacion) {
            mensaje += ` (se liberará a las ${new Date(liberacion.liberacion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})`;
          }
        }
        
        return {
          disponible: true,
          mesa: mesaElegida.ID,
          mensaje: mensaje
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
    } catch (error: any) {
      console.error(`❌ Error calculando disponibilidad futura para ${restaurantId}:`, error);
      const reason = error?.message || String(error);
      return {
        disponible: false,
        mensaje: `Error al consultar datos de Google Sheets (${reason})`
      };
    }
  }

  // ✅ Verificar disponibilidad
  static async verificarDisponibilidad(
    restaurantId: string, 
    fecha: string, 
    hora: string, 
    personas: number, 
    zona?: string
  ): Promise<{ success: boolean; disponible: boolean; mesa?: string; mensaje: string; alternativas?: string[]; error?: string }> {
    try {
      console.log(`🔍 Verificando disponibilidad: ${restaurantId}, ${fecha}, ${hora}, ${personas}, ${zona}`);
      
      // Validaciones básicas
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        console.warn('⚠️ Fecha inválida recibida:', fecha);
        return {
          success: false,
          disponible: false,
          error: 'Fecha inválida o no resuelta. Debe estar en formato YYYY-MM-DD.',
          mensaje: 'Fecha inválida'
        };
      }

      if (!hora || !/^\d{1,2}:\d{2}$/.test(hora)) {
        console.warn('⚠️ Hora inválida recibida:', hora);
        return {
          success: false,
          disponible: false,
          error: 'Hora inválida. Debe estar en formato HH:MM (ej: 20:00).',
          mensaje: 'Hora inválida'
        };
      }

      if (!personas || isNaN(personas) || personas < 1) {
        console.warn('⚠️ Número de personas inválido:', personas);
        return {
          success: false,
          disponible: false,
          error: 'Número de personas inválido.',
          mensaje: 'Número de personas inválido'
        };
      }

      // 🔴 Si son más de 6 personas, requerir gestión manual
      if (personas > 6) {
        console.warn('⚠️ Reserva grande detectada, requiere intervención humana:', personas);
        return {
          success: true,
          disponible: false,
          mensaje: `Para grupos de ${personas} personas, la reserva debe gestionarla un compañero.`,
        };
      }
      
      // PRIMERO: Verificar si el restaurante está abierto
      const horariosCheck = await this.verificarRestauranteAbierto(restaurantId, fecha, hora);
      console.log(`🔍 Horarios check:`, horariosCheck);
      
      if (!horariosCheck.abierto) {
        return {
          success: true,
          disponible: false,
          mensaje: horariosCheck.mensaje
        };
      }

      // Usar la nueva función de disponibilidad futura
      const resultado = await this.calcularDisponibilidadFutura(restaurantId, fecha, hora, personas, zona);
      console.log(`🔍 Resultado disponibilidad:`, resultado);
      
      return {
        success: true,
        ...resultado
      };
    } catch (error) {
      console.error(`❌ Error verificando disponibilidad para ${restaurantId}:`, error);
      return {
        success: false,
        disponible: false,
        mensaje: 'Error verificando disponibilidad',
        error: error instanceof Error ? error.message : 'Error desconocido'
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

  // ✅ Obtener reservas por fecha
  static async getReservasPorFecha(fecha: string, restaurantId: string): Promise<Reserva[]> {
    try {
      const reservas = await this.getReservas(restaurantId);
      return reservas.filter(reserva => reserva.Fecha === fecha);
    } catch (error) {
      console.error(`Error obteniendo reservas por fecha para ${restaurantId}:`, error);
      return [];
    }
  }

  // ✅ Obtener todas las reservas de todos los restaurantes
  static async getAllReservas(): Promise<Reserva[]> {
    try {
      // Esta función requeriría acceso a todos los restaurantes
      // Por ahora, retornamos un array vacío o implementamos la lógica según necesidad
      console.warn('getAllReservas no implementado completamente - requiere configuración de múltiples restaurantes');
      return [];
    } catch (error) {
      console.error('Error obteniendo todas las reservas:', error);
      return [];
    }
  }

  // ✅ Crear reserva (alias para addReserva con parámetros simplificados)
  static async crearReserva(
    restaurantId: string,
    fecha: string,
    hora: string,
    cliente: string,
    telefono: string,
    personas: number,
    zona?: string,
    notas?: string
  ): Promise<{ success: boolean; ID?: string; error?: string; mensaje?: string }> {
    const reservaData = {
      Fecha: fecha,
      Hora: hora,
      Turno: this.determinarTurno(hora),
      Cliente: cliente,
      Telefono: telefono,
      Personas: personas,
      Zona: zona || 'Salón Principal',
      Mesa: '',
      Estado: 'confirmada' as const,
      Notas: notas || ''
    };
    
    const result = await this.addReserva(restaurantId, reservaData);
    
    return {
      ...result,
      mensaje: result.success ? 
        `Reserva confirmada para ${cliente} el ${fecha} a las ${hora}` :
        'Error creando la reserva'
    };
  }

  // ✅ Eliminar reserva completamente
  static async eliminarReserva(restaurantId: string, id: string): Promise<{ success: boolean }> {
    try {
      const sheets = await this.getClient();
      const sheetId = this.getSheetId(restaurantId);
      
      // Obtener todas las reservas para encontrar la fila
      const reservas = await this.getReservas(restaurantId);
      const reservaIndex = reservas.findIndex(r => r.ID === id);
      
      if (reservaIndex === -1) {
        return { success: false };
      }
      
      // La fila en Google Sheets es reservaIndex + 2 (porque empieza en fila 2 y es 0-indexed)
      const rowNumber = reservaIndex + 2;
      
      // Obtener información de las hojas para encontrar el sheetId correcto
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const reservasSheet = spreadsheet.data.sheets?.find(sheet => 
        sheet.properties?.title === 'Reservas'
      );
      
      if (!reservasSheet?.properties?.sheetId) {
        console.error('No se encontró la hoja "Reservas"');
        return { success: false };
      }
      
      // Eliminar la fila completa
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: reservasSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowNumber - 1, // 0-indexed
                endIndex: rowNumber
              }
            }
          }]
        }
      });
      
      console.log(`✅ Reserva ${id} eliminada completamente de Google Sheets`);
      return { success: true };
    } catch (error) {
      console.error(`Error eliminando reserva ${id} para ${restaurantId}:`, error);
      return { success: false };
    }
  }

  // ✅ Actualizar estado de reserva por cliente y teléfono
  static async actualizarEstadoReserva(cliente: string, telefono: string, nuevoEstado: string, restaurantId: string): Promise<{ success: boolean }> {
    try {
      const reservas = await this.getReservas(restaurantId);
      const reserva = reservas.find(r => 
        r.Cliente.toLowerCase() === cliente.toLowerCase() && 
        r.Telefono === telefono
      );
      
      if (!reserva || !reserva.ID) {
        return { success: false };
      }
      
      return this.updateReserva(restaurantId, reserva.ID, { Estado: nuevoEstado as 'pendiente' | 'confirmada' | 'cancelada' });
    } catch (error) {
      console.error(`Error actualizando estado de reserva para ${restaurantId}:`, error);
      return { success: false };
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

  // ✅ Obtener horarios y días cerrados combinados
  static async obtenerHorariosYDiasCerrados(restaurantId: string): Promise<{
    success: boolean;
    diasCerrados: string[];
    horarios: Array<{ Dia: string; Inicio: string; Fin: string }>;
    mensaje: string;
  }> {
    try {
      const diasCerrados = await this.getDiasCerrados(restaurantId);
      const horarios = await this.getHorarios(restaurantId);
      
      return {
        success: true,
        diasCerrados,
        horarios,
        mensaje: `Días cerrados: ${diasCerrados.join(', ')}. Horarios disponibles.`
      };
    } catch (error) {
      console.error(`Error obteniendo horarios y días cerrados para ${restaurantId}:`, error);
      return {
        success: false,
        diasCerrados: [],
        horarios: [],
        mensaje: 'Error obteniendo información del restaurante'
      };
    }
  }

  // ✅ Cancelar reserva por cliente y teléfono
  static async cancelarReserva(restaurantId: string, cliente: string, telefono: string): Promise<{
    success: boolean;
    mensaje: string;
  }> {
    try {
      const reserva = await this.buscarReserva(restaurantId, cliente, telefono);
      
      if (!reserva || !reserva.ID) {
        return {
          success: false,
          mensaje: 'No se encontró ninguna reserva para cancelar'
        };
      }
      
      const updateResult = await this.updateReserva(restaurantId, reserva.ID, { Estado: 'cancelada' });
      
      return {
        success: updateResult.success,
        mensaje: updateResult.success ? 
          `Reserva cancelada correctamente para ${cliente}` : 
          'Error cancelando la reserva'
      };
    } catch (error) {
      console.error(`Error cancelando reserva para ${restaurantId}:`, error);
      return {
        success: false,
        mensaje: 'Error cancelando la reserva'
      };
    }
  }
}
