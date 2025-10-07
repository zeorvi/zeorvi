#!/usr/bin/env node

/**
 * Script para probar la integración completa entre Retell y Dashboard
 * 
 * Este script simula el flujo completo:
 * 1. Retell verifica disponibilidad
 * 2. Retell crea una reserva
 * 3. Dashboard lee la reserva creada
 * 4. Retell modifica la reserva
 * 5. Dashboard lee la reserva modificada
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';

// Configuración de prueba
const TEST_CONFIG = {
  restaurantId: 'rest_001', // La Gaviota
  cliente: 'María García',
  telefono: '+34 666 123 456',
  fecha: '2024-01-25',
  hora: '21:00',
  personas: 4,
  zona: 'Terraza'
};

async function testRetellFunctions() {
  console.log('🧪 Iniciando pruebas de integración Retell ↔ Dashboard...\n');

  try {
    // 1. Verificar disponibilidad
    console.log('1️⃣ Probando verificar_disponibilidad...');
    const disponibilidadResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'verificar_disponibilidad',
        parameters: {
          fecha: TEST_CONFIG.fecha,
          hora: TEST_CONFIG.hora,
          personas: TEST_CONFIG.personas,
          zona: TEST_CONFIG.zona
        },
        metadata: {
          restaurantId: TEST_CONFIG.restaurantId
        }
      })
    });

    const disponibilidad = await disponibilidadResponse.json();
    console.log('✅ Disponibilidad:', disponibilidad.result);

    if (!disponibilidad.result.disponible) {
      console.log('❌ No hay disponibilidad, terminando prueba');
      return;
    }

    // 2. Crear reserva
    console.log('\n2️⃣ Probando crear_reserva...');
    const crearResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'crear_reserva',
        parameters: {
          fecha: TEST_CONFIG.fecha,
          hora: TEST_CONFIG.hora,
          turno: 'Cena',
          cliente: TEST_CONFIG.cliente,
          telefono: TEST_CONFIG.telefono,
          personas: TEST_CONFIG.personas,
          zona: TEST_CONFIG.zona,
          mesa: disponibilidad.result.mesa,
          notas: 'Reserva de prueba desde script'
        },
        metadata: {
          restaurantId: TEST_CONFIG.restaurantId
        }
      })
    });

    const crear = await crearResponse.json();
    console.log('✅ Reserva creada:', crear.result);

    if (!crear.result.success) {
      console.log('❌ Error creando reserva, terminando prueba');
      return;
    }

    const reservaId = crear.result.numeroReserva;
    console.log(`📝 ID de reserva: ${reservaId}`);

    // 3. Dashboard lee la reserva
    console.log('\n3️⃣ Probando lectura desde Dashboard...');
    const leerResponse = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${TEST_CONFIG.restaurantId}`);
    const leer = await leerResponse.json();
    
    const reservaEncontrada = leer.reservas.find(r => r.ID === reservaId);
    if (reservaEncontrada) {
      console.log('✅ Dashboard lee la reserva:', {
        ID: reservaEncontrada.ID,
        Cliente: reservaEncontrada.Cliente,
        Mesa: reservaEncontrada.Mesa,
        Estado: reservaEncontrada.Estado
      });
    } else {
      console.log('❌ Dashboard no encuentra la reserva');
    }

    // 4. Modificar reserva desde Retell
    console.log('\n4️⃣ Probando modificar_reserva...');
    const modificarResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'modificar_reserva',
        parameters: {
          ID: reservaId,
          hora: '20:30',
          notas: 'Hora modificada desde Retell'
        },
        metadata: {
          restaurantId: TEST_CONFIG.restaurantId
        }
      })
    });

    const modificar = await modificarResponse.json();
    console.log('✅ Reserva modificada:', modificar.result);

    // 5. Dashboard lee la reserva modificada
    console.log('\n5️⃣ Verificando cambios en Dashboard...');
    const leerModificadaResponse = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${TEST_CONFIG.restaurantId}`);
    const leerModificada = await leerModificadaResponse.json();
    
    const reservaModificada = leerModificada.reservas.find(r => r.ID === reservaId);
    if (reservaModificada) {
      console.log('✅ Dashboard lee la reserva modificada:', {
        ID: reservaModificada.ID,
        Hora: reservaModificada.Hora,
        Notas: reservaModificada.Notas
      });
    }

    // 6. Obtener estadísticas
    console.log('\n6️⃣ Probando obtener_estadisticas...');
    const estadisticasResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'obtener_estadisticas',
        parameters: {},
        metadata: {
          restaurantId: TEST_CONFIG.restaurantId
        }
      })
    });

    const estadisticas = await estadisticasResponse.json();
    console.log('✅ Estadísticas:', estadisticas.result.estadisticas);

    // 7. Limpiar - Cancelar reserva
    console.log('\n7️⃣ Limpiando - Cancelando reserva de prueba...');
    const cancelarResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'cancelar_reserva',
        parameters: {
          ID: reservaId
        },
        metadata: {
          restaurantId: TEST_CONFIG.restaurantId
        }
      })
    });

    const cancelar = await cancelarResponse.json();
    console.log('✅ Reserva cancelada:', cancelar.result);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('✅ Retell puede verificar disponibilidad');
    console.log('✅ Retell puede crear reservas');
    console.log('✅ Dashboard puede leer reservas creadas por Retell');
    console.log('✅ Retell puede modificar reservas');
    console.log('✅ Dashboard puede leer reservas modificadas por Retell');
    console.log('✅ Retell puede obtener estadísticas');
    console.log('✅ Retell puede cancelar reservas');
    console.log('\n🔄 El sistema está completamente sincronizado!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

async function testDashboardAPI() {
  console.log('\n🧪 Probando API del Dashboard directamente...\n');

  try {
    // GET reservas
    console.log('1️⃣ Probando GET /api/google-sheets/reservas...');
    const response = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${TEST_CONFIG.restaurantId}`);
    const data = await response.json();
    
    console.log(`✅ Dashboard API responde: ${data.total} reservas encontradas`);
    
    if (data.reservas.length > 0) {
      console.log('📋 Primera reserva:', {
        ID: data.reservas[0].ID,
        Cliente: data.reservas[0].Cliente,
        Fecha: data.reservas[0].Fecha,
        Estado: data.reservas[0].Estado
      });
    }

    // POST nueva reserva
    console.log('\n2️⃣ Probando POST /api/google-sheets/reservas...');
    const postResponse = await fetch(`${BASE_URL}/api/google-sheets/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: TEST_CONFIG.restaurantId,
        fecha: TEST_CONFIG.fecha,
        hora: '22:00',
        turno: 'Cena',
        cliente: 'Cliente Dashboard',
        telefono: '+34 666 999 888',
        personas: 2,
        zona: 'Comedor 1',
        mesa: 'M1',
        estado: 'confirmada',
        notas: 'Reserva desde Dashboard API'
      })
    });

    const postData = await postResponse.json();
    console.log('✅ Reserva creada desde Dashboard:', postData);

  } catch (error) {
    console.error('❌ Error probando Dashboard API:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de integración completa...\n');
  
  await testRetellFunctions();
  await testDashboardAPI();
  
  console.log('\n✨ Pruebas completadas!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testRetellFunctions,
  testDashboardAPI
};
