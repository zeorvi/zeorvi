#!/usr/bin/env node

/**
 * Script para probar el endpoint de credenciales directamente
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

async function testCredentialsEndpoint() {
  console.log('🔍 Probando endpoint de credenciales...\n');

  // Configurar conexión a la base de datos
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL no encontrada en las variables de entorno');
    return;
  }

  console.log('📊 Conexión a la base de datos:', connectionString.replace(/:[^:]*@/, ':****@'));

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

    // Verificar si existe un usuario asociado
    console.log('\n🔍 Verificando usuario asociado...');
    const userResult = await client.query(
      'SELECT id, email, role FROM restaurant_users WHERE restaurant_id = $1 AND role = $2 LIMIT 1',
      [restaurant.id, 'owner']
    );

    if (userResult.rows.length > 0) {
      console.log(`✅ Usuario encontrado: ${userResult.rows[0].email} (ID: ${userResult.rows[0].id})`);
    } else {
      console.log('ℹ️  No hay usuario asociado, se creará uno nuevo');
    }

    client.release();
    await pool.end();

    // Simular la llamada al endpoint API
    console.log('\n🌐 Simulando llamada al endpoint API...');
    console.log('URL: http://localhost:3001/api/restaurants/' + restaurant.id + '/credentials');
    console.log('Método: PUT');
    console.log('Body:', JSON.stringify({ 
      username: 'test_username', 
      password: 'test_password' 
    }, null, 2));

    console.log('\n📋 Para probar manualmente:');
    console.log('1. Abre el navegador en http://localhost:3001');
    console.log('2. Inicia sesión como admin: admin@restauranteia.com / admin123');
    console.log('3. Ve a un restaurante y prueba editar las credenciales');
    console.log('4. Abre las herramientas de desarrollador (F12)');
    console.log('5. Ve a la pestaña Network para ver las llamadas HTTP');
    console.log('6. Ve a la pestaña Console para ver los logs del servidor');

    console.log('\n🔍 Posibles problemas:');
    console.log('- Verificar que el servidor esté funcionando en el puerto 3001');
    console.log('- Verificar que la base de datos esté accesible');
    console.log('- Verificar que las variables de entorno estén cargadas');
    console.log('- Verificar que el token de autenticación sea válido');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar prueba
testCredentialsEndpoint().catch(console.error);

