/**
 * SCRIPT DE LIBERACIÓN AUTOMÁTICA DE MESAS
 * Google Apps Script para ejecutarse cada 5 minutos
 * 
 * Funcionalidad:
 * - Revisa todas las reservas con estado "Ocupada" o "Reservada"
 * - Si han pasado 2 horas desde la hora de reserva, cambia a "Completada"
 * - Registra todos los cambios en un log
 * 
 * INSTALACIÓN:
 * 1. Abre tu Google Sheet
 * 2. Ve a Extensiones > Apps Script
 * 3. Pega este código
 * 4. Guarda el proyecto
 * 5. Configura un trigger:
 *    - Tipo: Controlado por tiempo
 *    - Intervalo: Cada 5 minutos
 */

// ============================================
// CONFIGURACIÓN - Ajusta estos valores
// ============================================

const CONFIG = {
  // ID de tu Google Sheet (lo puedes ver en la URL)
  SPREADSHEET_ID: '115x4UoUoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4',
  
  // Nombre de las hojas
  SHEET_RESERVAS: 'Reservas',
  SHEET_LOG: 'Log_Liberaciones', // Se creará si no existe
  
  // Tiempo de liberación en horas
  HORAS_HASTA_LIBERAR: 2,
  
  // Estados que deben ser liberados
  ESTADOS_OCUPADOS: ['Ocupada', 'Reservada', 'ocupada', 'reservada'],
  
  // Estado final después de liberar
  ESTADO_LIBRE: 'Completada'
};

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function liberarMesasAutomaticamente() {
  const inicio = new Date();
  console.log(`🚀 [${inicio.toISOString()}] Iniciando liberación automática de mesas...`);
  
  try {
    // Abrir el Google Sheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheetReservas = ss.getSheetByName(CONFIG.SHEET_RESERVAS);
    
    if (!sheetReservas) {
      throw new Error(`No se encontró la hoja "${CONFIG.SHEET_RESERVAS}"`);
    }
    
    // Obtener todas las reservas
    const data = sheetReservas.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Encontrar índices de columnas importantes
    const colIndices = {
      fecha: headers.indexOf('Fecha'),
      hora: headers.indexOf('Hora'),
      estado: headers.indexOf('Estado'),
      cliente: headers.indexOf('Cliente'),
      mesa: headers.indexOf('Mesa')
    };
    
    // Validar que existan todas las columnas
    Object.entries(colIndices).forEach(([nombre, indice]) => {
      if (indice === -1) {
        throw new Error(`No se encontró la columna "${nombre}" en la hoja de Reservas`);
      }
    });
    
    const ahora = new Date();
    let mesasLiberadas = 0;
    const cambios = [];
    
    // Revisar cada reserva
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque empezamos en fila 2 (después de headers)
      
      const fecha = row[colIndices.fecha];
      const hora = row[colIndices.hora];
      const estado = String(row[colIndices.estado] || '').trim();
      const cliente = row[colIndices.cliente];
      const mesa = row[colIndices.mesa];
      
      // Solo procesar reservas ocupadas
      if (!CONFIG.ESTADOS_OCUPADOS.includes(estado)) {
        return;
      }
      
      try {
        // Parsear fecha y hora de la reserva
        const fechaReserva = new Date(fecha);
        const [horaNum, minNum] = String(hora).split(':').map(Number);
        fechaReserva.setHours(horaNum, minNum, 0, 0);
        
        // Calcular tiempo transcurrido
        const horasTranscurridas = (ahora - fechaReserva) / (1000 * 60 * 60);
        
        // Si han pasado más de 2 horas, liberar la mesa
        if (horasTranscurridas >= CONFIG.HORAS_HASTA_LIBERAR) {
          // Cambiar el estado a "Completada"
          sheetReservas.getRange(rowNumber, colIndices.estado + 1).setValue(CONFIG.ESTADO_LIBRE);
          
          mesasLiberadas++;
          cambios.push({
            fecha: Utilities.formatDate(fechaReserva, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
            hora: hora,
            cliente: cliente,
            mesa: mesa,
            estadoAnterior: estado,
            horasTranscurridas: horasTranscurridas.toFixed(2),
            timestamp: Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
          });
          
          console.log(`✅ Mesa ${mesa} liberada - Cliente: ${cliente} - Transcurridas: ${horasTranscurridas.toFixed(2)}h`);
        }
      } catch (error) {
        console.error(`❌ Error procesando fila ${rowNumber}:`, error);
      }
    });
    
    // Registrar cambios en el log
    if (cambios.length > 0) {
      registrarEnLog(ss, cambios);
    }
    
    const duracion = (new Date() - inicio) / 1000;
    console.log(`✅ Proceso completado en ${duracion}s - Mesas liberadas: ${mesasLiberadas}`);
    
    return {
      success: true,
      mesasLiberadas: mesasLiberadas,
      duracion: duracion,
      cambios: cambios
    };
    
  } catch (error) {
    console.error('❌ Error en liberación automática:', error);
    
    // Enviar notificación por email (opcional)
    // enviarNotificacionError(error);
    
    throw error;
  }
}

// ============================================
// REGISTRAR EN LOG
// ============================================

function registrarEnLog(spreadsheet, cambios) {
  try {
    let sheetLog = spreadsheet.getSheetByName(CONFIG.SHEET_LOG);
    
    // Crear hoja de log si no existe
    if (!sheetLog) {
      sheetLog = spreadsheet.insertSheet(CONFIG.SHEET_LOG);
      sheetLog.appendRow(['Timestamp', 'Fecha Reserva', 'Hora', 'Cliente', 'Mesa', 'Estado Anterior', 'Horas Transcurridas']);
      sheetLog.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    }
    
    // Agregar cada cambio al log
    cambios.forEach(cambio => {
      sheetLog.appendRow([
        cambio.timestamp,
        cambio.fecha,
        cambio.hora,
        cambio.cliente,
        cambio.mesa,
        cambio.estadoAnterior,
        cambio.horasTranscurridas
      ]);
    });
    
    console.log(`📝 ${cambios.length} cambios registrados en log`);
  } catch (error) {
    console.error('❌ Error registrando en log:', error);
  }
}

// ============================================
// FUNCIÓN DE PRUEBA MANUAL
// ============================================

function probarScript() {
  console.log('🧪 Ejecutando prueba manual del script...');
  const resultado = liberarMesasAutomaticamente();
  console.log('Resultado:', resultado);
}

// ============================================
// CONFIGURAR TRIGGER AUTOMÁTICO
// ============================================

function configurarTrigger() {
  // Eliminar triggers existentes para evitar duplicados
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'liberarMesasAutomaticamente') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Crear nuevo trigger cada 5 minutos
  ScriptApp.newTrigger('liberarMesasAutomaticamente')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  console.log('✅ Trigger configurado para ejecutarse cada 5 minutos');
}

// ============================================
// NOTIFICACIÓN POR EMAIL (OPCIONAL)
// ============================================

function enviarNotificacionError(error) {
  const email = 'tu-email@ejemplo.com'; // Cambia esto por tu email
  const asunto = '⚠️ Error en Liberación Automática de Mesas';
  const mensaje = `
    Se produjo un error en el script de liberación automática:
    
    Error: ${error.message}
    Timestamp: ${new Date().toISOString()}
    
    Por favor revisa el script en Google Sheets.
  `;
  
  try {
    MailApp.sendEmail(email, asunto, mensaje);
  } catch (e) {
    console.error('No se pudo enviar email de notificación:', e);
  }
}

