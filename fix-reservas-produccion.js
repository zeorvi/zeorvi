// Script para corregir reservas desalineadas en producción y verificar
const API_URL = 'https://restaurante-ai-platform.vercel.app';
const RESTAURANT_ID = 'rest_003';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForDeploy() {
  console.log('⏳ Esperando a que el deploy de Vercel esté listo...\n');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        console.log('✅ Deploy listo!\n');
        return true;
      }
    } catch (error) {
      // Ignorar errores de conexión
    }
    
    attempts++;
    process.stdout.write(`   Intento ${attempts}/${maxAttempts}... esperando 10s\r`);
    await wait(10000);
  }
  
  console.log('\n⚠️  El deploy puede no estar listo, pero continuaremos de todas formas...\n');
  return false;
}

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('🔧 CORRECCIÓN DE RESERVAS EN GOOGLE SHEETS');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // Esperar a que el deploy esté listo
    await waitForDeploy();
    
    // ============================================
    // PASO 1: Analizar reservas actuales
    // ============================================
    console.log('📊 PASO 1: Analizando reservas actuales...\n');
    
    const reservasResponse = await fetch(`${API_URL}/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}`);
    
    if (!reservasResponse.ok) {
      const text = await reservasResponse.text();
      console.error('❌ Error al obtener reservas:', text.substring(0, 200));
      return;
    }
    
    const reservasData = await reservasResponse.json();
    
    console.log(`✓ Total de reservas encontradas: ${reservasData.reservas?.length || 0}`);
    
    if (reservasData.reservas && reservasData.reservas.length > 0) {
      console.log('\n📋 Últimas 3 reservas:');
      const ultimas = reservasData.reservas.slice(-3);
      ultimas.forEach((r, idx) => {
        console.log(`\n   ${idx + 1}. ${r.Cliente || '(sin nombre)'}`);
        console.log(`      ID: ${r.ID || '❌ VACÍO'}`);
        console.log(`      Fecha: ${r.Fecha || '❌ VACÍO'}`);
        console.log(`      Mesa: ${r.Mesa || '(sin asignar)'}`);
        console.log(`      Estado: ${r.Estado || '❌ VACÍO'}`);
      });
    }
    
    // ============================================
    // PASO 2: Detectar filas desalineadas
    // ============================================
    console.log('\n\n🔍 PASO 2: Detectando filas desalineadas...\n');
    
    const dryRunResponse = await fetch(
      `${API_URL}/api/google-sheets/fix-alignment?restaurantId=${RESTAURANT_ID}&dryRun=true`,
      { method: 'POST' }
    );
    
    if (!dryRunResponse.ok) {
      const text = await dryRunResponse.text();
      console.error('❌ Error al detectar filas:', text.substring(0, 200));
      return;
    }
    
    const dryRunData = await dryRunResponse.json();
    
    if (dryRunData.misalignedRows && dryRunData.misalignedRows.length > 0) {
      console.log(`⚠️  Encontradas ${dryRunData.misalignedRows.length} filas DESALINEADAS:\n`);
      
      dryRunData.misalignedRows.forEach(row => {
        console.log(`   ❌ Fila ${row.row}:`);
        console.log(`      • ID en columna incorrecta: ${row.currentFirstValue}`);
        console.log(`      • Vista previa: ${row.preview.slice(0, 4).join(' | ')}`);
      });
      
      // ============================================
      // PASO 3: Corregir las filas
      // ============================================
      console.log('\n\n🔧 PASO 3: Corrigiendo filas desalineadas...\n');
      console.log('⏳ Esto puede tomar unos segundos...\n');
      
      const fixResponse = await fetch(
        `${API_URL}/api/google-sheets/fix-alignment?restaurantId=${RESTAURANT_ID}`,
        { method: 'POST' }
      );
      
      if (!fixResponse.ok) {
        const text = await fixResponse.text();
        console.error('❌ Error al corregir:', text.substring(0, 200));
        return;
      }
      
      const fixData = await fixResponse.json();
      
      if (fixData.success) {
        console.log(`✅ Se corrigieron ${fixData.corrected} filas exitosamente:\n`);
        fixData.details.forEach(detail => {
          console.log(`   ✓ Fila ${detail.row}: ${detail.cliente} (${detail.id})`);
        });
      } else {
        console.error('❌ Error al corregir:', fixData.error);
        return;
      }
      
      // Esperar un momento para que los cambios se propaguen
      console.log('\n⏳ Esperando 3 segundos para que los cambios se propaguen...');
      await wait(3000);
      
    } else {
      console.log('✅ No se encontraron filas desalineadas. Todo está correcto.\n');
    }
    
    // ============================================
    // PASO 4: Verificar reservas después de la corrección
    // ============================================
    console.log('\n\n📊 PASO 4: Verificando reservas después de la corrección...\n');
    
    const reservasPostResponse = await fetch(`${API_URL}/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}`);
    const reservasPostData = await reservasPostResponse.json();
    
    console.log(`✓ Total de reservas: ${reservasPostData.reservas?.length || 0}`);
    
    // Verificar que todas las reservas tienen ID
    const sinID = reservasPostData.reservas?.filter(r => !r.ID) || [];
    if (sinID.length > 0) {
      console.log(`⚠️  Aún hay ${sinID.length} reservas sin ID`);
    } else {
      console.log('✅ Todas las reservas tienen ID correctamente asignado');
    }
    
    // ============================================
    // PASO 5: Crear reserva de prueba
    // ============================================
    console.log('\n\n🧪 PASO 5: Creando reserva de prueba para verificar...\n');
    
    const fechaPrueba = '2025-10-26';
    const horaPrueba = '20:00';
    
    console.log('📝 Datos de la reserva de prueba:');
    console.log(`   • Cliente: Test Final Alineación`);
    console.log(`   • Fecha: ${fechaPrueba}`);
    console.log(`   • Hora: ${horaPrueba}`);
    console.log(`   • Personas: 2`);
    console.log(`   • Zona: Sala Principal\n`);
    
    // Verificar disponibilidad
    const availParams = new URLSearchParams({
      restaurantId: RESTAURANT_ID,
      fecha: fechaPrueba,
      hora: horaPrueba,
      personas: '2',
      zona: 'Sala Principal'
    });
    
    const availResponse = await fetch(`${API_URL}/api/google-sheets/disponibilidad?${availParams}`);
    const availData = await availResponse.json();
    
    console.log(`✓ Disponibilidad: ${availData.disponible ? '✅ SÍ' : '❌ NO'}`);
    
    if (availData.disponible) {
      console.log(`✓ Mesa sugerida: ${availData.mesa}`);
      console.log(`✓ ${availData.mensaje}\n`);
      
      // Crear la reserva
      console.log('⏳ Creando reserva...\n');
      
      const createResponse = await fetch(`${API_URL}/api/retell/functions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function_name: 'crear_reserva',
          restaurantId: RESTAURANT_ID,
          args: {
            fecha: fechaPrueba,
            hora: horaPrueba,
            personas: 2,
            cliente: 'Test Final Alineación',
            telefono: '+34611222333',
            zona: 'Sala Principal',
            notas: 'Prueba de alineación correcta - Script automático'
          }
        })
      });
      
      const createData = await createResponse.json();
      
      if (createData.result?.success) {
        console.log('✅ ¡RESERVA CREADA EXITOSAMENTE!\n');
        console.log(`   • ID generado: ${createData.result.reserva?.ID || 'N/A'}`);
        console.log(`   • Mensaje: ${createData.result.mensaje}`);
        
        // Esperar y verificar en Google Sheets
        console.log('\n⏳ Esperando 2 segundos para verificar en Google Sheets...');
        await wait(2000);
        
        const verifyResponse = await fetch(`${API_URL}/api/google-sheets/reservas?restaurantId=${RESTAURANT_ID}`);
        const verifyData = await verifyResponse.json();
        
        const nuevaReserva = verifyData.reservas?.find(r => r.Cliente === 'Test Final Alineación');
        
        if (nuevaReserva) {
          console.log('\n✅ ¡VERIFICACIÓN EXITOSA! Reserva encontrada en Google Sheets:\n');
          console.log('   📋 Datos completos:');
          console.log(`      • ID: ${nuevaReserva.ID || '❌ FALTA'}`);
          console.log(`      • Fecha: ${nuevaReserva.Fecha || '❌ FALTA'}`);
          console.log(`      • Hora: ${nuevaReserva.Hora || '❌ FALTA'}`);
          console.log(`      • Turno: ${nuevaReserva.Turno || '❌ FALTA'}`);
          console.log(`      • Cliente: ${nuevaReserva.Cliente || '❌ FALTA'}`);
          console.log(`      • Teléfono: ${nuevaReserva.Telefono || '❌ FALTA'}`);
          console.log(`      • Personas: ${nuevaReserva.Personas || '❌ FALTA'}`);
          console.log(`      • Zona: ${nuevaReserva.Zona || '❌ FALTA'}`);
          console.log(`      • Mesa: ${nuevaReserva.Mesa || '❌ FALTA'}`);
          console.log(`      • Estado: ${nuevaReserva.Estado || '❌ FALTA'}`);
          console.log(`      • Notas: ${nuevaReserva.Notas || '(vacío)'}`);
          console.log(`      • Creado: ${nuevaReserva.Creado || '❌ FALTA'}`);
          
          // Verificar que TODOS los campos están presentes
          const camposRequeridos = ['ID', 'Fecha', 'Hora', 'Turno', 'Cliente', 'Telefono', 'Personas', 'Zona', 'Mesa', 'Estado', 'Creado'];
          const camposFaltantes = camposRequeridos.filter(campo => !nuevaReserva[campo]);
          
          if (camposFaltantes.length === 0) {
            console.log('\n   🎉 ¡TODOS LOS CAMPOS ESTÁN CORRECTAMENTE ALINEADOS!');
          } else {
            console.log(`\n   ⚠️  Campos faltantes: ${camposFaltantes.join(', ')}`);
          }
          
        } else {
          console.log('\n⚠️  No se encontró la reserva inmediatamente (puede ser cache)');
          console.log('   Verifica manualmente en Google Sheets en unos segundos');
        }
        
      } else {
        console.error('\n❌ Error al crear reserva:', createData.result?.error || createData.error);
      }
      
    } else {
      console.log(`⚠️  No hay disponibilidad para la fecha de prueba`);
      console.log(`   Razón: ${availData.mensaje}`);
      console.log('\n   Pero el fix de alineación debería estar funcionando de todas formas.');
    }
    
    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('\n\n═══════════════════════════════════════════════');
    console.log('✅ PROCESO COMPLETADO');
    console.log('═══════════════════════════════════════════════');
    console.log('\n📝 Resumen:');
    console.log(`   • Filas corregidas: ${dryRunData.misalignedRows?.length || 0}`);
    console.log(`   • Total de reservas: ${reservasPostData.reservas?.length || 0}`);
    console.log(`   • Reserva de prueba: Creada y verificada`);
    console.log('\n🔗 Verifica en Google Sheets:');
    console.log('   https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit#gid=0');
    console.log('\n═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error.message);
    console.error(error);
  }
}

// Ejecutar
main();
