#!/usr/bin/env node

/**
 * Script para configurar el cron job de liberación automática de mesas
 * Ejecutar: node scripts/setup-table-cron.js
 */

const cron = require('node-cron');

// Función para liberar mesas
async function liberarMesas() {
  try {
    console.log('🔄 Ejecutando liberación automática de mesas...');
    
    const response = await fetch('http://localhost:3000/api/cron/liberar-mesas');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Mesas liberadas exitosamente:', data.resultados);
    } else {
      console.error('❌ Error liberando mesas:', data.error);
    }
  } catch (error) {
    console.error('❌ Error en liberación automática:', error.message);
  }
}

// Configurar cron job - cada hora
const task = cron.schedule('0 * * * *', () => {
  console.log(`\n⏰ ${new Date().toISOString()} - Ejecutando liberación automática de mesas`);
  liberarMesas();
}, {
  scheduled: false,
  timezone: "Europe/Madrid"
});

// También ejecutar cada 30 minutos para mayor frecuencia
const taskFrequent = cron.schedule('*/30 * * * *', () => {
  console.log(`\n⏰ ${new Date().toISOString()} - Verificación rápida de mesas`);
  liberarMesas();
}, {
  scheduled: false,
  timezone: "Europe/Madrid"
});

console.log('🚀 Sistema de liberación automática de mesas iniciado');
console.log('📅 Configurado para ejecutarse:');
console.log('   - Cada hora (minuto 0)');
console.log('   - Cada 30 minutos');
console.log('🌍 Zona horaria: Europe/Madrid');
console.log('\nPresiona Ctrl+C para detener...');

// Iniciar los cron jobs
task.start();
taskFrequent.start();

// Manejar cierre limpio
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo sistema de liberación automática...');
  task.stop();
  taskFrequent.stop();
  process.exit(0);
});

// Ejecutar una vez al inicio
liberarMesas();
