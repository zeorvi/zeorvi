// Script para corregir filas desalineadas y probar la solución
const API_URL = 'http://localhost:3000';
const RESTAURANT_ID = 'rest_003';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  console.log('⏳ Esperando a que el servidor esté listo...\n');
  
  let ready = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!ready && attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        ready = true;
        console.log('✅ Servidor listo!\n');
      }
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        process.stdout.write(`   Intento ${attempts}/${maxAttempts}...\r`);
        await wait(2000);
      }
    }
  }
  
  return ready;
}

async function fixAlignment() {
  const ready = await waitForServer();
  
  if (!ready) {
    console.error('❌ El servidor no está disponible');
    return;
  }
  
  try {
    console.log('═══════════════════════════════════════════════');
    console.log('🔧 CORRECCIÓN DE ALINEACIÓN EN GOOGLE SHEETS');
    console.log('═══════════════════════════════════════════════\n');
    
    // Paso 1: Analizar (dry run)
    console.log('📊 Paso 1: Analizando filas desalineadas...\n');
    const dryRunResponse = await fetch(`${API_URL}/api/google-sheets/fix-alignment?restaurantId=${RESTAURANT_ID}&dryRun=true`, {
      method: 'POST'
    });
    
    const dryRunData = await dryRunResponse.json();
    
    if (dryRunData.misalignedRows && dryRunData.misalignedRows.length > 0) {
      console.log(`⚠️  Encontradas ${dryRunData.misalignedRows.length} filas desalineadas:\n`);
      dryRunData.misalignedRows.forEach(row => {
        console.log(`   • Fila ${row.row}: ID=${row.currentFirstValue}`);
        console.log(`     Vista previa: ${row.preview.slice(0, 5).join(' | ')}`);
      });
      
      console.log('\n\n🔧 Paso 2: Corrigiendo filas...\n');
      
      // Paso 2: Corregir
      const fixResponse = await fetch(`${API_URL}/api/google-sheets/fix-alignment?restaurantId=${RESTAURANT_ID}`, {
        method: 'POST'
      });
      
      const fixData = await fixResponse.json();
      
      if (fixData.success) {
        console.log(`✅ Se corrigieron ${fixData.corrected} filas:\n`);
        fixData.details.forEach(detail => {
          console.log(`   ✓ Fila ${detail.row}: ${detail.cliente} (${detail.id})`);
        });
      } else {
        console.error('❌ Error al corregir:', fixData.error);
      }
    } else {
      console.log('✅ No se encontraron filas desalineadas\n');
    }
    
    // Paso 3: Probar creando una nueva reserva
    console.log('\n\n🧪 Paso 3: Probando creación de nueva reserva...\n');
    
    await wait(2000); // Esperar un poco después de las correcciones
    
    const testReserva = {
      restaurantId: RESTAURANT_ID,
      fecha: '2025-10-25',
      hora: '21:00',
      personas: 4,
      cliente: 'Test Alineación',
      telefono: '+34600000000',
      zona: 'Terraza',
      notas: 'Prueba de alineación correcta'
    };
    
    console.log('📝 Creando reserva de prueba...');
    console.log(`   Cliente: ${testReserva.cliente}`);
    console.log(`   Fecha: ${testReserva.fecha} a las ${testReserva.hora}`);
    console.log(`   Personas: ${testReserva.personas}\n`);
    
    // Primero verificar disponibilidad
    const availabilityResponse = await fetch(
      `${API_URL}/api/google-sheets/disponibilidad?` + new URLSearchParams({
        restaurantId: RESTAURANT_ID,
        fecha: testReserva.fecha,
        hora: testReserva.hora,
        personas: testReserva.personas.toString(),
        zona: testReserva.zona
      })
    );
    
    const availabilityData = await availabilityResponse.json();
    console.log('✓ Disponibilidad verificada:', availabilityData.disponible ? 'Sí' : 'No');
    
    if (availabilityData.disponible) {
      // Crear la reserva usando el endpoint correcto
      const createResponse = await fetch(`${API_URL}/api/retell/functions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function_name: 'crear_reserva',
          args: testReserva,
          restaurantId: RESTAURANT_ID
        })
      });
      
      const createData = await createResponse.json();
      
      if (createData.result?.success) {
        console.log('✅ Reserva creada exitosamente!');
        console.log(`   ID: ${createData.result.reserva?.ID || 'N/A'}`);
        console.log(`   Mesa asignada: ${availabilityData.mesa || 'N/A'}`);
        
        // Verificar que se insertó correctamente
        await wait(1000);
        
        console.log('\n📋 Verificando que se insertó en la posición correcta...');
        const reservasResponse = await fetch(`${API_URL}/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}`);
        const reservasData = await reservasResponse.json();
        
        const nuevaReserva = reservasData.reservas?.find(r => r.Cliente === 'Test Alineación');
        
        if (nuevaReserva) {
          console.log('✅ Reserva encontrada en Google Sheets:');
          console.log(`   ID: ${nuevaReserva.ID}`);
          console.log(`   Cliente: ${nuevaReserva.Cliente}`);
          console.log(`   Fecha: ${nuevaReserva.Fecha}`);
          console.log(`   Hora: ${nuevaReserva.Hora}`);
          console.log(`   Mesa: ${nuevaReserva.Mesa}`);
          console.log(`   Estado: ${nuevaReserva.Estado}`);
        } else {
          console.log('⚠️  No se pudo verificar la reserva inmediatamente (puede ser un problema de caché)');
        }
      } else {
        console.error('❌ Error al crear reserva:', createData.result?.error || createData.error);
      }
    } else {
      console.log('⚠️  No hay disponibilidad para la prueba');
    }
    
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('✅ Proceso completado');
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAlignment();

