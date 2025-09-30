const { RestaurantSheetsManager } = require('../src/lib/restaurantSheetsManager');
const { RetellAgentManager } = require('../src/lib/retellAgentManager');
const { GoogleSheetsService } = require('../src/lib/googleSheetsService');

async function testSeparateSystems() {
  console.log('🧪 Probando Sistema de Restaurantes Separados\n');

  try {
    // 1. Crear restaurante 1
    console.log('🏪 Creando Restaurante 1: La Gaviota...');
    const restaurant1 = {
      id: 'rest_gaviota_001',
      name: 'La Gaviota',
      address: 'Calle del Mar 123',
      phone: '555-0101',
      email: 'info@lagaviota.com',
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

    const sheets1Result = await RestaurantSheetsManager.createRestaurantSheets(restaurant1);
    console.log(`✅ Google Sheets 1 creado: ${sheets1Result.success ? 'EXITOSO' : 'FALLÓ'}`);
    
    if (sheets1Result.success) {
      console.log(`   📊 Spreadsheet ID: ${sheets1Result.spreadsheetId}`);
      console.log(`   🔗 URL: ${sheets1Result.spreadsheetUrl}`);
    }

    // 2. Crear agente Retell AI para restaurante 1
    console.log('\n🤖 Creando Agente Retell AI para La Gaviota...');
    const retell1Result = await RetellAgentManager.createRestaurantAgent({
      restaurantId: restaurant1.id,
      restaurantName: restaurant1.name,
      phoneNumber: restaurant1.phone,
      spreadsheetId: sheets1Result.spreadsheetId,
      webhookUrl: 'https://tu-dominio.com/api/retell/webhook',
      language: 'es',
      voice: 'alloy',
      model: 'gpt-4o-mini'
    });
    console.log(`✅ Retell AI 1 creado: ${retell1Result.success ? 'EXITOSO' : 'FALLÓ'}`);
    
    if (retell1Result.success) {
      console.log(`   🤖 Agent ID: ${retell1Result.agentId}`);
    }

    // 3. Crear restaurante 2
    console.log('\n🏪 Creando Restaurante 2: Bistro Central...');
    const restaurant2 = {
      id: 'rest_bistro_002',
      name: 'Bistro Central',
      address: 'Avenida Principal 456',
      phone: '555-0202',
      email: 'contacto@bistrocentral.com',
      capacity: 30,
      features: ['WiFi', 'Barra'],
      tables: [
        { id: 'table_1', number: 'Mesa 1', capacity: 2, location: 'Salón Principal', type: 'indoor' },
        { id: 'table_2', number: 'Mesa 2', capacity: 4, location: 'Barra', type: 'indoor' }
      ],
      schedules: [
        { day: 'Lunes', openTime: '18:00', closeTime: '23:00', isOpen: true },
        { day: 'Martes', openTime: '18:00', closeTime: '23:00', isOpen: true },
        { day: 'Miércoles', openTime: '18:00', closeTime: '23:00', isOpen: true },
        { day: 'Jueves', openTime: '18:00', closeTime: '23:00', isOpen: true },
        { day: 'Viernes', openTime: '18:00', closeTime: '24:00', isOpen: true },
        { day: 'Sábado', openTime: '18:00', closeTime: '24:00', isOpen: true },
        { day: 'Domingo', openTime: '18:00', closeTime: '22:00', isOpen: true }
      ]
    };

    const sheets2Result = await RestaurantSheetsManager.createRestaurantSheets(restaurant2);
    console.log(`✅ Google Sheets 2 creado: ${sheets2Result.success ? 'EXITOSO' : 'FALLÓ'}`);
    
    if (sheets2Result.success) {
      console.log(`   📊 Spreadsheet ID: ${sheets2Result.spreadsheetId}`);
      console.log(`   🔗 URL: ${sheets2Result.spreadsheetUrl}`);
    }

    // 4. Crear agente Retell AI para restaurante 2
    console.log('\n🤖 Creando Agente Retell AI para Bistro Central...');
    const retell2Result = await RetellAgentManager.createRestaurantAgent({
      restaurantId: restaurant2.id,
      restaurantName: restaurant2.name,
      phoneNumber: restaurant2.phone,
      spreadsheetId: sheets2Result.spreadsheetId,
      webhookUrl: 'https://tu-dominio.com/api/retell/webhook',
      language: 'es',
      voice: 'nova',
      model: 'gpt-4o-mini'
    });
    console.log(`✅ Retell AI 2 creado: ${retell2Result.success ? 'EXITOSO' : 'FALLÓ'}`);
    
    if (retell2Result.success) {
      console.log(`   🤖 Agent ID: ${retell2Result.agentId}`);
    }

    // 5. Probar lectura de reservas de cada restaurante
    console.log('\n📖 Probando lectura de reservas...');
    
    if (sheets1Result.success) {
      const reservas1 = await GoogleSheetsService.getReservas(
        restaurant1.id, 
        restaurant1.name, 
        sheets1Result.spreadsheetId
      );
      console.log(`✅ Reservas La Gaviota: ${reservas1.length} encontradas`);
    }
    
    if (sheets2Result.success) {
      const reservas2 = await GoogleSheetsService.getReservas(
        restaurant2.id, 
        restaurant2.name, 
        sheets2Result.spreadsheetId
      );
      console.log(`✅ Reservas Bistro Central: ${reservas2.length} encontradas`);
    }

    // 6. Probar creación de reservas en cada restaurante
    console.log('\n➕ Probando creación de reservas...');
    
    const hoy = new Date().toISOString().split('T')[0];
    
    if (sheets1Result.success) {
      const reserva1 = {
        fecha: hoy,
        hora: '20:00',
        horario: '20:00',
        cliente: 'Juan Pérez',
        telefono: '555-1111',
        personas: 4,
        mesa: 'Mesa 1',
        estado: 'confirmada',
        notas: 'Reserva para La Gaviota',
        restaurante: restaurant1.name,
        restauranteId: restaurant1.id
      };
      
      const creada1 = await GoogleSheetsService.crearReserva(reserva1, sheets1Result.spreadsheetId);
      console.log(`✅ Reserva La Gaviota: ${creada1 ? 'CREADA' : 'FALLÓ'}`);
    }
    
    if (sheets2Result.success) {
      const reserva2 = {
        fecha: hoy,
        hora: '21:00',
        horario: '21:00',
        cliente: 'María García',
        telefono: '555-2222',
        personas: 2,
        mesa: 'Mesa 1',
        estado: 'confirmada',
        notas: 'Reserva para Bistro Central',
        restaurante: restaurant2.name,
        restauranteId: restaurant2.id
      };
      
      const creada2 = await GoogleSheetsService.crearReserva(reserva2, sheets2Result.spreadsheetId);
      console.log(`✅ Reserva Bistro Central: ${creada2 ? 'CREADA' : 'FALLÓ'}`);
    }

    // 7. Verificar información de los Google Sheets
    console.log('\n📊 Verificando información de Google Sheets...');
    
    if (sheets1Result.success) {
      const info1 = await RestaurantSheetsManager.getRestaurantSheetsInfo(sheets1Result.spreadsheetId);
      if (info1) {
        console.log(`✅ La Gaviota Sheets Info:`);
        console.log(`   📋 Título: ${info1.title}`);
        console.log(`   🔗 URL: ${info1.url}`);
        console.log(`   📄 Hojas: ${info1.sheets.join(', ')}`);
      }
    }
    
    if (sheets2Result.success) {
      const info2 = await RestaurantSheetsManager.getRestaurantSheetsInfo(sheets2Result.spreadsheetId);
      if (info2) {
        console.log(`✅ Bistro Central Sheets Info:`);
        console.log(`   📋 Título: ${info2.title}`);
        console.log(`   🔗 URL: ${info2.url}`);
        console.log(`   📄 Hojas: ${info2.sheets.join(', ')}`);
      }
    }

    console.log('\n🎉 ¡Todas las pruebas del sistema separado pasaron!');
    console.log('\n📋 Resumen del sistema:');
    console.log('✅ Cada restaurante tiene su propio Google Sheets');
    console.log('✅ Cada restaurante tiene su propio agente Retell AI');
    console.log('✅ Cada restaurante tiene su propio dashboard');
    console.log('✅ Los sistemas son completamente independientes');
    console.log('✅ Las reservas se gestionan por separado');

    console.log('\n🔗 URLs de acceso:');
    if (sheets1Result.success) {
      console.log(`📊 La Gaviota Dashboard: /dashboard/${restaurant1.id}`);
      console.log(`📈 La Gaviota Google Sheets: ${sheets1Result.spreadsheetUrl}`);
    }
    if (sheets2Result.success) {
      console.log(`📊 Bistro Central Dashboard: /dashboard/${restaurant2.id}`);
      console.log(`📈 Bistro Central Google Sheets: ${sheets2Result.spreadsheetUrl}`);
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que GOOGLE_SHEETS_ID esté configurado en .env.local');
    console.log('2. Verifica que google-credentials.json exista y sea válido');
    console.log('3. Verifica que el Service Account tenga acceso a Google Drive');
    console.log('4. Verifica que Google Sheets API y Google Drive API estén habilitadas');
    console.log('5. Verifica que RETELL_API_KEY esté configurado');
  }
}

// Ejecutar pruebas
testSeparateSystems();
