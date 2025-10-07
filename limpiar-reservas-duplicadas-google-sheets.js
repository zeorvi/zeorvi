const https = require('https');
const http = require('http');

// Función para hacer petición HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function limpiarReservasDuplicadas() {
  console.log('🧹 Iniciando limpieza de reservas duplicadas en Google Sheets...');
  
  try {
    const baseUrl = 'http://localhost:3001';
    const restaurantId = 'rest_003';
    
    // 1. Obtener todas las reservas
    console.log('\n📊 Obteniendo reservas actuales...');
    const reservasResponse = await makeRequest(`${baseUrl}/api/google-sheets/reservas?restaurantId=${restaurantId}`);
    
    if (reservasResponse.status !== 200 || !reservasResponse.data.success) {
      console.error('❌ Error obteniendo reservas:', reservasResponse.data);
      return;
    }
    
    const reservas = reservasResponse.data.reservas;
    console.log(`✅ Total de reservas encontradas: ${reservas.length}`);
    
    // 2. Identificar reservas duplicadas (solo reservas activas)
    const duplicadas = {};
    reservas.forEach(reserva => {
      // Solo considerar reservas activas (confirmadas o pendientes)
      const estadoActivo = reserva.Estado.toLowerCase() === 'confirmada' || 
                           reserva.Estado.toLowerCase() === 'pendiente';
      
      if (estadoActivo) {
        const key = `${reserva.Fecha}-${reserva.Hora}-${reserva.Mesa}`;
        if (!duplicadas[key]) {
          duplicadas[key] = [];
        }
        duplicadas[key].push(reserva);
      }
    });
    
    // 3. Mostrar duplicadas encontradas
    const gruposDuplicados = Object.values(duplicadas).filter(grupo => grupo.length > 1);
    console.log(`🔍 Grupos de reservas duplicadas encontrados: ${gruposDuplicados.length}`);
    
    gruposDuplicados.forEach((grupo, index) => {
      console.log(`\n📅 Grupo ${index + 1}: ${grupo[0].Fecha} ${grupo[0].Hora} - Mesa ${grupo[0].Mesa}`);
      grupo.forEach((reserva, idx) => {
        console.log(`  ${idx + 1}. ${reserva.Cliente} (${reserva.Personas} personas) - ${reserva.Estado} - ID: ${reserva.ID}`);
      });
    });
    
    if (gruposDuplicados.length === 0) {
      console.log('✅ No hay reservas duplicadas que limpiar.');
      return;
    }
    
    // 4. Para cada grupo duplicado, mantener solo la primera reserva y cancelar las demás
    console.log('\n🧹 Limpiando reservas duplicadas...');
    let reservasCanceladas = 0;
    
    for (const grupo of gruposDuplicados) {
      // Mantener la primera reserva (la más antigua)
      const reservaMantener = grupo[0];
      console.log(`\n✅ Manteniendo: ${reservaMantener.Cliente} - ${reservaMantener.ID}`);
      
      // Cancelar las demás reservas del grupo
      for (let i = 1; i < grupo.length; i++) {
        const reservaCancelar = grupo[i];
        
        try {
          const cancelResponse = await makeRequest(`${baseUrl}/api/google-sheets/reservas?restaurantId=${restaurantId}&ID=${reservaCancelar.ID}`, {
            method: 'DELETE'
          });
          
          if (cancelResponse.status === 200 && cancelResponse.data.success) {
            console.log(`❌ Cancelada: ${reservaCancelar.Cliente} - ${reservaCancelar.ID}`);
            reservasCanceladas++;
          } else {
            console.log(`⚠️ Error cancelando ${reservaCancelar.ID}:`, cancelResponse.data.error);
          }
        } catch (error) {
          console.log(`⚠️ Error cancelando ${reservaCancelar.ID}:`, error.message);
        }
        
        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n🎯 Limpieza completada:`);
    console.log(`✅ Reservas canceladas: ${reservasCanceladas}`);
    console.log(`✅ Reservas mantenidas: ${gruposDuplicados.length}`);
    
    // 5. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const verificacionResponse = await makeRequest(`${baseUrl}/api/google-sheets/reservas?restaurantId=${restaurantId}`);
    
    if (verificacionResponse.status === 200 && verificacionResponse.data.success) {
      const reservasFinales = verificacionResponse.data.reservas;
      console.log(`📊 Total de reservas después de la limpieza: ${reservasFinales.length}`);
      
      // Verificar que no hay duplicadas (solo reservas activas)
      const duplicadasFinales = {};
      reservasFinales.forEach(reserva => {
        // Solo considerar reservas activas (confirmadas o pendientes)
        const estadoActivo = reserva.Estado.toLowerCase() === 'confirmada' || 
                             reserva.Estado.toLowerCase() === 'pendiente';
        
        if (estadoActivo) {
          const key = `${reserva.Fecha}-${reserva.Hora}-${reserva.Mesa}`;
          if (!duplicadasFinales[key]) {
            duplicadasFinales[key] = [];
          }
          duplicadasFinales[key].push(reserva);
        }
      });
      
      const gruposDuplicadosFinales = Object.values(duplicadasFinales).filter(grupo => grupo.length > 1);
      
      if (gruposDuplicadosFinales.length === 0) {
        console.log('✅ ¡Perfecto! No hay reservas duplicadas restantes.');
      } else {
        console.log(`⚠️ Aún quedan ${gruposDuplicadosFinales.length} grupos duplicados.`);
      }
    }
    
    console.log('\n🎉 Limpieza de reservas duplicadas completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  }
}

// Ejecutar
limpiarReservasDuplicadas();
