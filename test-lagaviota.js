// Script de prueba para verificar el sistema
const { productionDb } = require('./src/lib/database/production');

async function testSystem() {
  try {
    console.log('🧪 Probando sistema de La Gaviota...');
    
    // Verificar si hay mesas para rest_003
    const tables = await productionDb.getTableStates('rest_003');
    console.log('📊 Mesas encontradas:', tables.length);
    
    if (tables.length === 0) {
      console.log('⚠️ No hay mesas configuradas. Inicializando...');
      
      // Inicializar mesas por defecto para La Gaviota
      const defaultTables = [
        { id: 'M1', name: 'Mesa 1', capacity: 4, location: 'Terraza' },
        { id: 'M2', name: 'Mesa 2', capacity: 2, location: 'Terraza' },
        { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal' },
        { id: 'M4', name: 'Mesa 4', capacity: 4, location: 'Salón Principal' },
        { id: 'M5', name: 'Mesa 5', capacity: 2, location: 'Comedor Privado' },
        { id: 'M6', name: 'Mesa 6', capacity: 8, location: 'Terraza' },
        { id: 'M7', name: 'Mesa 7', capacity: 4, location: 'Salón Principal' },
        { id: 'M8', name: 'Mesa 8', capacity: 2, location: 'Comedor Privado' },
      ];
      
      await productionDb.initializeTables('rest_003', defaultTables);
      console.log('✅ Mesas inicializadas correctamente');
    }
    
    // Obtener métricas
    const metrics = await productionDb.getCurrentMetrics('rest_003');
    console.log('📈 Métricas:', metrics);
    
    // Obtener horario
    const schedule = await productionDb.getRestaurantSchedule('rest_003');
    console.log('🕒 Horario:', schedule.length, 'días configurados');
    
    console.log('🎉 Sistema funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSystem();
