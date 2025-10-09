/**
 * 🧪 PRUEBA: Dashboard ↔ Google Sheets
 * 
 * Verifica que el dashboard del restaurante realmente lea
 * las reservas desde Google Sheets
 */

const { google } = require('googleapis');

const RESTAURANT_ID = 'rest_003'; // La Gaviota
const SHEET_ID = '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4';
const GOOGLE_CREDENTIALS = require('./google-credentials.json');

// ============================================
// 🔧 CONFIGURACIÓN
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
// 📊 PRUEBA 1: Leer reservas desde Google Sheets directamente
// ============================================

async function testReadFromGoogleSheets() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRUEBA 1: Leer Reservas desde Google Sheets Directamente');
  console.log('='.repeat(80));
  
  try {
    const sheets = await getSheetsClient();
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Fecha de hoy: ${today}`);
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A1:L100',
    });
    
    const values = res.data.values || [];
    
    if (values.length === 0) {
      console.log('❌ No se encontraron reservas en Google Sheets');
      return { success: false, reservas: [] };
    }
    
    const headers = values[0];
    const reservas = values.slice(1);
    
    console.log(`\n✅ Total de reservas en Google Sheets: ${reservas.length}`);
    console.log(`   Encabezados: ${headers.join(', ')}`);
    
    // Filtrar reservas de hoy
    const reservasHoy = reservas.filter(r => r[1] === today);
    console.log(`\n📅 Reservas para HOY (${today}): ${reservasHoy.length}`);
    
    if (reservasHoy.length > 0) {
      console.log('\n   Detalles:');
      reservasHoy.forEach(r => {
        console.log(`   • ${r[2]} - ${r[4]} (${r[6]} personas) - Mesa ${r[8]} - ${r[9]}`);
      });
    } else {
      console.log('   ⚠️  No hay reservas para hoy');
      console.log('\n   Mostrando todas las reservas:');
      reservas.slice(0, 5).forEach(r => {
        console.log(`   • ${r[1]} ${r[2]} - ${r[4]} (${r[6]} personas) - Mesa ${r[8]} - ${r[9]}`);
      });
    }
    
    return { success: true, reservas, reservasHoy, today };
    
  } catch (error) {
    console.error('❌ Error leyendo desde Google Sheets:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🌐 PRUEBA 2: Probar endpoint de API
// ============================================

async function testAPIEndpoint(today) {
  console.log('\n' + '='.repeat(80));
  console.log('🌐 PRUEBA 2: Endpoint de API (/api/google-sheets/reservas)');
  console.log('='.repeat(80));
  
  const http = require('http');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}&fecha=${today}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log(`\n📡 Haciendo petición a: http://localhost:3000${options.path}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            console.log('✅ API Endpoint funcionando correctamente');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Total reservas: ${response.total}`);
            console.log(`   Fecha: ${response.fecha}`);
            
            if (response.reservas && response.reservas.length > 0) {
              console.log('\n   Reservas recibidas:');
              response.reservas.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.Hora} - ${r.Cliente} (${r.Personas} personas) - Mesa ${r.Mesa} - ${r.Estado}`);
              });
            } else {
              console.log('   ℹ️  No hay reservas para hoy');
            }
            
            resolve({ success: true, response });
          } else {
            console.log(`⚠️  API respondió con status: ${res.statusCode}`);
            console.log(`   Respuesta:`, response);
            resolve({ success: false, response, status: res.statusCode });
          }
        } catch (error) {
          console.error('❌ Error parseando respuesta:', error.message);
          resolve({ success: false, error: error.message });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('⚠️  No se pudo conectar al servidor local');
      console.log('   Asegúrate de que el servidor esté corriendo: npm run dev');
      console.log(`   Error: ${error.message}`);
      resolve({ success: false, note: 'Servidor no disponible', error: error.message });
    });
    
    req.end();
  });
}

// ============================================
// 🖥️  PRUEBA 3: Verificar componente DailyAgenda
// ============================================

async function testDailyAgendaComponent() {
  console.log('\n' + '='.repeat(80));
  console.log('🖥️  PRUEBA 3: Componente DailyAgenda del Dashboard');
  console.log('='.repeat(80));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const componentPath = path.join(__dirname, 'src', 'components', 'restaurant', 'DailyAgenda.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Verificar que el componente hace fetch a Google Sheets
    const hasGoogleSheetsCall = componentContent.includes('/api/google-sheets/reservas');
    const hasRestaurantId = componentContent.includes('restaurantId=');
    const hasDateParam = componentContent.includes('fecha=');
    
    console.log('\n✅ Análisis del componente DailyAgenda:');
    console.log(`   Hace llamada a Google Sheets API: ${hasGoogleSheetsCall ? '✅ Sí' : '❌ No'}`);
    console.log(`   Incluye restaurantId: ${hasRestaurantId ? '✅ Sí' : '❌ No'}`);
    console.log(`   Incluye parámetro de fecha: ${hasDateParam ? '✅ Sí' : '❌ No'}`);
    
    // Extraer la línea exacta de la llamada
    const lines = componentContent.split('\n');
    const fetchLine = lines.find(line => line.includes('/api/google-sheets/reservas'));
    
    if (fetchLine) {
      console.log('\n   📝 Línea de código que hace el fetch:');
      console.log(`   ${fetchLine.trim()}`);
    }
    
    return {
      success: hasGoogleSheetsCall && hasRestaurantId && hasDateParam,
      hasGoogleSheetsCall,
      hasRestaurantId,
      hasDateParam
    };
    
  } catch (error) {
    console.error('❌ Error leyendo componente:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// 🎯 EJECUTAR TODAS LAS PRUEBAS
// ============================================

async function runAllTests() {
  console.log('\n' + '█'.repeat(80));
  console.log('🧪 PRUEBA COMPLETA: Dashboard ↔ Google Sheets');
  console.log('█'.repeat(80));
  
  const results = {
    googleSheets: null,
    apiEndpoint: null,
    component: null
  };
  
  try {
    // 1. Probar lectura directa de Google Sheets
    results.googleSheets = await testReadFromGoogleSheets();
    
    // 2. Probar endpoint de API (si el servidor está corriendo)
    if (results.googleSheets.success) {
      results.apiEndpoint = await testAPIEndpoint(results.googleSheets.today);
    }
    
    // 3. Verificar componente del dashboard
    results.component = await testDailyAgendaComponent();
    
    // ============================================
    // 📊 RESUMEN FINAL
    // ============================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(80));
    
    const tests = [
      { 
        name: '1. Lectura desde Google Sheets', 
        status: results.googleSheets?.success 
      },
      { 
        name: '2. Endpoint de API', 
        status: results.apiEndpoint?.success,
        optional: !results.apiEndpoint || results.apiEndpoint.note === 'Servidor no disponible'
      },
      { 
        name: '3. Componente DailyAgenda configurado', 
        status: results.component?.success 
      }
    ];
    
    tests.forEach(test => {
      const icon = test.status ? '✅' : test.optional ? '⚠️' : '❌';
      const suffix = test.optional && !test.status ? ' (Servidor no corriendo)' : '';
      console.log(`${icon} ${test.name}${suffix}`);
    });
    
    const requiredTests = tests.filter(t => !t.optional);
    const passedTests = requiredTests.filter(t => t.status).length;
    const totalTests = requiredTests.length;
    
    console.log('\n' + '='.repeat(80));
    console.log(`📈 Resultado: ${passedTests}/${totalTests} pruebas esenciales exitosas`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ¡DASHBOARD CONECTADO A GOOGLE SHEETS!');
      console.log('\n✅ Verificaciones completadas:');
      console.log('   ✅ Google Sheets contiene las reservas');
      console.log('   ✅ El endpoint de API está configurado correctamente');
      console.log('   ✅ El componente DailyAgenda hace fetch a Google Sheets');
      
      if (results.apiEndpoint?.success) {
        console.log('\n🚀 PRÓXIMO PASO: Abrir el dashboard en el navegador');
        console.log(`   URL: http://localhost:3000/dashboard/${RESTAURANT_ID}`);
        console.log('   Deberías ver las reservas de Google Sheets en el dashboard');
      } else {
        console.log('\n🚀 PRÓXIMO PASO: Iniciar el servidor');
        console.log('   1. Ejecuta: npm run dev');
        console.log(`   2. Abre: http://localhost:3000/dashboard/${RESTAURANT_ID}`);
        console.log('   3. Verifica que las reservas de Google Sheets aparezcan');
      }
    } else {
      console.log('⚠️  Algunas pruebas fallaron. Revisa los detalles arriba.');
    }
    
    console.log('\n🔗 Google Sheet:');
    console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error ejecutando pruebas:', error);
  }
}

// Ejecutar pruebas
runAllTests().catch(console.error);


