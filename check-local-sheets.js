// Script para verificar la estructura en localhost
const API_URL = 'http://localhost:3000';
const RESTAURANT_ID = 'rest_003';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkLocalSheets() {
  console.log('🔍 Esperando a que el servidor esté listo...\n');
  
  // Esperar a que el servidor esté listo
  let ready = false;
  let attempts = 0;
  const maxAttempts = 20;
  
  while (!ready && attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        ready = true;
        console.log('✅ Servidor listo!\n');
      }
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        process.stdout.write(`⏳ Intento ${attempts}/${maxAttempts}...\r`);
        await wait(2000);
      }
    }
  }
  
  if (!ready) {
    console.error('❌ El servidor no está disponible después de esperar');
    return;
  }
  
  try {
    console.log('🔍 Consultando estructura de Google Sheets...\n');
    
    // Usar el endpoint de debug que acabamos de crear
    const response = await fetch(`${API_URL}/api/google-sheets/debug-structure?restaurantId=${RESTAURANT_ID}`);
    const data = await response.json();
    
    // Resumen visual
    console.log('📋 ANÁLISIS DE ESTRUCTURA DE GOOGLE SHEETS');
    console.log('═══════════════════════════════════════════════\n');
    
    if (data.encabezados) {
      console.log('📌 ENCABEZADOS DE LA HOJA "Reservas":');
      console.log(`   Total de columnas: ${data.encabezados.total}`);
      console.log('\n   Mapeo actual vs esperado:');
      console.log('   ─────────────────────────────────────────');
      data.encabezados.mapeo.forEach(col => {
        const status = col.correcto ? '✅' : '❌';
        const actual = col.actual || '(vacío)';
        const esperado = col.esperado || '(ninguno)';
        console.log(`   ${status} Columna ${col.columna}: "${actual}" ${!col.correcto ? `→ esperado: "${esperado}"` : ''}`);
      });
    }
    
    if (data.problemas && data.problemas.length > 0) {
      console.log('\n\n⚠️  PROBLEMAS DETECTADOS:');
      console.log('   ─────────────────────────────────────────');
      data.problemas.forEach((problema, idx) => {
        console.log(`   ${idx + 1}. ${problema}`);
      });
    } else {
      console.log('\n\n✅ No se detectaron problemas en los encabezados');
    }
    
    if (data.ultimasFilas && data.ultimasFilas.analizadas) {
      console.log(`\n\n📊 ANÁLISIS DE LAS ÚLTIMAS ${data.ultimasFilas.analizadas.length} FILAS:`);
      console.log('   ─────────────────────────────────────────');
      
      data.ultimasFilas.analizadas.forEach(fila => {
        const primeraDato = fila.primeraColumnaConDatos;
        const columnaInicio = primeraDato === 0 ? 'A ✅' : String.fromCharCode(65 + primeraDato) + ' ❌';
        
        console.log(`\n   📝 Fila ${fila.fila}:`);
        console.log(`      • Columnas con datos: ${fila.totalColumnas}`);
        console.log(`      • Primera columna con datos: ${columnaInicio}`);
        
        if (primeraDato !== 0) {
          console.log(`      ⚠️  LOS DATOS NO EMPIEZAN EN LA COLUMNA A!`);
        }
        
        // Mostrar primeras columnas con datos
        console.log('      • Contenido:');
        const estructura = fila.estructura;
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach(col => {
          if (estructura[col]) {
            const val = estructura[col].value || '(vacío)';
            const header = estructura[col].header;
            if (!estructura[col].isEmpty) {
              console.log(`         ${col} [${header}]: ${val}`);
            }
          }
        });
      });
    }
    
    console.log('\n\n═══════════════════════════════════════════════');
    console.log(`🎯 ${data.diagnostico}`);
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkLocalSheets();

