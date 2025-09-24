#!/usr/bin/env node

/**
 * Script para probar el endpoint API de actualización de restaurante
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Variables de entorno cargadas desde .env.local');
  } else {
    console.log('⚠️  Archivo .env.local no encontrado');
  }
}

// Cargar variables de entorno
loadEnvFile();

const { Pool } = require('pg');

async function testApiEndpoint() {
  console.log('🔍 Probando endpoint API de actualización...\n');

  // Configurar conexión a la base de datos
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL no encontrada en las variables de entorno');
    return;
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  try {
    // Obtener un restaurante de prueba
    const client = await pool.connect();
    
    console.log('🔍 Obteniendo restaurantes disponibles...');
    const result = await client.query('SELECT id, name, owner_email FROM restaurants LIMIT 1');
    
    if (result.rows.length === 0) {
      console.log('❌ No hay restaurantes en la base de datos');
      return;
    }

    const restaurant = result.rows[0];
    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);
    console.log(`📧 Email actual: ${restaurant.owner_email}`);

    client.release();
    await pool.end();

    // Simular la llamada al endpoint API
    console.log('\n🌐 Simulando llamada al endpoint API...');
    console.log('URL: http://localhost:3001/api/restaurants/' + restaurant.id);
    console.log('Método: PUT');
    console.log('Body:', JSON.stringify({ owner_email: 'test-api@example.com' }, null, 2));

    console.log('\n📋 Para probar manualmente:');
    console.log('1. Abre el navegador en http://localhost:3001');
    console.log('2. Inicia sesión como admin: admin@restauranteia.com / admin123');
    console.log('3. Ve a un restaurante y prueba editar las credenciales');
    console.log('4. Abre las herramientas de desarrollador (F12)');
    console.log('5. Ve a la pestaña Network para ver las llamadas HTTP');
    console.log('6. Verifica si hay errores en la consola');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar prueba
testApiEndpoint().catch(console.error);

