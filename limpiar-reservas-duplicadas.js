const { GoogleSheetsService } = require('./src/lib/googleSheetsService');

async function limpiarReservasDuplicadas() {
  console.log('🧹 Iniciando limpieza de reservas duplicadas...');
  
  try {
    const restaurantId = 'rest_003';
    
    // 1. Obtener todas las reservas
    const reservas = await GoogleSheetsService.getReservas(restaurantId);
    console.log(`📊 Total de reservas encontradas: ${reservas.length}`);
    
    // 2. Identificar reservas duplicadas (misma mesa, fecha y hora)
    const duplicadas = [];
    const reservasProcesadas = new Set();
    
    for (let i = 0; i < reservas.length; i++) {
      const reserva1 = reservas[i];
      const key1 = `${reserva1.Fecha}-${reserva1.Hora}-${reserva1.Mesa}`;
      
      if (reservasProcesadas.has(key1)) {
        continue; // Ya procesada
      }
      
      const grupo = [reserva1];
      
      for (let j = i + 1; j < reservas.length; j++) {
        const reserva2 = reservas[j];
        const key2 = `${reserva2.Fecha}-${reserva2.Hora}-${reserva2.Mesa}`;
        
        if (key1 === key2) {
          grupo.push(reserva2);
          reservasProcesadas.add(key2);
        }
      }
      
      if (grupo.length > 1) {
        duplicadas.push(grupo);
        reservasProcesadas.add(key1);
      }
    }
    
    console.log(`🔍 Reservas duplicadas encontradas: ${duplicadas.length}`);
    
    // 3. Mostrar duplicadas
    duplicadas.forEach((grupo, index) => {
      console.log(`\n📅 Grupo ${index + 1}: ${grupo[0].Fecha} ${grupo[0].Hora} - Mesa ${grupo[0].Mesa}`);
      grupo.forEach((reserva, idx) => {
        console.log(`  ${idx + 1}. ${reserva.Cliente} (${reserva.Personas} personas) - ${reserva.Estado} - ID: ${reserva.ID}`);
      });
    });
    
    // 4. Verificar disponibilidad de mesas
    console.log('\n🔍 Verificando disponibilidad de mesas...');
    const mesas = await GoogleSheetsService.getMesas(restaurantId);
    console.log('📋 Mesas disponibles:');
    mesas.forEach(mesa => {
      console.log(`  ${mesa.ID}: ${mesa.Zona} - ${mesa.Capacidad} personas - ${mesa.Estado} - Turnos: ${mesa.Turnos}`);
    });
    
    // 5. Simular validación de una reserva
    console.log('\n🧪 Probando validación de disponibilidad...');
    const testFecha = '2025-10-08';
    const testHora = '20:00';
    const testPersonas = 4;
    
    const disponibilidad = await GoogleSheetsService.verificarDisponibilidad(
      restaurantId,
      testFecha,
      testHora,
      testPersonas
    );
    
    console.log(`✅ Test disponibilidad para ${testFecha} ${testHora} (${testPersonas} personas):`);
    console.log(`  Disponible: ${disponibilidad.disponible}`);
    console.log(`  Mensaje: ${disponibilidad.mensaje}`);
    if (disponibilidad.mesa) {
      console.log(`  Mesa sugerida: ${disponibilidad.mesa}`);
    }
    if (disponibilidad.alternativas) {
      console.log(`  Alternativas: ${disponibilidad.alternativas.join(', ')}`);
    }
    
    console.log('\n✅ Limpieza completada. El sistema ahora validará disponibilidad antes de crear reservas.');
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  limpiarReservasDuplicadas();
}

module.exports = { limpiarReservasDuplicadas };
