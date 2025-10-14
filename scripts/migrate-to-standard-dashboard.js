/**
 * Script de Migración al Dashboard Estándar
 * Migra todos los restaurantes existentes al dashboard optimizado
 */

const { migrateRestaurantsToStandardDashboard } = require('../src/lib/dashboardProtection');

async function runMigration() {
  console.log('🚀 Iniciando migración al dashboard estándar...');
  console.log('================================================');
  
  try {
    // Ejecutar migración
    migrateRestaurantsToStandardDashboard();
    
    console.log('================================================');
    console.log('✅ Migración completada exitosamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('- Todos los restaurantes ahora usan el dashboard estándar');
    console.log('- Configuración responsive aplicada');
    console.log('- Navegación sin iconos implementada');
    console.log('- Espaciado optimizado para todos los dispositivos');
    console.log('');
    console.log('🔒 Protección activada:');
    console.log('- Nuevos restaurantes usarán automáticamente el dashboard estándar');
    console.log('- Middleware protege contra configuraciones no estándar');
    console.log('- Validación automática en creación de restaurantes');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
