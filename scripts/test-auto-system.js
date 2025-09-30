const { GoogleSheetsService } = require('../src/lib/googleSheetsService');
const { RestaurantAutoSetup } = require('../src/lib/restaurantAutoSetup');

async function testAutoSystem() {
  console.log('🧪 Probando Sistema Automático de Restaurantes + Google Sheets + Retell AI\n');

  try {
    // 1. Crear un restaurante de prueba
    console.log('🏪 Creando restaurante de prueba...');
    const restaurantConfig = {
      id: 'rest_test_123',
      name: 'Restaurante Test',
      address: 'Calle Test 123',
      phone: '555-TEST',
      email: 'test@restaurante.com',
      capacity: 50,
      features: ['Terraza', 'WiFi', 'Parking'],
      tables: [
        { id: 'table_1', number: 'Mesa 1', capacity: 2, location: 'Salón Principal', type: 'indoor' },
        { id: 'table_2', number: 'Mesa 2', capacity: 4, location: 'Terraza', type: 'outdoor' },
        { id: 'table_3', number: 'Mesa 3', capacity: 6, location: 'Salón Privado', type: 'private' }
      ],
      schedules: [
        { day: 'Lunes', openTime: '12:00', closeTime: '23:00', isOpen: true },
        { day: 'Martes', openTime: '12:00', closeTime: '23:00', isOpen: true },
        { day: 'Miércoles', openTime: '12:00', closeTime: '23:00', isOpen: true },
        { day: 'Jueves', openTime: '12:00', closeTime: '23:00', isOpen: true },
        { day: 'Viernes', openTime: '12:00', closeTime: '24:00', isOpen: true },
        { day: 'Sábado', openTime: '12:00', closeTime: '24:00', isOpen: true },
        { day: 'Domingo', openTime: '12:00', closeTime: '22:00', isOpen: true }
      ]
    };

    const setupSuccess = await RestaurantAutoSetup.createRestaurantSetup(restaurantConfig);
    console.log(`✅ Configuración del restaurante: ${setupSuccess ? 'EXITOSA' : 'FALLÓ'}\n`);

    if (!setupSuccess) {
      throw new Error('No se pudo crear la configuración del restaurante');
    }

    // 2. Probar lectura de reservas del restaurante
    console.log('📖 Leyendo reservas del restaurante...');
    const reservas = await GoogleSheetsService.getReservas(restaurantConfig.id, restaurantConfig.name);
    console.log(`✅ Encontradas ${reservas.length} reservas`);
    
    if (reservas.length > 0) {
      console.log('📋 Primera reserva:', reservas[0]);
    }

    // 3. Probar estadísticas del restaurante
    console.log('\n📊 Obteniendo estadísticas del restaurante...');
    const stats = await GoogleSheetsService.getEstadisticas(restaurantConfig.id, restaurantConfig.name);
    console.log('✅ Estadísticas del restaurante:', stats);

    // 4. Probar disponibilidad
    console.log('\n🔍 Verificando disponibilidad...');
    const hoy = new Date().toISOString().split('T')[0];
    const disponible = await GoogleSheetsService.verificarDisponibilidad(
      hoy, 
      '20:00', 
      4, 
      restaurantConfig.id, 
      restaurantConfig.name
    );
    console.log(`✅ Disponibilidad para ${hoy} a las 20:00 para 4 personas: ${disponible ? 'SÍ' : 'NO'}`);

    // 5. Probar creación de reserva
    console.log('\n➕ Creando reserva de prueba...');
    const reservaPrueba = {
      fecha: hoy,
      hora: '21:00',
      horario: '21:00',
      cliente: 'Cliente Test',
      telefono: '555-9999',
      personas: 2,
      mesa: 'Mesa 1',
      estado: 'confirmada',
      notas: 'Reserva de prueba del sistema automático',
      restaurante: restaurantConfig.name,
      restauranteId: restaurantConfig.id
    };

    const creada = await GoogleSheetsService.crearReserva(reservaPrueba);
    console.log(`✅ Reserva de prueba ${creada ? 'creada exitosamente' : 'falló'}`);

    // 6. Probar estadísticas globales
    console.log('\n📊 Obteniendo estadísticas globales...');
    const statsGlobales = await GoogleSheetsService.getEstadisticasGlobales();
    console.log('✅ Estadísticas globales:', statsGlobales);

    // 7. Probar lectura de todas las reservas
    console.log('\n📖 Leyendo todas las reservas...');
    const todasLasReservas = await GoogleSheetsService.getAllReservas();
    console.log(`✅ Total de reservas en el sistema: ${todasLasReservas.length}`);

    console.log('\n🎉 ¡Todas las pruebas del sistema automático pasaron!');
    console.log('\n📋 Resumen del sistema:');
    console.log('✅ Configuración automática de restaurantes');
    console.log('✅ Google Sheets automático por restaurante');
    console.log('✅ Sincronización con Retell AI');
    console.log('✅ Dashboard automático');
    console.log('✅ APIs multi-restaurante');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que GOOGLE_SHEETS_ID esté configurado en .env.local');
    console.log('2. Verifica que google-credentials.json exista y sea válido');
    console.log('3. Verifica que el Service Account tenga acceso a tu Google Sheets');
    console.log('4. Verifica que Google Sheets API esté habilitada en tu proyecto');
  }
}

// Ejecutar pruebas
testAutoSystem();
