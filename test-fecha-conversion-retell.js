/**
 * Script para probar la conversión de fechas en Retell
 * Ejecutar con: node test-fecha-conversion-retell.js
 */

const ENDPOINT = 'https://zeorvi.com/api/retell/functions/rest_003';

async function testFechaConversion(fechaInput, descripcion) {
  console.log(`\n🧪 Probando: ${descripcion}`);
  console.log(`   Fecha enviada: "${fechaInput}"`);
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function_name: 'verificar_disponibilidad',
        parameters: {
          fecha: fechaInput,
          hora: '20:00',
          personas: 2,
          zona: ''
        }
      })
    });

    const result = await response.json();
    
    if (result.success && result.result) {
      if (result.result.error) {
        console.log(`   ❌ Error: ${result.result.error}`);
        console.log(`   Mensaje: ${result.result.mensaje}`);
      } else {
        console.log(`   ✅ Fecha procesada correctamente`);
        console.log(`   Disponible: ${result.result.disponible ? 'Sí' : 'No'}`);
        console.log(`   Mensaje: ${result.result.mensaje}`);
      }
    } else {
      console.log(`   ❌ Error en la respuesta:`, result);
    }
  } catch (error) {
    console.log(`   ❌ Error de red:`, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando pruebas de conversión de fechas...\n');
  console.log('=' .repeat(60));

  // Pruebas de fechas relativas
  await testFechaConversion('hoy', 'Fecha relativa: hoy');
  await testFechaConversion('mañana', 'Fecha relativa: mañana');
  await testFechaConversion('pasado mañana', 'Fecha relativa: pasado mañana');
  
  // Pruebas de días de la semana
  await testFechaConversion('lunes', 'Día de la semana: lunes');
  await testFechaConversion('martes', 'Día de la semana: martes');
  await testFechaConversion('miércoles', 'Día de la semana: miércoles');
  await testFechaConversion('jueves', 'Día de la semana: jueves');
  await testFechaConversion('viernes', 'Día de la semana: viernes');
  await testFechaConversion('sábado', 'Día de la semana: sábado');
  await testFechaConversion('domingo', 'Día de la semana: domingo');
  
  // Pruebas con artículos y preposiciones
  await testFechaConversion('el sábado', 'Con artículo: el sábado');
  await testFechaConversion('el próximo viernes', 'Con preposición: el próximo viernes');
  
  // Prueba con fecha en formato YYYY-MM-DD (debe pasar sin conversión)
  const fecha2025 = '2025-10-18';
  await testFechaConversion(fecha2025, 'Fecha en formato YYYY-MM-DD: 2025-10-18');
  
  // Prueba con fecha inválida
  await testFechaConversion('asdfghjkl', 'Fecha inválida: asdfghjkl');
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Pruebas completadas\n');
}

// Ejecutar las pruebas
runAllTests().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error);
  process.exit(1);
});

