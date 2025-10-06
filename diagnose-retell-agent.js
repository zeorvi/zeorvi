// Script de diagnóstico completo para el agente de La Gaviota
const https = require('https');

const BASE_URL = 'www.zeorvi.com';
const RESTAURANT_ID = 'rest_003'; // ID de La Gaviota
const AGENT_ID = 'agent_2082fc7a622cdbd22441b22060';

console.log('🔍 DIAGNÓSTICO COMPLETO DEL AGENTE DE LA GAVIOTA');
console.log('=' .repeat(60));

// Función para hacer peticiones HTTPS
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Retell-Agent-Diagnostic'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Función para probar un endpoint
async function testEndpoint(name, path, method = 'GET', data = null) {
  console.log(`\n🧪 Probando: ${name}`);
  console.log(`📡 ${method} https://${BASE_URL}${path}`);
  
  try {
    const result = await makeRequest(path, method, data);
    
    if (result.status === 200) {
      console.log(`✅ Status: ${result.status} - FUNCIONANDO`);
      if (result.data.success !== undefined) {
        console.log(`📊 Success: ${result.data.success}`);
      }
      if (result.data.error) {
        console.log(`⚠️  Error: ${result.data.error}`);
      }
    } else {
      console.log(`❌ Status: ${result.status} - ERROR`);
      if (result.data.error) {
        console.log(`❌ Error: ${result.data.error}`);
      }
    }
    
    return result;
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
    return null;
  }
}

// Función principal de diagnóstico
async function runDiagnostic() {
  console.log(`🏪 Restaurant ID: ${RESTAURANT_ID}`);
  console.log(`🤖 Agent ID: ${AGENT_ID}`);
  console.log(`🌐 Base URL: https://${BASE_URL}`);

  // 1. Probar webhook básico
  await testEndpoint(
    'Webhook Básico',
    '/api/retell/webhook',
    'POST',
    {
      call_id: 'test_call_123',
      agent_id: AGENT_ID,
      event: 'call_started',
      timestamp: new Date().toISOString()
    }
  );

  // 2. Probar estado del restaurante
  await testEndpoint(
    'Estado del Restaurante',
    `/api/retell/restaurant-status?restaurantId=${RESTAURANT_ID}`
  );

  // 3. Probar mesas del restaurante
  await testEndpoint(
    'Mesas del Restaurante',
    `/api/retell/tables?restaurantId=${RESTAURANT_ID}`
  );

  // 4. Probar reservas del restaurante
  await testEndpoint(
    'Reservas del Restaurante',
    `/api/retell/reservations?restaurantId=${RESTAURANT_ID}`
  );

  // 5. Probar clientes del restaurante
  await testEndpoint(
    'Clientes del Restaurante',
    `/api/retell/clients?restaurantId=${RESTAURANT_ID}`
  );

  // 6. Probar dashboard del restaurante
  await testEndpoint(
    'Dashboard del Restaurante',
    `/api/retell/dashboard?restaurantId=${RESTAURANT_ID}`
  );

  // 7. Probar disponibilidad
  await testEndpoint(
    'Verificar Disponibilidad',
    `/api/retell/check-availability?restaurantId=${RESTAURANT_ID}&date=2024-01-15&time=20:00&people=4`
  );

  // 8. Probar crear reserva
  await testEndpoint(
    'Crear Reserva',
    '/api/retell/reservations',
    'POST',
    {
      restaurantId: RESTAURANT_ID,
      customerName: 'Test Cliente',
      phone: '+34600123456',
      people: 2,
      date: '2024-01-15',
      time: '20:00',
      specialRequests: 'Mesa de prueba'
    }
  );

  console.log('\n' + '='.repeat(60));
  console.log('🏁 DIAGNÓSTICO COMPLETADO');
  console.log('='.repeat(60));
}

// Ejecutar diagnóstico
runDiagnostic().catch(console.error);
