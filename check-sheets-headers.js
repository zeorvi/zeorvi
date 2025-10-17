// Script para verificar los encabezados de Google Sheets
const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const RESTAURANT_ID = 'rest_003';
const SHEET_IDS = {
  'rest_003': '1u9PaKvpvmz_eHTI_y5Sn8BKXnJgKb98AJrbh8_Dj7Zg',
};

async function checkHeaders() {
  try {
    console.log('🔍 Verificando encabezados de Google Sheets...\n');
    
    // Configurar cliente
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = SHEET_IDS[RESTAURANT_ID];
    
    // 1. Leer encabezados (fila 1)
    console.log('📋 Leyendo fila de encabezados...');
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Reservas!A1:L1',
    });
    
    const headers = headersResponse.data.values?.[0] || [];
    console.log('Encabezados actuales:', headers);
    console.log('Total de columnas:', headers.length);
    
    headers.forEach((header, idx) => {
      const column = String.fromCharCode(65 + idx); // A, B, C, etc.
      console.log(`  ${column}: ${header}`);
    });
    
    // 2. Leer las últimas 3 filas de datos
    console.log('\n\n📊 Leyendo últimas 3 reservas...');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Reservas!A2:L',
    });
    
    const rows = dataResponse.data.values || [];
    console.log(`Total de reservas: ${rows.length}`);
    
    if (rows.length > 0) {
      const ultimas = rows.slice(-3);
      console.log('\n📋 Últimas 3 reservas:');
      
      ultimas.forEach((row, idx) => {
        console.log(`\n${idx + 1}. Fila ${rows.length - ultimas.length + idx + 2}:`);
        row.forEach((value, colIdx) => {
          const column = String.fromCharCode(65 + colIdx);
          const headerName = headers[colIdx] || `Columna ${column}`;
          console.log(`   ${column} (${headerName}): ${value}`);
        });
      });
    }
    
    // 3. Verificar si hay datos en columnas que no deberían tener
    console.log('\n\n🔍 Buscando datos fuera del rango esperado (más allá de columna L)...');
    const extraResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Reservas!M2:Z',
    });
    
    const extraData = extraResponse.data.values || [];
    if (extraData.length > 0 && extraData.some(row => row.length > 0)) {
      console.log('⚠️  Se encontraron datos más allá de la columna L:');
      extraData.forEach((row, idx) => {
        if (row.length > 0) {
          console.log(`   Fila ${idx + 2}: ${row.join(', ')}`);
        }
      });
    } else {
      console.log('✅ No hay datos más allá de la columna L');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
  }
}

checkHeaders();

