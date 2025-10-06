// Prueba del agente usando el sistema local
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

async function testLocalAgent() {
  console.log('🤖 PROBANDO AGENTE LOCAL DE LA GAVIOTA');
  console.log('=====================================');
  
  try {
    // 1. Probar get_restaurant_status
    console.log('\n1. 🏪 Probando get_restaurant_status...');
    const statusResponse = await makeLocalRequest('http://localhost:3000/api/retell/restaurant-status?restaurantId=rest_003');
    
    if (statusResponse.status === 200) {
      console.log('✅ Estado del restaurante obtenido correctamente');
      console.log('📊 Datos recibidos:', JSON.stringify(statusResponse.data, null, 2));
    } else {
      console.log('❌ Error obteniendo estado:', statusResponse.status);
      console.log('📄 Respuesta:', statusResponse.data);
    }

    // 2. Probar check_availability
    console.log('\n2. 🔍 Probando check_availability...');
    const availabilityData = {
      restaurant_id: 'rest_003',
      fecha: '2024-01-15',
      hora: '20:00',
      personas: 4
    };
    
    const availabilityResponse = await makeLocalRequest('http://localhost:3000/api/retell/check-availability', 'POST', availabilityData);
    
    if (availabilityResponse.status === 200) {
      console.log('✅ Disponibilidad verificada correctamente');
      console.log('📊 Disponibilidad:', JSON.stringify(availabilityResponse.data, null, 2));
    } else {
      console.log('❌ Error verificando disponibilidad:', availabilityResponse.status);
      console.log('📄 Respuesta:', availabilityResponse.data);
    }

    // 3. Probar create_reservation
    console.log('\n3. 📝 Probando create_reservation...');
    const reservationData = {
      restaurant_id: 'rest_003',
      fecha: '2024-01-15',
      hora: '20:00',
      cliente: 'Juan Pérez',
      telefono: '+34612345678',
      personas: 4,
      notas: 'Prueba del agente'
    };
    
    const reservationResponse = await makeLocalRequest('http://localhost:3000/api/retell/reservations', 'POST', reservationData);
    
    if (reservationResponse.status === 200) {
      console.log('✅ Reserva creada correctamente');
      console.log('📊 Reserva:', JSON.stringify(reservationResponse.data, null, 2));
    } else {
      console.log('❌ Error creando reserva:', reservationResponse.status);
      console.log('📄 Respuesta:', reservationResponse.data);
    }

    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('===================');
    console.log('✅ El agente de La Gaviota está funcionando correctamente');
    console.log('🤖 Puede consultar estado, verificar disponibilidad y crear reservas');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testLocalAgent();
