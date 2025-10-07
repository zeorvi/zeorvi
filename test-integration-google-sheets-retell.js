/**
 * 🧪 PRUEBA DE INTEGRACIÓN COMPLETA
 * Google Sheets ↔ Restaurante ↔ Retell AI
 * 
 * Este script verifica:
 * 1. ✅ Conexión a Google Sheets
 * 2. ✅ Lectura de mesas y reservas existentes
 * 3. ✅ Conexión a Retell AI
 * 4. ✅ Creación de una reserva de prueba
 * 5. ✅ Verificación de que la reserva se guarda en Google Sheets
 */

const { google } = require('googleapis');
const https = require('https');

// ============================================
// 🔧 CONFIGURACIÓN
// ============================================

const RESTAURANT_ID = 'rest_003'; // La Gaviota
const SHEET_ID = '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4';
const RETELL_API_KEY = process.env.RETELL_API_KEY || '';

// Credenciales de Google desde google-credentials.json
const GOOGLE_CREDENTIALS = require('./google-credentials.json');

// ============================================
// 🌐 CLIENTE DE GOOGLE SHEETS
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

// ============================================
// 📊 FUNCIONES DE PRUEBA - GOOGLE SHEETS
// ============================================

async function testGoogleSheetsConnection() {
  console.log('\n🔍 PRUEBA 1: Conexión a Google Sheets');
  console.log('=' .repeat(50));
  
  try {
    const sheets = await getSheetsClient();
    
    // Obtener información de la hoja
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });
    
    console.log('✅ Conectado a Google Sheets');
    console.log(`   📄 Nombre: ${spreadsheet.data.properties.title}`);
    console.log(`   🆔 ID: ${SHEET_ID}`);
    console.log(`   🔗 URL: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
    
    // Listar hojas disponibles
    const sheetNames = spreadsheet.data.sheets.map(s => s.properties.title);
    console.log(`   📑 Hojas: ${sheetNames.join(', ')}`);
    
    return { success: true, sheets: sheetNames };
  } catch (error) {
    console.error('❌ Error conectando a Google Sheets:', error.message);
    return { success: false, error: error.message };
  }
}

async function testReadMesas() {
  console.log('\n🔍 PRUEBA 2: Lectura de Mesas');
  console.log('=' .repeat(50));
  
  try {
    const sheets = await getSheetsClient();
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Mesas!A1:F100',
    });
    
    const values = res.data.values || [];
    
    if (values.length === 0) {
      console.log('⚠️  No se encontraron mesas');
      return { success: false, mesas: [] };
    }
    
    // Primera fila son encabezados
    const headers = values[0];
    const mesas = values.slice(1).map(row => ({
      ID: row[0] || '',
      Zona: row[1] || '',
      Capacidad: parseInt(row[2]) || 0,
      Turnos: row[3] || '',
      Estado: row[4] || '',
      Notas: row[5] || '',
    }));
    
    console.log(`✅ Mesas leídas: ${mesas.length}`);
    console.log('   📋 Encabezados:', headers.join(', '));
    console.log('\n   🪑 Mesas disponibles:');
    mesas.forEach(mesa => {
      console.log(`      - ${mesa.ID}: ${mesa.Zona}, Capacidad: ${mesa.Capacidad}, Turnos: ${mesa.Turnos}`);
    });
    
    return { success: true, mesas };
  } catch (error) {
    console.error('❌ Error leyendo mesas:', error.message);
    return { success: false, error: error.message };
  }
}

async function testReadReservas() {
  console.log('\n🔍 PRUEBA 3: Lectura de Reservas Existentes');
  console.log('=' .repeat(50));
  
  try {
    const sheets = await getSheetsClient();
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A1:L100',
    });
    
    const values = res.data.values || [];
    
    if (values.length === 0) {
      console.log('⚠️  No se encontraron reservas');
      return { success: true, reservas: [] };
    }
    
    // Primera fila son encabezados
    const headers = values[0];
    const reservas = values.slice(1).map(row => ({
      ID: row[0] || '',
      Fecha: row[1] || '',
      Hora: row[2] || '',
      Turno: row[3] || '',
      Cliente: row[4] || '',
      Telefono: row[5] || '',
      Personas: parseInt(row[6]) || 0,
      Zona: row[7] || '',
      Mesa: row[8] || '',
      Estado: row[9] || '',
      Notas: row[10] || '',
      Creado: row[11] || '',
    }));
    
    console.log(`✅ Reservas encontradas: ${reservas.length}`);
    console.log('   📋 Encabezados:', headers.join(', '));
    
    if (reservas.length > 0) {
      console.log('\n   📅 Últimas reservas:');
      reservas.slice(-3).forEach(reserva => {
        console.log(`      - ${reserva.ID}: ${reserva.Cliente}, ${reserva.Fecha} ${reserva.Hora}, ${reserva.Personas} personas, Estado: ${reserva.Estado}`);
      });
    }
    
    return { success: true, reservas };
  } catch (error) {
    console.error('❌ Error leyendo reservas:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🤖 FUNCIONES DE PRUEBA - RETELL AI
// ============================================

async function testRetellConnection() {
  console.log('\n🔍 PRUEBA 4: Conexión a Retell AI');
  console.log('=' .repeat(50));
  
  if (!RETELL_API_KEY) {
    console.error('❌ RETELL_API_KEY no está configurada');
    return { success: false, error: 'API Key no configurada' };
  }
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.retellai.com',
      path: '/list-agents',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Conectado a Retell AI');
            console.log(`   🤖 Agentes encontrados: ${response.length || 0}`);
            
            // Buscar agente de La Gaviota
            const gaviotaAgent = response.find(agent => 
              agent.agent_id && agent.agent_id.includes('rest_003')
            );
            
            if (gaviotaAgent) {
              console.log(`   ✅ Agente de La Gaviota encontrado:`);
              console.log(`      - ID: ${gaviotaAgent.agent_id}`);
              console.log(`      - Nombre: ${gaviotaAgent.agent_name || 'N/A'}`);
            } else {
              console.log('   ⚠️  No se encontró agente específico para La Gaviota');
            }
            
            resolve({ success: true, agents: response, gaviotaAgent });
          } else {
            console.error(`❌ Error en Retell AI: ${res.statusCode}`);
            console.error(`   Respuesta: ${data}`);
            resolve({ success: false, error: data });
          }
        } catch (error) {
          console.error('❌ Error parseando respuesta de Retell:', error.message);
          resolve({ success: false, error: error.message });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error conectando a Retell AI:', error.message);
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// ============================================
// 🧪 PRUEBA DE INTEGRACIÓN COMPLETA
// ============================================

async function testCreateReservation() {
  console.log('\n🔍 PRUEBA 5: Crear Reserva de Prueba');
  console.log('=' .repeat(50));
  
  try {
    const sheets = await getSheetsClient();
    
    // Datos de la reserva de prueba
    const testReserva = {
      ID: `TEST_${Date.now()}`,
      Fecha: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mañana
      Hora: '20:00',
      Turno: 'Cena',
      Cliente: 'Test Integration',
      Telefono: '+34 600 000 000',
      Personas: 4,
      Zona: 'Terraza',
      Mesa: 'M6',
      Estado: 'confirmada',
      Notas: 'Reserva de prueba automática - Google Sheets + Retell AI',
      Creado: new Date().toISOString(),
    };
    
    console.log('📝 Creando reserva de prueba:');
    console.log(`   Cliente: ${testReserva.Cliente}`);
    console.log(`   Fecha: ${testReserva.Fecha}`);
    console.log(`   Hora: ${testReserva.Hora}`);
    console.log(`   Personas: ${testReserva.Personas}`);
    console.log(`   Mesa: ${testReserva.Mesa}`);
    
    // Agregar a Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          testReserva.ID,
          testReserva.Fecha,
          testReserva.Hora,
          testReserva.Turno,
          testReserva.Cliente,
          testReserva.Telefono,
          testReserva.Personas.toString(),
          testReserva.Zona,
          testReserva.Mesa,
          testReserva.Estado,
          testReserva.Notas,
          testReserva.Creado,
        ]],
      },
    });
    
    console.log('✅ Reserva creada exitosamente');
    console.log(`   🆔 ID: ${testReserva.ID}`);
    
    // Verificar que se guardó correctamente
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A:L',
    });
    
    const values = res.data.values || [];
    const encontrada = values.find(row => row[0] === testReserva.ID);
    
    if (encontrada) {
      console.log('✅ Verificación: Reserva encontrada en Google Sheets');
      console.log(`   📊 Datos guardados: ${encontrada.join(' | ')}`);
      return { success: true, reserva: testReserva };
    } else {
      console.log('❌ Verificación: Reserva NO encontrada en Google Sheets');
      return { success: false, error: 'Reserva no encontrada después de crearla' };
    }
    
  } catch (error) {
    console.error('❌ Error creando reserva:', error.message);
    return { success: false, error: error.message };
  }
}

async function testApiEndpoint() {
  console.log('\n🔍 PRUEBA 6: API Endpoint de Disponibilidad');
  console.log('=' .repeat(50));
  
  return new Promise((resolve) => {
    const testData = JSON.stringify({
      restaurantId: RESTAURANT_ID,
      fecha: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hora: '21:00',
      personas: 4,
      zona: 'Terraza'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/google-sheets/availability',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length,
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ API Endpoint funcionando');
            console.log(`   Disponible: ${response.disponible ? 'Sí' : 'No'}`);
            if (response.mesa) {
              console.log(`   Mesa sugerida: ${response.mesa}`);
            }
            console.log(`   Mensaje: ${response.mensaje}`);
            resolve({ success: true, response });
          } else {
            console.log('⚠️  API Endpoint respondió con error o no está disponible');
            console.log(`   Status: ${res.statusCode}`);
            resolve({ success: false, note: 'API no disponible o servidor no corriendo' });
          }
        } catch (error) {
          console.log('⚠️  No se pudo conectar al servidor local (esperado si no está corriendo)');
          resolve({ success: false, note: 'Servidor local no disponible' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('⚠️  Servidor local no disponible (normal si no está corriendo)');
      console.log('   Para probar este endpoint, ejecuta: npm run dev');
      resolve({ success: false, note: 'Servidor no disponible' });
    });
    
    req.write(testData);
    req.end();
  });
}

// ============================================
// 🎯 EJECUTAR TODAS LAS PRUEBAS
// ============================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PRUEBA DE INTEGRACIÓN COMPLETA');
  console.log('   Google Sheets ↔ Restaurante ↔ Retell AI');
  console.log('='.repeat(60));
  
  const results = {
    googleSheets: null,
    mesas: null,
    reservas: null,
    retell: null,
    createReservation: null,
    apiEndpoint: null,
  };
  
  try {
    // 1. Probar conexión a Google Sheets
    results.googleSheets = await testGoogleSheetsConnection();
    
    // 2. Leer mesas
    if (results.googleSheets.success) {
      results.mesas = await testReadMesas();
    }
    
    // 3. Leer reservas existentes
    if (results.googleSheets.success) {
      results.reservas = await testReadReservas();
    }
    
    // 4. Probar conexión a Retell AI
    results.retell = await testRetellConnection();
    
    // 5. Crear reserva de prueba
    if (results.googleSheets.success) {
      results.createReservation = await testCreateReservation();
    }
    
    // 6. Probar API endpoint (opcional)
    results.apiEndpoint = await testApiEndpoint();
    
    // ============================================
    // 📊 RESUMEN FINAL
    // ============================================
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    
    const testStatus = [
      { name: '1. Conexión Google Sheets', status: results.googleSheets?.success },
      { name: '2. Lectura de Mesas', status: results.mesas?.success },
      { name: '3. Lectura de Reservas', status: results.reservas?.success },
      { name: '4. Conexión Retell AI', status: results.retell?.success },
      { name: '5. Creación de Reserva', status: results.createReservation?.success },
      { name: '6. API Endpoint', status: results.apiEndpoint?.success, optional: true },
    ];
    
    testStatus.forEach(test => {
      const icon = test.status ? '✅' : test.optional ? '⚠️' : '❌';
      const suffix = test.optional && !test.status ? ' (Opcional)' : '';
      console.log(`${icon} ${test.name}${suffix}`);
    });
    
    const requiredTests = testStatus.filter(t => !t.optional);
    const passedTests = requiredTests.filter(t => t.status).length;
    const totalTests = requiredTests.length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📈 Resultado: ${passedTests}/${totalTests} pruebas exitosas`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
      console.log('\n✨ La integración está funcionando correctamente:');
      console.log('   ✅ Google Sheets conectado');
      console.log('   ✅ Retell AI conectado');
      console.log('   ✅ Datos sincronizados correctamente');
      console.log('\n🔗 Accede a tu Google Sheet:');
      console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
    } else {
      console.log('⚠️  Algunas pruebas fallaron. Revisa los detalles arriba.');
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error ejecutando pruebas:', error);
  }
}

// Ejecutar pruebas
runAllTests().catch(console.error);

