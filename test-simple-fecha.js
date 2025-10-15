/**
 * Prueba simple para verificar la conversión de fecha
 */

const ENDPOINT = 'https://zeorvi.com/api/retell/functions/rest_003';

async function testSabado() {
  console.log('🧪 Probando conversión de "sábado"...\n');
  
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      function_name: 'verificar_disponibilidad',
      parameters: {
        fecha: 'sábado',
        hora: '20:00',
        personas: 2,
        zona: ''
      }
    })
  });

  const result = await response.json();
  console.log('📦 Respuesta completa:');
  console.log(JSON.stringify(result, null, 2));
}

testSabado().catch(console.error);

