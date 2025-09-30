const { GoogleSheetsService } = require('../src/lib/googleSheetsService');

async function testGoogleSheets() {
  console.log('🧪 Probando conexión con Google Sheets...\n');

  try {
    // 1. Probar lectura de reservas
    console.log('📖 Leyendo reservas existentes...');
    const reservas = await GoogleSheetsService.getReservas();
    console.log(`✅ Encontradas ${reservas.length} reservas`);
    
    if (reservas.length > 0) {
      console.log('📋 Primera reserva:', reservas[0]);
    }

    // 2. Probar estadísticas
    console.log('\n📊 Obteniendo estadísticas...');
    const stats = await GoogleSheetsService.getEstadisticas();
    console.log('✅ Estadísticas:', stats);

    // 3. Probar disponibilidad
    console.log('\n🔍 Verificando disponibilidad...');
    const hoy = new Date().toISOString().split('T')[0];
    const disponible = await GoogleSheetsService.verificarDisponibilidad(hoy, '20:00', 4);
    console.log(`✅ Disponibilidad para ${hoy} a las 20:00 para 4 personas: ${disponible ? 'SÍ' : 'NO'}`);

    // 4. Probar creación de reserva de prueba
    console.log('\n➕ Creando reserva de prueba...');
    const reservaPrueba = {
      fecha: hoy,
      hora: '21:00',
      horario: '21:00',
      cliente: 'Cliente Prueba',
      telefono: '555-1234',
      personas: 2,
      estado: 'confirmada',
      notas: 'Reserva de prueba desde script'
    };

    const creada = await GoogleSheetsService.crearReserva(reservaPrueba);
    console.log(`✅ Reserva de prueba ${creada ? 'creada exitosamente' : 'falló'}`);

    console.log('\n🎉 ¡Todas las pruebas pasaron! Google Sheets está configurado correctamente.');

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
testGoogleSheets();
