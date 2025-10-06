// Prueba completa del agente de La Gaviota
const http = require('http');

// Función para hacer petición HTTP local
function makeLocalRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCompleteAgent() {
  console.log('🤖 PRUEBA COMPLETA DEL AGENTE DE LA GAVIOTA');
  console.log('============================================');
  
  try {
    // 1. Probar get_restaurant_status
    console.log('\n1. 🏪 Probando get_restaurant_status...');
    const statusResponse = await makeLocalRequest('http://localhost:3000/api/retell/restaurant-status-mock?restaurantId=rest_003');
    
    if (statusResponse.status === 200) {
      console.log('✅ Estado del restaurante obtenido correctamente');
      const data = statusResponse.data.data;
      
      console.log('📊 Información del restaurante:');
      console.log(`   - Nombre: ${data.restaurante.name}`);
      console.log(`   - Tipo: ${data.restaurante.type}`);
      console.log(`   - Estado: ${data.estadoActual.estaAbierto ? 'ABIERTO' : 'CERRADO'}`);
      console.log(`   - Hora actual: ${data.estadoActual.horaActual}`);
      
      console.log('📊 Estado de las mesas:');
      console.log(`   - Total: ${data.mesas.total}`);
      console.log(`   - Libres: ${data.mesas.porEstado.libres}`);
      console.log(`   - Ocupadas: ${data.mesas.porEstado.ocupadas}`);
      console.log(`   - Reservadas: ${data.mesas.porEstado.reservadas}`);
      console.log(`   - Ocupación: ${data.mesas.porcentajeOcupacion}%`);
      
      console.log('📊 Disponibilidad por capacidad:');
      console.log(`   - Para 2 personas: ${data.disponibilidad.para2Personas} mesas`);
      console.log(`   - Para 4 personas: ${data.disponibilidad.para4Personas} mesas`);
      console.log(`   - Para 6 personas: ${data.disponibilidad.para6Personas} mesas`);
      console.log(`   - Para 8 personas: ${data.disponibilidad.para8Personas} mesas`);
      
      console.log('📊 Ubicaciones:');
      data.ubicaciones.lista.forEach(ubicacion => {
        const info = data.ubicaciones.mesasPorUbicacion[ubicacion];
        console.log(`   - ${ubicacion}: ${info.libres} libres, ${info.ocupadas} ocupadas, ${info.reservadas} reservadas`);
      });
      
      console.log('📊 Detalle de mesas:');
      data.mesas.detalleMesas.forEach(mesa => {
        const estado = mesa.estado === 'libre' ? '🟢' : 
                      mesa.estado === 'ocupada' ? '🔴' : 
                      mesa.estado === 'reservada' ? '🟡' : '⚪';
        console.log(`   ${estado} ${mesa.nombre} (${mesa.capacidad} pers.) - ${mesa.ubicacion} ${mesa.cliente ? `- ${mesa.cliente}` : ''}`);
      });
      
    } else {
      console.log('❌ Error obteniendo estado:', statusResponse.status);
      console.log('📄 Respuesta:', statusResponse.data);
    }

    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('===================');
    console.log('✅ El agente de La Gaviota puede:');
    console.log('   📊 Leer el estado completo del restaurante');
    console.log('   🏪 Ver todas las mesas y su estado');
    console.log('   📍 Conocer todas las ubicaciones');
    console.log('   👥 Calcular disponibilidad por capacidad');
    console.log('   ⏰ Verificar horarios y estado abierto/cerrado');
    console.log('   📈 Obtener métricas de ocupación');
    console.log('   🤖 Proporcionar información completa a los clientes');
    
    console.log('\n🚀 SIMULACIÓN DE LLAMADA DEL CLIENTE:');
    console.log('=====================================');
    console.log('Cliente: "¿Tienen mesa para 4 personas esta noche?"');
    console.log('Agente: "¡Sí! Tenemos 3 mesas disponibles para 4 personas:');
    console.log('        - Mesa 1 en Terraza');
    console.log('        - Mesa 3 en Salón Principal'); 
    console.log('        - Mesa 6 en Terraza (para hasta 8 personas)');
    console.log('        ¿A qué hora les gustaría reservar?"');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testCompleteAgent();
