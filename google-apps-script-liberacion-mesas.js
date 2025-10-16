/**
 * 🚀 Script de Google Apps Script: Liberación Automática de Mesas
 * 
 * ⚙️ INSTALACIÓN:
 * 1. Abre tu Google Sheet de La Gaviota
 * 2. Menú: Extensiones → Apps Script
 * 3. Pega este código
 * 4. Guarda (Ctrl+S)
 * 5. Ejecuta "configurarTrigger" UNA VEZ para activar
 * 
 * ✅ QUÉ HACE:
 * - Se ejecuta cada 5 minutos automáticamente
 * - Busca reservas que pasaron más de 2 horas
 * - Cambia su estado de "Ocupada" o "Reservada" a "Completada"
 * - Registra todos los cambios en una hoja "Log_Liberaciones"
 */

const CONFIG = {
  HOJA_RESERVAS: 'Reservas',
  HOJA_LOG: 'Log_Liberaciones',
  HORAS_HASTA_LIBERAR: 2,
  ESTADO_LIBRE: 'Completada',
  ESTADOS_OCUPADOS: ['Ocupada', 'Reservada', 'ocupada', 'reservada', 'Confirmada', 'confirmada'],
};

/**
 * 🚀 LIBERACIÓN AUTOMÁTICA DE MESAS
 * Se ejecuta cada 5 minutos automáticamente.
 */
function liberarMesasAutomaticamente() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hoja = ss.getSheetByName(CONFIG.HOJA_RESERVAS);
    
    if (!hoja) {
      Logger.log('❌ No se encontró la hoja "Reservas"');
      return;
    }
    
    const datos = hoja.getDataRange().getValues();
    const ahora = new Date();
    let mesasLiberadas = 0;

    // Crear hoja de log si no existe
    let log = ss.getSheetByName(CONFIG.HOJA_LOG);
    if (!log) {
      log = ss.insertSheet(CONFIG.HOJA_LOG);
      log.appendRow(['Timestamp', 'Fecha Reserva', 'Hora', 'Cliente', 'Mesa', 'Estado Anterior', 'Horas Transcurridas']);
    }

    // Recorrer todas las filas (empezar en 1 para saltar encabezado)
    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];
      const fecha = fila[0]; // Columna A: Fecha
      const hora = fila[1];   // Columna B: Hora
      const cliente = fila[2]; // Columna C: Cliente
      const mesa = fila[6];    // Columna G: Mesa
      const estado = fila[7];  // Columna H: Estado

      // Validar que la fila tenga datos
      if (!fecha || !hora || !estado) continue;

      // Solo procesar reservas ocupadas/reservadas
      if (!CONFIG.ESTADOS_OCUPADOS.includes(estado)) continue;

      try {
        // Combinar fecha + hora
        const fechaHoraReserva = combinarFechaHora(fecha, hora);
        const horasTranscurridas = (ahora - fechaHoraReserva) / (1000 * 60 * 60);

        // Si pasaron más de 2 horas, liberar
        if (horasTranscurridas >= CONFIG.HORAS_HASTA_LIBERAR) {
          hoja.getRange(i + 1, 8).setValue(CONFIG.ESTADO_LIBRE); // Columna H (Estado)
          mesasLiberadas++;
          
          // Registrar en log
          log.appendRow([
            new Date(),
            Utilities.formatDate(new Date(fecha), "Europe/Madrid", "yyyy-MM-dd"),
            hora,
            cliente,
            mesa,
            estado,
            horasTranscurridas.toFixed(2),
          ]);
          
          Logger.log(`✅ Mesa ${mesa} liberada (reserva de ${cliente} a las ${hora})`);
        }
      } catch (error) {
        Logger.log(`⚠️ Error procesando fila ${i + 1}: ${error}`);
      }
    }

    Logger.log(`🎉 Proceso completado. ${mesasLiberadas} mesa(s) liberada(s).`);
    
  } catch (e) {
    Logger.log(`❌ Error en liberarMesasAutomaticamente: ${e}`);
    enviarNotificacionError(e);
  }
}

/**
 * 🔄 Une fecha + hora en un solo objeto Date
 */
function combinarFechaHora(fecha, hora) {
  try {
    // Si hora ya es un objeto Date con tiempo, usarlo directamente
    if (hora instanceof Date && hora.getHours() !== 0) {
      return hora;
    }
    
    // Convertir hora de texto (ej: "13:30" o "13.30") a horas y minutos
    let horaStr = hora.toString().replace('.', ':');
    const [h, m] = horaStr.split(':');
    
    // Crear nueva fecha combinada
    const fechaCombinada = new Date(fecha);
    fechaCombinada.setHours(parseInt(h) || 0);
    fechaCombinada.setMinutes(parseInt(m) || 0);
    fechaCombinada.setSeconds(0);
    
    return fechaCombinada;
  } catch (error) {
    Logger.log(`⚠️ Error en combinarFechaHora: ${error}`);
    return new Date(fecha);
  }
}

/**
 * 📬 Enviar correo si hay error (opcional)
 */
function enviarNotificacionError(error) {
  try {
    // Descomenta y configura tu email si quieres recibir notificaciones de errores
    // MailApp.sendEmail({
    //   to: 'tu-email@ejemplo.com',
    //   subject: '⚠️ Error en Liberación Automática de Mesas',
    //   body: `Se produjo un error:\n\n${error.stack || error}`,
    // });
    Logger.log(`📧 Notificación de error: ${error}`);
  } catch (e) {
    Logger.log('❌ Error al enviar notificación: ' + e);
  }
}

/**
 * ⚙️ Crear trigger automático cada 5 minutos
 * EJECUTA ESTA FUNCIÓN UNA VEZ para activar la liberación automática
 */
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
  
  Logger.log('✅ Trigger configurado: liberación automática cada 5 minutos');
  
  // Ejecutar una vez inmediatamente para probar
  liberarMesasAutomaticamente();
}

/**
 * 🗑️ Eliminar trigger automático
 * Ejecuta esto si quieres desactivar la liberación automática
 */
function eliminarTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'liberarMesasAutomaticamente') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('🗑️ Trigger eliminado');
    }
  });
}

/**
 * 🧪 Prueba manual del script
 */
function probarLiberacion() {
  Logger.log('🧪 Ejecutando prueba manual...');
  liberarMesasAutomaticamente();
  Logger.log('✅ Prueba completada. Revisa los logs arriba.');
}

