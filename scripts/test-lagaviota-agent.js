/**
 * Script para probar el agente de La Gaviota
 */

const BASE_URL = 'https://zeorvi-pfg0nz4wt-zeorvis-projects.vercel.app';

async function testLaGaviotaAgent() {
  console.log('🦅 Probando el agente de La Gaviota...\n');

  try {
    // 1. Verificar que el restaurante existe
    console.log('1️⃣ Verificando restaurante La Gaviota...');
    const restaurantResponse = await fetch(`${BASE_URL}/api/restaurants/rest_003`, {
      headers: {
        'Authorization': 'Bearer ' + process.env.AUTH_TOKEN || 'test-token'
      }
    });
    
    if (restaurantResponse.ok) {
      const restaurant = await restaurantResponse.json();
      console.log('✅ Restaurante encontrado:', restaurant.restaurant.name);
    } else {
      console.log('❌ Error al obtener restaurante:', restaurantResponse.status);
    }

    // 2. Probar simulación de llamada
    console.log('\n2️⃣ Probando simulación de llamada...');
    const simulationResponse = await fetch(`${BASE_URL}/api/retell/simulate-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hola, me llamo Juan Pérez y quiero reservar una mesa para 4 personas mañana a las 20:00',
        restaurantId: 'rest_003'
      })
    });

    if (simulationResponse.ok) {
      const simulation = await simulationResponse.json();
      console.log('✅ Simulación exitosa:');
      console.log('   📝 Mensaje procesado:', simulation.message);
      console.log('   📊 Datos extraídos:', simulation.extractedData);
      console.log('   🤖 Respuesta del agente:', simulation.agentResponse);
    } else {
      console.log('❌ Error en simulación:', simulationResponse.status);
    }

    // 3. Verificar configuración del agente
    console.log('\n3️⃣ Verificando configuración del agente...');
    const agentConfigResponse = await fetch(`${BASE_URL}/api/retell/dashboard-info?restaurantId=rest_003`);
    
    if (agentConfigResponse.ok) {
      const config = await agentConfigResponse.json();
      console.log('✅ Configuración del agente:');
      console.log('   🆔 Agent ID:', config.agentId);
      console.log('   🎤 Voice ID:', config.voiceId);
      console.log('   🌍 Idioma:', config.language);
      console.log('   📞 Teléfono:', config.phone);
    } else {
      console.log('❌ Error al obtener configuración:', agentConfigResponse.status);
    }

    console.log('\n🎉 Pruebas completadas!');
    console.log('\n📞 Para probar el agente real:');
    console.log('   1. Ve a tu dashboard de Retell');
    console.log('   2. Busca el agente "agent_2082fc7a622cdbd22441b22060"');
    console.log('   3. Haz una llamada de prueba');
    console.log('   4. El agente debería responder con información de La Gaviota');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testLaGaviotaAgent();
