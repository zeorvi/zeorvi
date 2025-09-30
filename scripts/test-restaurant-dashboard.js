#!/usr/bin/env node

/**
 * Script para probar el dashboard de restaurantes en producción
 * Verifica autenticación, carga de datos y funcionalidad
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
  connectionString: process.env.DATABASE_URL
};

async function testRestaurantDashboard() {
  console.log('🧪 Probando dashboard de restaurantes en producción...\n');
  
  if (!dbConfig.connectionString) {
    console.error('❌ Error: DATABASE_URL no está configurado en .env.local');
    process.exit(1);
  }
  
  console.log('📊 Conectando a:', dbConfig.connectionString.replace(/\/\/.*@/, '//***:***@'));
  
  let pool;
  
  try {
    // Conectar a PostgreSQL
    pool = new Pool(dbConfig);
    const client = await pool.connect();
    console.log('✅ Conexión establecida');
    
    // 1. Verificar restaurantes existentes
    console.log('\n🔍 1. Verificando restaurantes existentes...');
    const restaurantsResult = await client.query(`
      SELECT id, name, slug, owner_email, status, created_at
      FROM restaurants 
      ORDER BY created_at
    `);
    
    console.log(`📊 Restaurantes encontrados: ${restaurantsResult.rows.length}`);
    
    if (restaurantsResult.rows.length === 0) {
      console.log('❌ No hay restaurantes en la base de datos');
      console.log('💡 Solución: Ejecuta el script de sincronización');
      console.log('   node scripts/insert-production-data.js');
      return;
    }
    
    restaurantsResult.rows.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name} (${restaurant.slug})`);
      console.log(`     - ID: ${restaurant.id}`);
      console.log(`     - Email: ${restaurant.owner_email}`);
      console.log(`     - Estado: ${restaurant.status}`);
      console.log(`     - Creado: ${restaurant.created_at}`);
    });
    
    // 2. Verificar usuarios de restaurantes
    console.log('\n👥 2. Verificando usuarios de restaurantes...');
    const usersResult = await client.query(`
      SELECT ru.id, ru.email, ru.name, ru.role, ru.status, r.name as restaurant_name
      FROM restaurant_users ru
      JOIN restaurants r ON ru.restaurant_id = r.id
      ORDER BY ru.created_at
    `);
    
    console.log(`📊 Usuarios encontrados: ${usersResult.rows.length}`);
    
    usersResult.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name || user.email} (${user.role})`);
      console.log(`     - Email: ${user.email}`);
      console.log(`     - Restaurante: ${user.restaurant_name}`);
      console.log(`     - Estado: ${user.status}`);
    });
    
    // 3. Verificar schemas de restaurantes
    console.log('\n🏗️  3. Verificando schemas de restaurantes...');
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'restaurant_%'
      ORDER BY schema_name
    `);
    
    console.log(`📊 Schemas encontrados: ${schemasResult.rows.length}`);
    
    schemasResult.rows.forEach((schema, index) => {
      console.log(`  ${index + 1}. ${schema.schema_name}`);
    });
    
    // 4. Verificar tablas en cada schema
    console.log('\n🪑 4. Verificando tablas en schemas de restaurantes...');
    
    for (const schema of schemasResult.rows) {
      const schemaName = schema.schema_name;
      console.log(`\n📋 Schema: ${schemaName}`);
      
      try {
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1
          ORDER BY table_name
        `, [schemaName]);
        
        console.log(`  Tablas: ${tablesResult.rows.length}`);
        tablesResult.rows.forEach(table => {
          console.log(`    - ${table.table_name}`);
        });
        
        // Verificar datos en tabla de mesas si existe
        if (tablesResult.rows.some(t => t.table_name === 'tables')) {
          const tablesDataResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM ${schemaName}.tables
          `);
          console.log(`    Mesas: ${tablesDataResult.rows[0].count}`);
        }
        
        // Verificar datos en tabla de reservas si existe
        if (tablesResult.rows.some(t => t.table_name === 'reservations')) {
          const reservationsDataResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM ${schemaName}.reservations
          `);
          console.log(`    Reservas: ${reservationsDataResult.rows[0].count}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error accediendo al schema: ${error.message}`);
      }
    }
    
    // 5. Probar autenticación simulada
    console.log('\n🔐 5. Probando autenticación...');
    
    // Buscar un usuario de restaurante para probar
    const testUser = usersResult.rows.find(u => u.role === 'restaurant');
    
    if (testUser) {
      console.log(`✅ Usuario de prueba encontrado: ${testUser.email}`);
      console.log(`   - Restaurante: ${testUser.restaurant_name}`);
      console.log(`   - Estado: ${testUser.status}`);
      
      if (testUser.status === 'active') {
        console.log('✅ Usuario activo - debería poder hacer login');
      } else {
        console.log('⚠️  Usuario inactivo - no podrá hacer login');
      }
    } else {
      console.log('❌ No se encontraron usuarios de restaurante para probar');
    }
    
    // 6. Verificar configuración de Retell
    console.log('\n🤖 6. Verificando configuración de Retell...');
    
    for (const restaurant of restaurantsResult.rows) {
      const retellConfigResult = await client.query(`
        SELECT retell_config 
        FROM restaurants 
        WHERE id = $1
      `, [restaurant.id]);
      
      if (retellConfigResult.rows.length > 0) {
        const retellConfig = retellConfigResult.rows[0].retell_config;
        console.log(`📱 ${restaurant.name}:`);
        
        if (retellConfig && typeof retellConfig === 'object') {
          console.log(`   - Agent ID: ${retellConfig.agent_id || 'No configurado'}`);
          console.log(`   - API Key: ${retellConfig.api_key ? 'Configurado' : 'No configurado'}`);
          console.log(`   - Teléfono: ${retellConfig.phone_number || 'No configurado'}`);
        } else {
          console.log(`   - Configuración: No configurada`);
        }
      }
    }
    
    // 7. Resumen y recomendaciones
    console.log('\n📋 RESUMEN Y RECOMENDACIONES:');
    console.log('================================');
    
    if (restaurantsResult.rows.length === 0) {
      console.log('❌ PROBLEMA: No hay restaurantes en la base de datos');
      console.log('💡 SOLUCIÓN: Ejecutar script de sincronización');
      console.log('   node scripts/insert-production-data.js');
    } else {
      console.log(`✅ ${restaurantsResult.rows.length} restaurantes encontrados`);
    }
    
    if (usersResult.rows.length === 0) {
      console.log('❌ PROBLEMA: No hay usuarios en la base de datos');
      console.log('💡 SOLUCIÓN: Ejecutar script de sincronización');
    } else {
      console.log(`✅ ${usersResult.rows.length} usuarios encontrados`);
    }
    
    if (schemasResult.rows.length === 0) {
      console.log('❌ PROBLEMA: No hay schemas de restaurantes');
      console.log('💡 SOLUCIÓN: Ejecutar script de sincronización');
    } else {
      console.log(`✅ ${schemasResult.rows.length} schemas de restaurantes encontrados`);
    }
    
    const activeUsers = usersResult.rows.filter(u => u.status === 'active');
    if (activeUsers.length === 0) {
      console.log('❌ PROBLEMA: No hay usuarios activos');
      console.log('💡 SOLUCIÓN: Activar usuarios o crear nuevos');
    } else {
      console.log(`✅ ${activeUsers.length} usuarios activos encontrados`);
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Si faltan datos, ejecutar: node scripts/insert-production-data.js');
    console.log('2. Probar login con las credenciales de los restaurantes');
    console.log('3. Verificar que el dashboard cargue correctamente');
    console.log('4. Probar funcionalidades del dashboard');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Solución:');
      console.log('1. Verifica que DATABASE_URL esté correcto en .env.local');
      console.log('2. Asegúrate de que la base de datos esté accesible');
      console.log('3. Si usas Supabase, verifica que el proyecto esté activo');
    } else if (error.code === '28P01') {
      console.log('\n🔧 Solución:');
      console.log('1. Verifica las credenciales de la base de datos');
      console.log('2. Asegúrate de que el usuario tenga permisos');
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
  testRestaurantDashboard().catch(console.error);
}

module.exports = { testRestaurantDashboard };
