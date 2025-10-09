/**
 * 📋 VER RESERVAS ACTUALES EN GOOGLE SHEETS
 * 
 * Este script muestra todas las reservas actuales del restaurante La Gaviota
 * directamente desde Google Sheets
 */

const { google } = require('googleapis');

const SHEET_ID = '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4';
const GOOGLE_CREDENTIALS = require('./google-credentials.json');

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

async function verReservas() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESERVAS ACTUALES - RESTAURANTE LA GAVIOTA');
  console.log('='.repeat(80));
  
  try {
    const sheets = await getSheetsClient();
    
    // Leer reservas
    const reservasRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Reservas!A1:L100',
    });
    
    const values = reservasRes.data.values || [];
    
    if (values.length === 0) {
      console.log('⚠️  No se encontraron reservas');
      return;
    }
    
    const headers = values[0];
    const reservas = values.slice(1);
    
    console.log(`\n✅ Total de reservas: ${reservas.length}`);
    console.log('🔗 Google Sheet: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit');
    
    // Agrupar por estado
    const confirmadas = reservas.filter(r => r[9]?.toLowerCase() === 'confirmada');
    const pendientes = reservas.filter(r => r[9]?.toLowerCase() === 'pendiente');
    const canceladas = reservas.filter(r => r[9]?.toLowerCase() === 'cancelada');
    
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   ✅ Confirmadas: ${confirmadas.length}`);
    console.log(`   ⏳ Pendientes: ${pendientes.length}`);
    console.log(`   ❌ Canceladas: ${canceladas.length}`);
    
    // Mostrar reservas confirmadas
    if (confirmadas.length > 0) {
      console.log('\n' + '─'.repeat(80));
      console.log('✅ RESERVAS CONFIRMADAS:');
      console.log('─'.repeat(80));
      
      confirmadas.forEach((reserva, index) => {
        console.log(`\n${index + 1}. 📅 ${reserva[1]} a las ${reserva[2]} (${reserva[3]})`);
        console.log(`   👤 Cliente: ${reserva[4]}`);
        console.log(`   📞 Teléfono: ${reserva[5]}`);
        console.log(`   👥 Personas: ${reserva[6]}`);
        console.log(`   📍 Zona: ${reserva[7]} | Mesa: ${reserva[8]}`);
        if (reserva[10]) {
          console.log(`   📝 Notas: ${reserva[10]}`);
        }
        console.log(`   🆔 ID: ${reserva[0]}`);
      });
    }
    
    // Mostrar mesas disponibles
    const mesasRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Mesas!A2:F100',
    });
    
    const mesas = mesasRes.data.values || [];
    
    console.log('\n' + '─'.repeat(80));
    console.log('🪑 MESAS CONFIGURADAS:');
    console.log('─'.repeat(80));
    
    const zonas = {};
    mesas.forEach(mesa => {
      const zona = mesa[1];
      if (!zonas[zona]) {
        zonas[zona] = [];
      }
      zonas[zona].push({
        id: mesa[0],
        capacidad: mesa[2],
        turnos: mesa[3]
      });
    });
    
    Object.keys(zonas).forEach(zona => {
      console.log(`\n📍 ${zona}:`);
      zonas[zona].forEach(mesa => {
        console.log(`   • ${mesa.id}: Capacidad ${mesa.capacidad} personas (${mesa.turnos})`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✨ Sistema de reservas funcionando correctamente');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verReservas().catch(console.error);


