// Script para verificar la estructura en producción
const API_URL = 'https://restaurante-ai-platform.vercel.app';
const RESTAURANT_ID = 'rest_003';

async function checkProductionSheets() {
  console.log('🔍 Verificando estructura en producción...\n');
  
  try {
    // Usar el endpoint de debug que acabamos de crear
    const response = await fetch(`${API_URL}/api/google-sheets/debug-structure?restaurantId=${RESTAURANT_ID}`);
    const data = await response.json();
    
    console.log('📊 Resultado del análisis:\n');
    console.log(JSON.stringify(data, null, 2));
    
    // Resumen visual
    console.log('\n\n📋 RESUMEN:');
    console.log('═══════════════════════════════════════════════\n');
    
    if (data.encabezados) {
      console.log('📌 ENCABEZADOS:');
      console.log(`   Total de columnas: ${data.encabezados.total}`);
      console.log('\n   Mapeo de columnas:');
      data.encabezados.mapeo.forEach(col => {
        const status = col.correcto ? '✅' : '❌';
        console.log(`   ${status} ${col.columna}: "${col.actual}" ${!col.correcto ? `(esperado: "${col.esperado}")` : ''}`);
      });
    }
    
    if (data.problemas && data.problemas.length > 0) {
      console.log('\n\n⚠️  PROBLEMAS ENCONTRADOS:');
      data.problemas.forEach((problema, idx) => {
        console.log(`   ${idx + 1}. ${problema}`);
      });
    }
    
    if (data.ultimasFilas) {
      console.log(`\n\n📊 ÚLTIMAS ${data.ultimasFilas.analizadas.length} FILAS:`);
      data.ultimasFilas.analizadas.forEach(fila => {
        console.log(`\n   Fila ${fila.fila}:`);
        console.log(`   - Total columnas con datos: ${fila.totalColumnas}`);
        console.log(`   - Primera columna con datos: ${fila.primeraColumnaConDatos === 0 ? 'A (correcto)' : String.fromCharCode(65 + fila.primeraColumnaConDatos) + ' (INCORRECTO)'}`);
        
        // Mostrar los primeros valores
        const estructura = fila.estructura;
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
          if (estructura[col] && estructura[col].value) {
            console.log(`      ${col} (${estructura[col].header}): ${estructura[col].value}`);
          }
        });
      });
    }
    
    console.log('\n\n═══════════════════════════════════════════════');
    console.log(data.diagnostico);
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductionSheets();

