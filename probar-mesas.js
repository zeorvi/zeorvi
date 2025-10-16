/**
 * Script de prueba para verificar el servicio de mesas
 */

require('dotenv').config({ path: '.env.local' });
const { GoogleSheetsService } = require('./src/lib/googleSheetsService');

async function probarMesas() {
  console.log('🔍 Probando servicio de mesas...\n');

  try {
    console.log('📊 Obteniendo mesas para rest_003 (La Gaviota)...');
    const mesas = await GoogleSheetsService.getMesas('rest_003');
    
    console.log(`✅ ${mesas.length} mesas obtenidas\n`);
    
    if (mesas.length === 0) {
      console.log('⚠️  No se encontraron mesas');
      return;
    }
    
    console.log('📋 Detalles de las mesas:');
    mesas.forEach((mesa, index) => {
      console.log(`\nMesa ${index + 1}:`);
      console.log(`  ID: ${mesa.ID}`);
      console.log(`  Zona: ${mesa.Zona}`);
      console.log(`  Capacidad: ${mesa.Capacidad}`);
      console.log(`  Turnos: ${mesa.Turnos}`);
      console.log(`  Estado: ${mesa.Estado}`);
      console.log(`  Notas: ${mesa.Notas}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

probarMesas().catch(console.error);

