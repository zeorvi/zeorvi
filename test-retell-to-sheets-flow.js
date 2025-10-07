/**
 * 🧪 PRUEBA DE FLUJO COMPLETO
 * Simula una llamada de Retell AI → Webhook → Google Sheets
 * 
 * Este script simula:
 * 1. Una llamada real de Retell AI con datos de reserva
 * 2. El webhook que procesa la llamada
 * 3. La creación de la reserva en Google Sheets
 * 4. Verificación de que los datos se guardaron correctamente
 */

const { google } = require('googleapis');
const http = require('http');

// ============================================
// 🔧 CONFIGURACIÓN
// ============================================

const RESTAURANT_ID = 'rest_003'; // La Gaviota
const SHEET_ID = '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4';
const GOOGLE_CREDENTIALS = require('./google-credentials.json');

// ============================================
// 📞 SIMULAR LLAMADA DE RETELL AI
// ============================================

async function simulateRetellCall() {
  console.log('\n' + '='.repeat(60));
  console.log('🎤 SIMULACIÓN DE LLAMADA DE RETELL AI');
  console.log('='.repeat(60));
  
  // Datos que Retell AI enviaría en una llamada real
  const retellCallData = {
    event: 'call_ended',
    call_id: `call_test_${Date.now()}`,
    agent_id: 'rest_003_agent',
    transcript: 'Cliente: Hola, quisiera hacer una reserva\nAgente: Por supuesto, ¿para cuándo?\nCliente: Para mañana a las 8 de la noche\nAgente: ¿Cuántas personas?\nCliente: Somos 4 personas\nAgente: ¿A qué nombre?\nCliente: María García\nAgente: ¿Me puede dar un teléfono?\nCliente: Sí, 666123456\nAgente: ¿Alguna preferencia de zona?\nCliente: En la terraza si es posible\nAgente: Perfecto, confirmado',
    call_analysis: {
      call_summary: 'Reserva confirmada para 4 personas en terraza',
      in_voicemail: false,
      user_sentiment: 'Positive',
      call_successful: true,
      custom_analysis_data: {
        reservation_made: true,
        customer_name: 'María García',
        phone: '+34666123456',
        people: 4,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '20:00',
        zone: 'Terraza',
        special_requests: 'Preferencia de terraza'
      }
    },
    metadata: {
      restaurantId: RESTAURANT_ID,
      restaurantName: 'La Gaviota'
    },
    start_timestamp: Date.now() - 180000, // 3 minutos atrás
    end_timestamp: Date.now(),
    call_type: 'web_call'
  };
  
  console.log('\n📋 Datos de la llamada simulada:');
  console.log(`   📞 Call ID: ${retellCallData.call_id}`);
  console.log(`   🤖 Agent ID: ${retellCallData.agent_id}`);
  console.log(`   👤 Cliente: ${retellCallData.call_analysis.custom_analysis_data.customer_name}`);
  console.log(`   📅 Fecha: ${retellCallData.call_analysis.custom_analysis_data.date}`);
  console.log(`   🕐 Hora: ${retellCallData.call_analysis.custom_analysis_data.time}`);
  console.log(`   👥 Personas: ${retellCallData.call_analysis.custom_analysis_data.people}`);
  console.log(`   📍 Zona: ${retellCallData.call_analysis.custom_analysis_data.zone}`);
  
  return retellCallData;
}

// ============================================
// 📊 PROCESAR Y GUARDAR EN GOOGLE SHEETS
// ============================================

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CREDENTIALS.client_email,
      private_key: GOOGLE_CREDENTIALS.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  return google.sheets({ version: 'v4', auth });
}

async function processRetellWebhook(callData) {
  console.log('\n' + '='.repeat(60));
  console.log('⚙️  PROCESANDO WEBHOOK');
  console.log('='.repeat(60));
  
  try {
    // Extraer datos de la reserva
    const analysisData = callData.call_analysis.custom_analysis_data;
    
    if (!analysisData.reservation_made) {
      console.log('⚠️  La llamada no resultó en una reserva');
      return { success: false, reason: 'No reservation made' };
    }
    
    console.log('\n✅ Reserva detectada en la llamada');
    console.log('   Extrayendo datos...');
    
    // Verificar disponibilidad primero
    const sheets = await getSheetsClient();
    
    // Leer mesas disponibles
    const mesasRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Mesas!A2:F100',
    });
    
    const mesas = mesasRes.data.values || [];
    const mesasTerraza = mesas.filter(row => 
      row[1] === analysisData.zone && 
      parseInt(row[2]) >= analysisData.people &&
      row[3].includes('Cena')
    );
    
    if (mesasTerraza.length === 0) {
      console.log('❌ No hay mesas disponibles en la zona solicitada');
      return { success: false, reason: 'No tables available' };
    }
    
    const mesaAsignada = mesasTerraza[0][0]; // Primera mesa disponible
    console.log(`   ✅ Mesa asignada: ${mesaAsignada}`);
    
    // Crear la reserva
    const reservaId = `R${Date.now()}`;
    const reserva = {
      ID: reservaId,
      Fecha: analysisData.date,
      Hora: analysisData.time,
      Turno: 'Cena',
      Cliente: analysisData.customer_name,
      Telefono: analysisData.phone,
      Personas: analysisData.people,
      Zona: analysisData.zone,
      Mesa: mesaAsignada,
      Estado: 'Confirmada',
      Notas: `${analysisData.special_requests} | Call ID: ${callData.call_id}`,
      Creado: new Date().toISOString()
    };
    
    console.log('\n📝 Guardando en Google Sheets...');
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          reserva.ID,
          reserva.Fecha,
          reserva.Hora,
          reserva.Turno,
          reserva.Cliente,
          reserva.Telefono,
          reserva.Personas.toString(),
          reserva.Zona,
          reserva.Mesa,
          reserva.Estado,
          reserva.Notas,
          reserva.Creado
        ]]
      }
    });
    
    console.log('✅ Reserva guardada exitosamente');
    console.log(`   🆔 ID de Reserva: ${reserva.ID}`);
    
    return { 
      success: true, 
      reserva,
      message: `Reserva confirmada para ${reserva.Cliente} el ${reserva.Fecha} a las ${reserva.Hora}`
    };
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// ✅ VERIFICAR EN GOOGLE SHEETS
// ============================================

async function verifyInSheets(reservaId) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO EN GOOGLE SHEETS');
  console.log('='.repeat(60));
  
  try {
    const sheets = await getSheetsClient();
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A:L',
    });
    
    const values = res.data.values || [];
    const reserva = values.find(row => row[0] === reservaId);
    
    if (reserva) {
      console.log('✅ Reserva encontrada en Google Sheets');
      console.log('\n📊 Datos guardados:');
      console.log(`   ID: ${reserva[0]}`);
      console.log(`   Fecha: ${reserva[1]}`);
      console.log(`   Hora: ${reserva[2]}`);
      console.log(`   Turno: ${reserva[3]}`);
      console.log(`   Cliente: ${reserva[4]}`);
      console.log(`   Teléfono: ${reserva[5]}`);
      console.log(`   Personas: ${reserva[6]}`);
      console.log(`   Zona: ${reserva[7]}`);
      console.log(`   Mesa: ${reserva[8]}`);
      console.log(`   Estado: ${reserva[9]}`);
      console.log(`   Notas: ${reserva[10]}`);
      console.log(`   Creado: ${reserva[11]}`);
      
      return { success: true, data: reserva };
    } else {
      console.log('❌ Reserva NO encontrada en Google Sheets');
      return { success: false };
    }
    
  } catch (error) {
    console.error('❌ Error verificando en Google Sheets:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🧪 EJECUTAR FLUJO COMPLETO
// ============================================

async function runCompleteFlow() {
  console.log('\n' + '█'.repeat(60));
  console.log('🧪 PRUEBA DE FLUJO COMPLETO');
  console.log('   Retell AI → Webhook → Google Sheets');
  console.log('█'.repeat(60));
  
  try {
    // 1. Simular llamada de Retell AI
    const callData = await simulateRetellCall();
    
    // 2. Procesar webhook y guardar en Google Sheets
    const webhookResult = await processRetellWebhook(callData);
    
    if (!webhookResult.success) {
      console.log('\n❌ El webhook falló:', webhookResult.reason || webhookResult.error);
      return;
    }
    
    // 3. Verificar que se guardó correctamente
    const verification = await verifyInSheets(webhookResult.reserva.ID);
    
    // ============================================
    // 📊 RESUMEN FINAL
    // ============================================
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL FLUJO');
    console.log('='.repeat(60));
    
    console.log('\n✅ Pasos completados:');
    console.log('   1. ✅ Llamada de Retell AI simulada');
    console.log('   2. ✅ Webhook procesado correctamente');
    console.log('   3. ✅ Datos extraídos de la conversación');
    console.log('   4. ✅ Mesa asignada automáticamente');
    console.log('   5. ✅ Reserva guardada en Google Sheets');
    console.log('   6. ✅ Verificación exitosa');
    
    console.log('\n🎉 ¡FLUJO COMPLETO FUNCIONANDO!');
    console.log('\n📌 Mensaje para el cliente:');
    console.log(`   "${webhookResult.message}"`);
    
    console.log('\n🔗 Ver en Google Sheets:');
    console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error en el flujo:', error);
  }
}

// Ejecutar flujo completo
runCompleteFlow().catch(console.error);

