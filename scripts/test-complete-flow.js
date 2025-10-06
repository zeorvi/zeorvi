/**
 * Script para probar el flujo completo: Retell → Dashboard
 */

const BASE_URL = 'https://zeorvi-pfg0nz4wt-zeorvis-projects.vercel.app';

async function testCompleteFlow() {
  console.log('🔄 Probando flujo completo: Retell → Dashboard\n');

  try {
    // 1. Simular llamada de Retell
    console.log('1️⃣ Simulando llamada de Retell...');
    const simulationResponse = await fetch(`${BASE_URL}/api/retell/simulate-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hola, me llamo Ana García y quiero reservar una mesa para 2 personas mañana a las 21:00',
        restaurantId: 'rest_003'
      })
    });

    if (simulationResponse.ok) {
      const simulation = await simulationResponse.json();
      console.log('✅ Simulación exitosa:');
      console.log('   📝 Datos extraídos:', simulation.extractedData);
      console.log('   🤖 Respuesta del agente:', simulation.agentResponse);
      
      if (simulation.reservationResult?.success) {
        console.log('   🎉 Reserva creada:', simulation.reservationResult.reservation);
      }
    } else {
      console.log('❌ Error en simulación:', simulationResponse.status);
    }

    // 2. Verificar que la reserva aparece en el dashboard
    console.log('\n2️⃣ Verificando dashboard...');
    
    // Verificar reservas
    const reservationsResponse = await fetch(`${BASE_URL}/api/retell/reservations?restaurantId=rest_003`);
    if (reservationsResponse.ok) {
      const reservations = await reservationsResponse.json();
      console.log('✅ Reservas en dashboard:', reservations.reservations?.length || 0);
    }

    // Verificar mesas
    const tablesResponse = await fetch(`${BASE_URL}/api/retell/tables?restaurantId=rest_003`);
    if (tablesResponse.ok) {
      const tables = await tablesResponse.json();
      console.log('✅ Mesas en dashboard:', tables.tables?.length || 0);
      console.log('   📊 Estadísticas:', tables.statistics);
    }

    // 3. Verificar información del dashboard
    console.log('\n3️⃣ Verificando información del dashboard...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/retell/dashboard?restaurantId=rest_003`);
    if (dashboardResponse.ok) {
      const dashboard = await dashboardResponse.json();
      console.log('✅ Dashboard data:');
      console.log('   🏪 Restaurante:', dashboard.restaurante?.nombre);
      console.log('   📅 Reservas hoy:', dashboard.agendaDiaria?.reservasHoy?.length || 0);
      console.log('   🪑 Mesas totales:', dashboard.mesas?.length || 0);
    }

    console.log('\n🎉 Flujo completo probado!');
    console.log('\n📋 Lo que debería pasar en el dashboard real:');
    console.log('   1. 📞 Cliente llama al agente de Retell');
    console.log('   2. 🤖 Agente procesa la reserva automáticamente');
    console.log('   3. 💾 Reserva se guarda en la base de datos');
    console.log('   4. 🔔 Dashboard se actualiza en tiempo real');
    console.log('   5. 📊 Todas las estadísticas se recalculan');
    console.log('   6. 🪑 Mesa cambia de estado automáticamente');
    console.log('   7. 📅 Nueva reserva aparece en la agenda');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testCompleteFlow();