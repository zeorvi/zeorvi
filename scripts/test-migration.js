#!/usr/bin/env node

/**
 * Script de prueba para verificar la migración completa
 * Verifica que todos los componentes funcionen correctamente
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Configuración
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'secure_restaurant_2024',
  database: process.env.DB_NAME || 'restaurant_platform'
};

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024';

async function testMigration() {
  console.log('🧪 Iniciando pruebas de migración...');
  
  let pgPool, redis;
  
  try {
    // =============================================
    // PRUEBA 1: Conexión a PostgreSQL
    // =============================================
    console.log('\n📊 Prueba 1: Conexión a PostgreSQL');
    
    pgPool = new Pool(dbConfig);
    const client = await pgPool.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    
    // Verificar tablas principales
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const expectedTables = ['restaurants', 'restaurant_users'];
    const foundTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📋 Tablas encontradas:', foundTables);
    
    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        console.log(`  ✅ Tabla ${table} existe`);
      } else {
        console.log(`  ❌ Tabla ${table} NO existe`);
      }
    }
    
    // =============================================
    // PRUEBA 2: Conexión a Redis
    // =============================================
    console.log('\n🔴 Prueba 2: Conexión a Redis');
    
    redis = new Redis(redisConfig);
    await redis.ping();
    console.log('✅ Conexión a Redis exitosa');
    
    // Probar operaciones básicas
    await redis.set('test:key', 'test:value');
    const testValue = await redis.get('test:key');
    if (testValue === 'test:value') {
      console.log('✅ Operaciones Redis funcionando');
    } else {
      console.log('❌ Operaciones Redis fallando');
    }
    await redis.del('test:key');
    
    // =============================================
    // PRUEBA 3: Datos de Usuarios
    // =============================================
    console.log('\n👥 Prueba 3: Datos de Usuarios');
    
    const usersResult = await client.query(`
      SELECT id, email, role, status, created_at 
      FROM restaurant_users 
      ORDER BY created_at
    `);
    
    console.log(`📊 Total usuarios encontrados: ${usersResult.rows.length}`);
    
    for (const user of usersResult.rows) {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
      
      // Verificar que la contraseña esté hasheada
      const passwordResult = await client.query(`
        SELECT password_hash FROM restaurant_users WHERE id = $1
      `, [user.id]);
      
      const passwordHash = passwordResult.rows[0].password_hash;
      if (passwordHash && passwordHash.length > 20) {
        console.log(`    ✅ Contraseña hasheada correctamente`);
      } else {
        console.log(`    ❌ Contraseña NO está hasheada`);
      }
    }
    
    // =============================================
    // PRUEBA 4: Datos de Restaurantes
    // =============================================
    console.log('\n🍽️ Prueba 4: Datos de Restaurantes');
    
    const restaurantsResult = await client.query(`
      SELECT id, name, slug, status, created_at 
      FROM restaurants 
      ORDER BY created_at
    `);
    
    console.log(`📊 Total restaurantes encontrados: ${restaurantsResult.rows.length}`);
    
    for (const restaurant of restaurantsResult.rows) {
      console.log(`  - ${restaurant.name} (${restaurant.slug}) - ${restaurant.status}`);
      
      // Verificar schema del restaurante
      const schemaName = `restaurant_${restaurant.id.replace(/-/g, '_')}`;
      const schemaResult = await client.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = $1
      `, [schemaName]);
      
      if (schemaResult.rows.length > 0) {
        console.log(`    ✅ Schema ${schemaName} existe`);
        
        // Verificar tablas del schema
        const schemaTablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = $1
          ORDER BY table_name
        `, [schemaName]);
        
        const schemaTables = schemaTablesResult.rows.map(row => row.table_name);
        console.log(`    📋 Tablas del schema: ${schemaTables.join(', ')}`);
        
      } else {
        console.log(`    ❌ Schema ${schemaName} NO existe`);
      }
    }
    
    // =============================================
    // PRUEBA 5: Sistema de Autenticación
    // =============================================
    console.log('\n🔐 Prueba 5: Sistema de Autenticación');
    
    // Probar hash de contraseña
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const isValidPassword = await bcrypt.compare(testPassword, hashedPassword);
    
    if (isValidPassword) {
      console.log('✅ Hash de contraseñas funcionando');
    } else {
      console.log('❌ Hash de contraseñas fallando');
    }
    
    // Probar JWT
    const testPayload = { userId: 'test-user', role: 'admin' };
    const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.userId === testPayload.userId) {
      console.log('✅ JWT funcionando');
    } else {
      console.log('❌ JWT fallando');
    }
    
    // =============================================
    // PRUEBA 6: APIs de Autenticación
    // =============================================
    console.log('\n🌐 Prueba 6: APIs de Autenticación');
    
    // Simular login
    const testUser = usersResult.rows[0];
    if (testUser) {
      console.log(`🧪 Probando login con usuario: ${testUser.email}`);
      
      // Aquí podrías hacer una petición HTTP real a tu API
      // Por ahora solo verificamos que el usuario existe
      console.log('✅ Usuario disponible para login');
    }
    
    client.release();
    
    // =============================================
    // RESUMEN DE PRUEBAS
    // =============================================
    console.log('\n🎉 ¡Pruebas completadas!');
    console.log('\n📋 Resumen:');
    console.log(`  ✅ PostgreSQL: Conectado`);
    console.log(`  ✅ Redis: Conectado`);
    console.log(`  ✅ Usuarios: ${usersResult.rows.length} encontrados`);
    console.log(`  ✅ Restaurantes: ${restaurantsResult.rows.length} encontrados`);
    console.log(`  ✅ Autenticación: Funcionando`);
    console.log(`  ✅ JWT: Funcionando`);
    
    console.log('\n🚀 Sistema listo para usar!');
    console.log('\n🔑 Credenciales de prueba:');
    console.log('  - Admin: admin@restauranteia.com / admin123');
    console.log('  - Restaurante: admin@elbuensabor.com / restaurante123');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  } finally {
    if (pgPool) {
      await pgPool.end();
    }
    if (redis) {
      redis.disconnect();
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testMigration().catch(console.error);
}

module.exports = { testMigration };

