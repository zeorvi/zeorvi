// Script para probar directamente la conexión con Google Sheets
const { GoogleSheetsService } = require('./src/lib/googleSheetsService.ts');

async function testGoogleSheets() {
  console.log('🔍 Probando conexión directa con Google Sheets...');
  
  try {
    // Test 1: Leer mesas
    console.log('\n📋 Test 1: Leyendo mesas...');
    const mesas = await GoogleSheetsService.getMesas('rest_003');
    console.log(`✅ Mesas encontradas: ${mesas.length}`);
    mesas.forEach(mesa => {
      console.log(`   - Mesa ${mesa.ID}: ${mesa.Zona}, ${mesa.Capacidad} personas, ${mesa.Estado}`);
    });

    // Test 2: Leer turnos
    console.log('\n⏰ Test 2: Leyendo turnos...');
    const turnos = await GoogleSheetsService.getTurnos('rest_003');
    console.log(`✅ Turnos encontrados: ${turnos.length}`);
    turnos.forEach(turno => {
      console.log(`   - ${turno.Turno}: ${turno.Inicio} - ${turno.Fin}`);
    });

    // Test 3: Leer horarios
    console.log('\n📅 Test 3: Leyendo horarios...');
    const horarios = await GoogleSheetsService.getHorarios('rest_003');
    console.log(`✅ Horarios encontrados: ${horarios.length}`);
    horarios.forEach(horario => {
      console.log(`   - ${horario.Dia}: ${horario.Inicio} - ${horario.Fin}`);
    });

    // Test 4: Leer días cerrados
    console.log('\n🚫 Test 4: Leyendo días cerrados...');
    const diasCerrados = await GoogleSheetsService.getDiasCerrados('rest_003');
    console.log(`✅ Días cerrados: ${diasCerrados.join(', ')}`);

    // Test 5: Leer reservas
    console.log('\n📝 Test 5: Leyendo reservas...');
    const reservas = await GoogleSheetsService.getReservas('rest_003');
    console.log(`✅ Reservas encontradas: ${reservas.length}`);

    // Test 6: Verificar disponibilidad
    console.log('\n🔍 Test 6: Verificando disponibilidad...');
    const disponibilidad = await GoogleSheetsService.verificarDisponibilidad(
      'rest_003',
      '2025-01-15', // Fecha futura
      '20:00',
      4,
      'Salón Principal'
    );
    console.log(`✅ Resultado: ${JSON.stringify(disponibilidad, null, 2)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGoogleSheets();
