#!/usr/bin/env node

/**
 * Script para probar la actualización de credenciales de restaurante
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

async function testUpdateCredentials() {
  console.log('🔍 Probando actualización de credenciales...\n');

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

    // Probar actualización
    const newEmail = 'test-update@example.com';
    console.log(`\n🔄 Actualizando email a: ${newEmail}`);
    
    const updateResult = await client.query(
      'UPDATE restaurants SET owner_email = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newEmail, restaurant.id]
    );

    if (updateResult.rows.length > 0) {
      console.log('✅ Actualización exitosa');
      console.log(`📧 Nuevo email: ${updateResult.rows[0].owner_email}`);
      console.log(`⏰ Actualizado: ${updateResult.rows[0].updated_at}`);
    } else {
      console.log('❌ No se pudo actualizar el restaurante');
    }

    // Restaurar email original
    console.log(`\n🔄 Restaurando email original: ${restaurant.owner_email}`);
    await client.query(
      'UPDATE restaurants SET owner_email = $1, updated_at = NOW() WHERE id = $2',
      [restaurant.owner_email, restaurant.id]
    );
    console.log('✅ Email restaurado');

    client.release();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Ejecutar prueba
testUpdateCredentials().catch(console.error);

