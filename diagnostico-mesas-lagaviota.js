/**
 * Script de diagnóstico para ver las mesas en Google Sheet de La Gaviota
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function diagnosticarMesas() {
  console.log('🔍 Diagnóstico de Mesas - La Gaviota\n');

  const SPREADSHEET_ID = '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4';
  const SHEET_NAME = 'Mesas';

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Primero, listar todas las hojas disponibles
    console.log('📋 Listando todas las hojas en el spreadsheet...\n');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    console.log('Hojas disponibles:');
    spreadsheet.data.sheets?.forEach((sheet, index) => {
      console.log(`  ${index + 1}. ${sheet.properties?.title} (ID: ${sheet.properties?.sheetId})`);
    });
    console.log('');

    // Intentar leer la hoja de Mesas
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Intentando leer hoja: "${SHEET_NAME}"\n`);
    
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:F20`,
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.log('⚠️  La hoja de Mesas existe pero está vacía');
        return;
      }
      
      console.log(`Total de filas: ${rows.length}\n`);
      
      // Mostrar encabezados
      console.log('ENCABEZADOS (Fila 1):');
      if (rows[0]) {
        rows[0].forEach((header, index) => {
          console.log(`  ${String.fromCharCode(65 + index)} = ${header}`);
        });
      }
      
      console.log('\n═══════════════════════════════════════════════════════════════\n');
      
      // Mostrar todas las mesas
      console.log('DATOS (Todas las mesas):\n');
      
      rows.slice(1).forEach((row, index) => {
        if (row[0]) { // Solo mostrar si tiene ID
          console.log(`Mesa ${index + 1}:`);
          console.log(`  A (ID):        ${row[0] || 'vacío'}`);
          console.log(`  B (Zona):      ${row[1] || 'vacío'}`);
          console.log(`  C (Capacidad): ${row[2] || 'vacío'}`);
          console.log(`  D (Turnos):    ${row[3] || 'vacío'}`);
          console.log(`  E (Estado):    ${row[4] || 'vacío'}`);
          console.log(`  F (Notas):     ${row[5] || 'vacío'}`);
          console.log('');
        }
      });
      
      console.log('═══════════════════════════════════════════════════════════════');
      
    } catch (sheetError) {
      console.error(`❌ Error leyendo la hoja "${SHEET_NAME}":`, sheetError.message);
      console.log('\n⚠️  La hoja "Mesas" no existe en este spreadsheet');
      console.log('💡 Necesitas crear una hoja llamada "Mesas" con las siguientes columnas:');
      console.log('   A: ID (M1, M2, M3, etc.)');
      console.log('   B: Zona (Sala Principal, Terraza, etc.)');
      console.log('   C: Capacidad (número de personas)');
      console.log('   D: Turnos (Comida/Cena o vacío)');
      console.log('   E: Estado (Libre, Ocupada, Reservada)');
      console.log('   F: Notas (opcional)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnosticarMesas().catch(console.error);

