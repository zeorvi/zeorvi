/**
 * Script para probar el rendimiento del caché de Google Sheets
 * 
 * Uso:
 *   node test-cache-performance.js
 * 
 * Este script prueba:
 * 1. Primera carga (cache miss)
 * 2. Segunda carga (cache hit)
 * 3. Invalidación de caché
 * 4. Deduplicación de requests paralelas
 */

const BASE_URL = 'http://localhost:3000';
const RESTAURANT_ID = 'rest_001';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fetchReservas() {
  const start = Date.now();
  const response = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}`);
  const data = await response.json();
  const duration = Date.now() - start;
  
  return { data, duration };
}

async function getCache Stats() {
  const response = await fetch(`${BASE_URL}/api/cache/invalidate`);
  const data = await response.json();
  return data.stats;
}

async function invalidateCache(type = 'all') {
  const response = await fetch(`${BASE_URL}/api/cache/invalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurantId: RESTAURANT_ID, type })
  });
  return await response.json();
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log('\n🧪 PRUEBA DE RENDIMIENTO DEL CACHÉ DE GOOGLE SHEETS\n', 'bright');
  
  // Test 1: Cache Miss (primera carga)
  log('═══════════════════════════════════════════════════', 'cyan');
  log('📊 TEST 1: Primera carga (Cache Miss)', 'bright');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  const test1 = await fetchReservas();
  log(`✓ Duración: ${test1.duration}ms`, test1.duration > 500 ? 'yellow' : 'green');
  log(`✓ Reservas obtenidas: ${test1.data.total}`, 'green');
  log(`✓ Fuente: ${test1.data.source}`, 'blue');
  
  await sleep(1000);
  
  // Test 2: Cache Hit (segunda carga)
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('📊 TEST 2: Segunda carga (Cache Hit)', 'bright');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  const test2 = await fetchReservas();
  log(`✓ Duración: ${test2.duration}ms`, test2.duration < 200 ? 'green' : 'yellow');
  log(`✓ Reservas obtenidas: ${test2.data.total}`, 'green');
  log(`✓ Fuente: ${test2.data.source}`, 'blue');
  
  const improvement = ((test1.duration - test2.duration) / test1.duration * 100).toFixed(1);
  log(`\n🚀 Mejora de rendimiento: ${improvement}%`, improvement > 50 ? 'green' : 'yellow');
  
  await sleep(1000);
  
  // Test 3: Requests paralelas (deduplicación)
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('📊 TEST 3: Requests paralelas (Deduplicación)', 'bright');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  // Invalidar caché primero
  await invalidateCache();
  log('✓ Caché invalidado', 'yellow');
  
  await sleep(500);
  
  // Hacer 5 requests paralelas
  const parallelStart = Date.now();
  const parallelTests = await Promise.all([
    fetchReservas(),
    fetchReservas(),
    fetchReservas(),
    fetchReservas(),
    fetchReservas()
  ]);
  const parallelDuration = Date.now() - parallelStart;
  
  log(`✓ 5 requests paralelas completadas en: ${parallelDuration}ms`, 'green');
  log(`✓ Duración promedio por request: ${(parallelDuration / 5).toFixed(0)}ms`, 'blue');
  
  const durations = parallelTests.map(t => t.duration);
  log(`✓ Duraciones individuales: [${durations.join('ms, ')}ms]`, 'cyan');
  
  await sleep(1000);
  
  // Test 4: Estadísticas del caché
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('📊 TEST 4: Estadísticas del Caché', 'bright');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  const stats = await getCacheStats();
  log(`✓ Tamaño del caché: ${stats.cacheSize} items`, 'green');
  log(`✓ Requests pendientes: ${stats.pendingRequests}`, 'blue');
  log(`✓ Keys en caché:`, 'yellow');
  stats.keys.forEach(key => log(`  - ${key}`, 'cyan'));
  
  await sleep(1000);
  
  // Test 5: Invalidación de caché
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('📊 TEST 5: Invalidación de Caché', 'bright');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  const invalidateResult = await invalidateCache('all');
  log(`✓ ${invalidateResult.message}`, 'green');
  
  await sleep(500);
  
  const test5 = await fetchReservas();
  log(`✓ Primera carga después de invalidar: ${test5.duration}ms`, test5.duration > 500 ? 'yellow' : 'green');
  
  await sleep(500);
  
  const test6 = await fetchReservas();
  log(`✓ Segunda carga (con caché): ${test6.duration}ms`, test6.duration < 200 ? 'green' : 'yellow');
  
  // Resumen final
  log('\n═══════════════════════════════════════════════════', 'cyan');
  log('📈 RESUMEN DE RENDIMIENTO', 'bright');
  log('═══════════════════════════════════════════════════\n', 'cyan');
  
  log(`Cache Miss:     ${test1.duration}ms`, 'yellow');
  log(`Cache Hit:      ${test2.duration}ms`, 'green');
  log(`Mejora:         ${improvement}%`, 'green');
  log(`Paralelas (5):  ${parallelDuration}ms total`, 'blue');
  log(`Items en caché: ${stats.cacheSize}`, 'cyan');
  
  log('\n✅ Todas las pruebas completadas exitosamente!\n', 'green');
}

// Ejecutar tests
runTests().catch(error => {
  log(`\n❌ Error ejecutando tests: ${error.message}\n`, 'red');
  console.error(error);
  process.exit(1);
});

