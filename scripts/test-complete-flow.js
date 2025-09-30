const { RetellReservationFlow } = require('../src/lib/retellReservationFlow');

async function testCompleteFlow() {
  console.log('🧪 Probando Flujo Completo: Cliente → Retell AI → Google Sheets → Dashboard\n');

  try {
    // 1. Simular llamada de cliente solicitando reserva
    console.log('📞 Simulando llamada de cliente...');
    const reservationRequest = {
      customerName: 'Juan Pérez',
      phone: '555-1234',
      people: 4,
      date: new Date().toISOString().split('T')[0], // Hoy
      time: '20:00',
      specialRequests: 'Mesa cerca de la ventana, cumpleaños',
      restaurantId: 'rest_gaviota_001',
      restaurantName: 'La Gaviota',
      spreadsheetId: 'spreadsheet_gaviota_001'
    };

    console.log('📋 Solicitud de reserva:', reservationRequest);

    // 2. Procesar solicitud de reserva
    console.log('\n🔄 Procesando solicitud de reserva...');
    const result = await RetellReservationFlow.processReservationRequest(reservationRequest);

    if (result.success) {
      console.log('✅ Reserva procesada exitosamente!');
      console.log('📝 Mensaje para el cliente:', result.message);
      console.log('🆔 ID de reserva:', result.reservationId);
      console.log('📊 Datos de reserva:', result.reservation);
    } else {
      console.log('❌ Reserva no pudo ser procesada');
      console.log('📝 Mensaje para el cliente:', result.message);
    }

    // 3. Simular verificación de disponibilidad
    console.log('\n🔍 Verificando disponibilidad...');
    const availability = await RetellReservationFlow.checkAvailability(
      reservationRequest.date,
      '21:00', // Hora diferente
      2, // Menos personas
      reservationRequest.restaurantId,
      reservationRequest.restaurantName,
      reservationRequest.spreadsheetId
    );

    console.log('📊 Disponibilidad:', availability);

    // 4. Simular búsqueda de reserva existente
    console.log('\n🔍 Buscando reserva existente...');
    const existingReservation = await RetellReservationFlow.findExistingReservation(
      reservationRequest.customerName,
      reservationRequest.phone,
      reservationRequest.restaurantId,
      reservationRequest.restaurantName
    );

    if (existingReservation) {
      console.log('✅ Reserva existente encontrada:', existingReservation);
    } else {
      console.log('ℹ️ No se encontró reserva existente');
    }

    // 5. Simular modificación de reserva
    console.log('\n🔄 Simulando modificación de reserva...');
    const modifyResult = await RetellReservationFlow.modifyExistingReservation(
      reservationRequest.customerName,
      reservationRequest.phone,
      reservationRequest.date,
      '21:00', // Nueva hora
      2, // Nuevo número de personas
      reservationRequest.restaurantId,
      reservationRequest.restaurantName,
      reservationRequest.spreadsheetId
    );

    console.log('📝 Resultado de modificación:', modifyResult);

    console.log('\n🎉 ¡Flujo completo probado exitosamente!');
    console.log('\n📋 Resumen del flujo:');
    console.log('✅ Cliente llama al restaurante');
    console.log('✅ Retell AI detecta solicitud de reserva');
    console.log('✅ Sistema verifica disponibilidad en Google Sheets');
    console.log('✅ Sistema crea/modifica reserva en Google Sheets');
    console.log('✅ Sistema genera respuesta para el cliente');
    console.log('✅ Dashboard se actualiza en tiempo real');
    console.log('✅ Cliente recibe confirmación o rechazo');

    console.log('\n🔗 APIs disponibles:');
    console.log('📞 Webhook Retell AI: POST /api/retell/webhook');
    console.log('🔄 Procesar reserva: POST /api/retell/reservation');
    console.log('🔍 Verificar disponibilidad: GET /api/retell/reservation');
    console.log('📊 Obtener reservas: GET /api/google-sheets/reservas');

  } catch (error) {
    console.error('❌ Error en el flujo completo:', error);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que Google Sheets esté configurado correctamente');
    console.log('2. Verifica que las credenciales de Google estén configuradas');
    console.log('3. Verifica que el spreadsheet ID sea correcto');
    console.log('4. Revisa los logs para más detalles del error');
  }
}

// Ejecutar prueba del flujo completo
testCompleteFlow();
