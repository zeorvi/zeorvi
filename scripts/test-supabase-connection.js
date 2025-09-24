#!/usr/bin/env node

/**
 * Script para probar la conexión a Supabase PostgreSQL
 * Verifica que la configuración sea correcta antes de ejecutar el setup completo
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
  }
}

// Cargar variables de entorno
loadEnvFile();

// Configuración de la base de datos
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform'
};

// Función para parsear la URL de conexión
function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password ? '***' : 'none'
    };
  } catch (error) {
    return {
      host: 'unknown',
      port: 'unknown',
      database: 'unknown',
      user: 'unknown',
      password: 'unknown'
    };
  }
}

async function testConnection() {
  console.log('🔍 Probando conexión a Supabase PostgreSQL...');
  
  const connectionInfo = parseConnectionString(dbConfig.connectionString);
  console.log('📊 Configuración:', connectionInfo);
  
  // Verificar si estamos usando Supabase
  const isSupabase = connectionInfo.host.includes('supabase') || connectionInfo.host.includes('pooler');
  if (isSupabase) {
    console.log('☁️  Detectado: Supabase PostgreSQL');
  } else {
    console.log('🏠 Detectado: PostgreSQL local');
  }
  
  let pool;
  
  try {
    // Conectar a PostgreSQL
    pool = new Pool(dbConfig);
    
    // Verificar conexión
    const client = await pool.connect();
    console.log('✅ Conexión establecida exitosamente');
    
    // Probar una consulta simple
    const result = await client.query('SELECT version()');
    console.log('📋 Versión de PostgreSQL:', result.rows[0].version);
    
    // Verificar si las tablas ya existen
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tablas existentes:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('📋 No hay tablas en la base de datos');
    }
    
    client.release();
    
    console.log('\n🎉 ¡Conexión exitosa!');
    console.log('✅ La base de datos está lista para el setup');
    
    if (isSupabase) {
      console.log('\n💡 Próximos pasos:');
      console.log('1. Ejecutar: npm run db:setup');
      console.log('2. Verificar que las tablas se crearon correctamente');
      console.log('3. Probar el login con los usuarios demo');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Solución:');
      if (isSupabase) {
        console.log('1. Verifica que la URL de Supabase sea correcta');
        console.log('2. Asegúrate de que el proyecto Supabase esté activo');
        console.log('3. Verifica que la contraseña de la base de datos sea correcta');
        console.log('4. Revisa la configuración de red/firewall');
      } else {
        console.log('1. Asegúrate de que PostgreSQL esté ejecutándose');
        console.log('2. Verifica la configuración de conexión');
      }
    } else if (error.code === '28P01') {
      console.log('\n🔧 Solución:');
      console.log('1. Verifica las credenciales de PostgreSQL');
      console.log('2. Asegúrate de que el usuario tenga permisos');
      if (isSupabase) {
        console.log('3. Verifica la contraseña en el panel de Supabase');
        console.log('4. Asegúrate de usar la contraseña correcta del proyecto');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 Solución:');
      console.log('1. Verifica que la URL de conexión sea correcta');
      console.log('2. Asegúrate de tener conexión a internet');
      if (isSupabase) {
        console.log('3. Verifica que el proyecto Supabase esté activo');
        console.log('4. Revisa la URL en el panel de Supabase');
      }
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testConnection().catch(console.error);
}

module.exports = { testConnection };
