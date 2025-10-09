require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function verificarMesas() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4'; // La Gaviota

    console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DE GOOGLE SHEETS\n');
    console.log('='.repeat(60));

    // Obtener mesas
    const resMesas = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Mesas!A1:F100',
    });

    console.log('\n📋 PESTAÑA MESAS:');
    console.log('='.repeat(60));
    const mesas = resMesas.data.values || [];
    
    if (mesas.length === 0) {
      console.log('❌ NO HAY MESAS CONFIGURADAS');
    } else {
      console.log(`✅ ${mesas.length} filas encontradas (incluyendo encabezado)\n`);
      
      // Mostrar encabezado
      console.log('ENCABEZADO:', mesas[0].join(' | '));
      console.log('-'.repeat(60));
      
      // Mostrar todas las mesas
      for (let i = 1; i < mesas.length; i++) {
        const mesa = mesas[i];
        if (mesa && mesa.length > 0) {
          console.log(`Mesa ${i}:`, mesa.join(' | '));
          
          // Analizar la mesa
          const id = mesa[0] || '';
          const zona = mesa[1] || '';
          const capacidad = mesa[2] || '';
          const turnos = mesa[3] || '';
          const estado = mesa[4] || '';
          const notas = mesa[5] || '';
          
          console.log(`  → ID: ${id}`);
          console.log(`  → Zona: ${zona}`);
          console.log(`  → Capacidad: ${capacidad}`);
          console.log(`  → Turnos: ${turnos}`);
          console.log(`  → Estado: ${estado}`);
          if (notas) console.log(`  → Notas: ${notas}`);
          console.log('');
        }
      }
    }

    // Obtener reservas
    console.log('\n📋 PESTAÑA RESERVAS:');
    console.log('='.repeat(60));
    const resReservas = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Reservas!A1:K100',
    });

    const reservas = resReservas.data.values || [];
    if (reservas.length <= 1) {
      console.log('✅ NO HAY RESERVAS (solo encabezado o vacío)');
    } else {
      console.log(`📝 ${reservas.length - 1} reservas encontradas\n`);
      console.log('ENCABEZADO:', reservas[0].join(' | '));
      console.log('-'.repeat(60));
      
      for (let i = 1; i < reservas.length; i++) {
        const reserva = reservas[i];
        if (reserva && reserva.length > 0) {
          console.log(`Reserva ${i}:`, reserva.join(' | '));
        }
      }
    }

    // Obtener horarios
    console.log('\n📋 PESTAÑA HORARIOS:');
    console.log('='.repeat(60));
    const resHorarios = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Horarios!A1:C100',
    });

    const horarios = resHorarios.data.values || [];
    if (horarios.length <= 1) {
      console.log('❌ NO HAY HORARIOS CONFIGURADOS');
    } else {
      console.log(`✅ ${horarios.length - 1} horarios configurados\n`);
      console.log('ENCABEZADO:', horarios[0].join(' | '));
      console.log('-'.repeat(60));
      
      for (let i = 1; i < horarios.length; i++) {
        const horario = horarios[i];
        if (horario && horario.length > 0) {
          console.log(`${horario[0]} → ${horario[1]} - ${horario[2]}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verificarMesas();

