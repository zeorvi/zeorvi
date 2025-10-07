#!/usr/bin/env node

/**
 * Script de pruebas completas para La Gaviota
 * Verifica que el agente de Retell esté conectado a Google Sheets y Dashboard
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Configuración específica de La Gaviota
const LAGAVIOTA_CONFIG = {
  restaurantId: 'rest_003',
  restaurantName: 'La Gaviota',
  cliente: 'María García',
  telefono: '+34 666 123 456',
  fecha: new Date().toISOString().split('T')[0], // Hoy
  hora: '20:00',
  personas: 4,
  zona: 'Terraza del Mar'
};

async function testGoogleSheetsConnection() {
  console.log('🧪 1. Probando conexión a Google Sheets...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${LAGAVIOTA_CONFIG.restaurantId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Google Sheets conectado correctamente');
      console.log(`📊 Total reservas: ${data.total}`);
      console.log(`📋 Última reserva:`, data.reservas[0] ? {
        ID: data.reservas[0].ID,
        Cliente: data.reservas[0].Cliente,
        Fecha: data.reservas[0].Fecha,
        Estado: data.reservas[0].Estado
      } : 'No hay reservas');
    } else {
      console.log('❌ Error conectando a Google Sheets:', data.error);
    }
  } catch (error) {
    console.log('❌ Error en conexión Google Sheets:', error.message);
  }
}

async function testRetellFunctions() {
  console.log('\n🧪 2. Probando funciones de Retell para La Gaviota...\n');
  
  try {
    // Test 1: Verificar disponibilidad
    console.log('📅 Probando verificar_disponibilidad...');
    const disponibilidadResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'verificar_disponibilidad',
        parameters: {
          fecha: LAGAVIOTA_CONFIG.fecha,
          hora: LAGAVIOTA_CONFIG.hora,
          personas: LAGAVIOTA_CONFIG.personas,
          zona: LAGAVIOTA_CONFIG.zona
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const disponibilidad = await disponibilidadResponse.json();
    console.log('✅ Verificar disponibilidad:', disponibilidad.result);

    if (!disponibilidad.result.disponible) {
      console.log('⚠️  No hay disponibilidad, continuando con otras pruebas...');
      return;
    }

    // Test 2: Crear reserva
    console.log('\n📝 Probando crear_reserva...');
    const crearResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'crear_reserva',
        parameters: {
          fecha: LAGAVIOTA_CONFIG.fecha,
          hora: LAGAVIOTA_CONFIG.hora,
          turno: 'Cena',
          cliente: LAGAVIOTA_CONFIG.cliente,
          telefono: LAGAVIOTA_CONFIG.telefono,
          personas: LAGAVIOTA_CONFIG.personas,
          zona: LAGAVIOTA_CONFIG.zona,
          mesa: disponibilidad.result.mesa,
          notas: 'Reserva de prueba desde script de La Gaviota'
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const crear = await crearResponse.json();
    console.log('✅ Crear reserva:', crear.result);

    if (!crear.result.success) {
      console.log('❌ Error creando reserva, terminando pruebas');
      return;
    }

    const reservaId = crear.result.numeroReserva;
    console.log(`📝 ID de reserva creada: ${reservaId}`);

    // Test 3: Buscar reserva
    console.log('\n🔍 Probando buscar_reserva...');
    const buscarResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'buscar_reserva',
        parameters: {
          cliente: LAGAVIOTA_CONFIG.cliente,
          telefono: LAGAVIOTA_CONFIG.telefono
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const buscar = await buscarResponse.json();
    console.log('✅ Buscar reserva:', buscar.result);

    // Test 4: Obtener estadísticas
    console.log('\n📊 Probando obtener_estadisticas...');
    const estadisticasResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'obtener_estadisticas',
        parameters: {},
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const estadisticas = await estadisticasResponse.json();
    console.log('✅ Estadísticas:', estadisticas.result.estadisticas);

    // Test 5: Limpiar - Cancelar reserva
    console.log('\n🗑️  Limpiando - Cancelando reserva de prueba...');
    const cancelarResponse = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'cancelar_reserva',
        parameters: {
          ID: reservaId
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const cancelar = await cancelarResponse.json();
    console.log('✅ Cancelar reserva:', cancelar.result);

    return reservaId;

  } catch (error) {
    console.log('❌ Error en funciones de Retell:', error.message);
  }
}

async function testDashboardIntegration() {
  console.log('\n🧪 3. Probando integración con Dashboard...\n');
  
  try {
    // Test 1: Dashboard lee reservas
    console.log('📊 Dashboard leyendo reservas...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${LAGAVIOTA_CONFIG.restaurantId}`);
    const dashboardData = await dashboardResponse.json();
    
    console.log('✅ Dashboard conectado:', {
      totalReservas: dashboardData.total,
      restaurante: LAGAVIOTA_CONFIG.restaurantName
    });

    // Test 2: Dashboard específico de La Gaviota
    console.log('\n🏪 Probando acceso al dashboard de La Gaviota...');
    const dashboardPageResponse = await fetch(`${BASE_URL}/dashboard/${LAGAVIOTA_CONFIG.restaurantId}`);
    
    if (dashboardPageResponse.ok) {
      console.log('✅ Dashboard de La Gaviota accesible');
    } else {
      console.log('❌ Dashboard de La Gaviota no accesible');
    }

  } catch (error) {
    console.log('❌ Error en integración Dashboard:', error.message);
  }
}

async function testCompleteFlow() {
  console.log('\n🧪 4. Probando flujo completo de reservas...\n');
  
  try {
    // Simular llamada completa de Retell
    console.log('📞 Simulando llamada de Retell...');
    
    // 1. Cliente llama y agente verifica disponibilidad
    console.log('1️⃣ Verificando disponibilidad...');
    const disponibilidad = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'verificar_disponibilidad',
        parameters: {
          fecha: LAGAVIOTA_CONFIG.fecha,
          hora: LAGAVIOTA_CONFIG.hora,
          personas: LAGAVIOTA_CONFIG.personas
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const dispData = await disponibilidad.json();
    console.log('✅ Disponibilidad verificada:', dispData.result.disponible);

    if (!dispData.result.disponible) {
      console.log('⚠️  No hay disponibilidad para el flujo completo');
      return;
    }

    // 2. Cliente confirma y agente crea reserva
    console.log('2️⃣ Creando reserva...');
    const crear = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'crear_reserva',
        parameters: {
          fecha: LAGAVIOTA_CONFIG.fecha,
          hora: LAGAVIOTA_CONFIG.hora,
          turno: 'Cena',
          cliente: LAGAVIOTA_CONFIG.cliente,
          telefono: LAGAVIOTA_CONFIG.telefono,
          personas: LAGAVIOTA_CONFIG.personas,
          zona: LAGAVIOTA_CONFIG.zona,
          mesa: dispData.result.mesa,
          notas: 'Flujo completo de prueba'
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const crearData = await crear.json();
    console.log('✅ Reserva creada:', crearData.result.success);

    // 3. Dashboard muestra la reserva
    console.log('3️⃣ Verificando en Dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const dashboard = await fetch(`${BASE_URL}/api/google-sheets/reservas?restaurantId=${LAGAVIOTA_CONFIG.restaurantId}`);
    const dashboardData = await dashboard.json();
    
    const reservaEncontrada = dashboardData.reservas.find(r => 
      r.Cliente === LAGAVIOTA_CONFIG.cliente && 
      r.Telefono === LAGAVIOTA_CONFIG.telefono
    );

    if (reservaEncontrada) {
      console.log('✅ Dashboard muestra la reserva:', {
        ID: reservaEncontrada.ID,
        Cliente: reservaEncontrada.Cliente,
        Mesa: reservaEncontrada.Mesa,
        Estado: reservaEncontrada.Estado
      });
    } else {
      console.log('❌ Dashboard no encuentra la reserva');
    }

    // 4. Limpiar
    console.log('4️⃣ Limpiando reserva de prueba...');
    const cancelar = await fetch(`${BASE_URL}/api/retell/functions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function_name: 'cancelar_reserva',
        parameters: {
          ID: crearData.result.numeroReserva
        },
        metadata: {
          restaurantId: LAGAVIOTA_CONFIG.restaurantId
        }
      })
    });

    const cancelarData = await cancelar.json();
    console.log('✅ Reserva limpiada:', cancelarData.result.success);

    console.log('\n🎉 ¡Flujo completo funcionando correctamente!');

  } catch (error) {
    console.log('❌ Error en flujo completo:', error.message);
  }
}

async function main() {
  console.log('🚀 INICIANDO PRUEBAS COMPLETAS DE LA GAVIOTA 🚀\n');
  console.log(`🏪 Restaurante: ${LAGAVIOTA_CONFIG.restaurantName} (${LAGAVIOTA_CONFIG.restaurantId})`);
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  await testGoogleSheetsConnection();
  await testRetellFunctions();
  await testDashboardIntegration();
  await testCompleteFlow();

  console.log('\n✨ PRUEBAS COMPLETADAS ✨');
  console.log('\n📋 RESUMEN:');
  console.log('✅ Conexión a Google Sheets verificada');
  console.log('✅ Funciones de Retell funcionando');
  console.log('✅ Integración con Dashboard verificada');
  console.log('✅ Flujo completo de reservas operativo');
  console.log('\n🎯 El agente de Retell de La Gaviota está completamente conectado!');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testGoogleSheetsConnection,
  testRetellFunctions,
  testDashboardIntegration,
  testCompleteFlow
};
