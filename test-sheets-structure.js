// Script para verificar la estructura de Google Sheets
const RESTAURANT_ID = 'rest_003';
const API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'http://localhost:3000';

async function testSheetsStructure() {
  console.log('🔍 Verificando estructura de Google Sheets...\n');
  
  try {
    // 1. Leer las reservas actuales
    const response = await fetch(`${API_URL}/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}`);
    const data = await response.json();
    
    console.log('📊 Reservas actuales:', data.reservas?.length || 0);
    
    // Mostrar las últimas 3 reservas para ver su estructura
    if (data.reservas && data.reservas.length > 0) {
      console.log('\n📋 Últimas 3 reservas:');
      const ultimas = data.reservas.slice(-3);
      ultimas.forEach((reserva, idx) => {
        console.log(`\n${idx + 1}. Reserva:`);
        console.log(`   ID: ${reserva.ID}`);
        console.log(`   Fecha: ${reserva.Fecha}`);
        console.log(`   Hora: ${reserva.Hora}`);
        console.log(`   Turno: ${reserva.Turno}`);
        console.log(`   Cliente: ${reserva.Cliente}`);
        console.log(`   Telefono: ${reserva.Telefono}`);
        console.log(`   Personas: ${reserva.Personas}`);
        console.log(`   Zona: ${reserva.Zona}`);
        console.log(`   Mesa: ${reserva.Mesa}`);
        console.log(`   Estado: ${reserva.Estado}`);
        console.log(`   Notas: ${reserva.Notas}`);
        console.log(`   Creado: ${reserva.Creado}`);
      });
    }
    
    // 2. Verificar encabezados consultando el rango A1:L1
    console.log('\n\n🔍 Verificando encabezados de la hoja...');
    console.log('(Esto requeriría hacer una llamada directa a Google Sheets API)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSheetsStructure();

