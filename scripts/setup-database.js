#!/usr/bin/env node

/**
 * Script para configurar la base de datos PostgreSQL
 * Reemplaza completamente Firebase Firestore
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

// Función para parsear la URL de conexión y mostrar información útil
function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.substring(1),
      user: url.username,
      // No mostrar la contraseña por seguridad
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

async function setupDatabase() {
  console.log('🚀 Configurando base de datos PostgreSQL...');
  
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
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Leer y ejecutar el schema SQL
    const schemaPath = path.join(__dirname, '..', 'database', 'schema-supabase.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Ejecutando schema SQL...');
    await client.query(schemaSQL);
    console.log('✅ Schema ejecutado exitosamente');
    
    // Verificar que las tablas se crearon
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar usuarios creados
    const usersResult = await client.query(`
      SELECT email, role, status 
      FROM restaurant_users 
      ORDER BY created_at
    `);
    
    console.log('👥 Usuarios creados:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
    // Verificar restaurantes creados
    const restaurantsResult = await client.query(`
      SELECT name, slug, status 
      FROM restaurants 
      ORDER BY created_at
    `);
    
    console.log('🍽️ Restaurantes creados:');
    restaurantsResult.rows.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (${restaurant.slug}) - ${restaurant.status}`);
    });
    
    // Verificar schemas de restaurantes
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'restaurant_%'
      ORDER BY schema_name
    `);
    
    console.log('🏗️ Schemas de restaurantes creados:');
    schemasResult.rows.forEach(schema => {
      console.log(`  - ${schema.schema_name}`);
    });
    
    client.release();
    
    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    
    if (isSupabase) {
      console.log('1. Configurar variables de entorno en .env.local:');
      console.log('   DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@aws-0-us-west-1.pooler.supabase.com:6543/postgres');
      console.log('   REDIS_URL=redis://localhost:6379 (opcional)');
      console.log('   JWT_SECRET=your-super-secret-jwt-key-change-in-production');
      console.log('2. Instalar dependencias adicionales:');
      console.log('   npm install pg bcryptjs jsonwebtoken ioredis');
      console.log('3. (Opcional) Iniciar Redis local:');
      console.log('   redis-server');
      console.log('4. Probar el login:');
      console.log('   - Admin: admin@restauranteia.com / admin123');
      console.log('   - Restaurante: admin@elbuensabor.com / restaurante123');
      console.log('\n💡 Nota: Supabase incluye Redis integrado, no necesitas Redis local');
    } else {
      console.log('1. Configurar variables de entorno en .env.local:');
      console.log('   DATABASE_URL=postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform');
      console.log('   REDIS_URL=redis://localhost:6379');
      console.log('   JWT_SECRET=your-super-secret-jwt-key-change-in-production');
      console.log('2. Instalar dependencias adicionales:');
      console.log('   npm install pg bcryptjs jsonwebtoken ioredis');
      console.log('3. Iniciar Redis:');
      console.log('   redis-server');
      console.log('4. Probar el login:');
      console.log('   - Admin: admin@restauranteia.com / admin123');
      console.log('   - Restaurante: admin@elbuensabor.com / restaurante123');
    }
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    
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
        console.log('3. Crea la base de datos si no existe:');
        console.log('   createdb restaurant_platform');
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
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
