#!/usr/bin/env node

/**
 * Script para diagnosticar el error 500 en la API de restaurantes en producción
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

async function debugProductionAPI() {
  console.log('🔍 DIAGNOSTICANDO ERROR 500 EN API DE RESTAURANTES');
  console.log('================================================\n');
  
  if (!dbConfig.connectionString) {
    console.error('❌ Error: DATABASE_URL no está configurado en .env.local');
    console.log('💡 Solución: Configurar DATABASE_URL en .env.local');
    return;
  }
  
  console.log('📊 Configuración detectada:');
  console.log(`   - DATABASE_URL: ${dbConfig.connectionString.replace(/\/\/.*@/, '//***:***@')}`);
  
  let pool;
  
  try {
    // 1. Probar conexión a la base de datos
    console.log('\n🔌 1. PROBANDO CONEXIÓN A LA BASE DE DATOS:');
    console.log('============================================');
    
    pool = new Pool(dbConfig);
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    
    // 2. Verificar si las tablas existen
    console.log('\n📋 2. VERIFICANDO ESTRUCTURA DE LA BASE DE DATOS:');
    console.log('================================================');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Tablas encontradas: ${tablesResult.rows.length}`);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ PROBLEMA CRÍTICO: No hay tablas en la base de datos');
      console.log('💡 SOLUCIÓN: Ejecutar el schema de la base de datos');
      console.log('   node scripts/setup-database.js');
      return;
    }
    
    tablesResult.rows.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // 3. Verificar tabla de restaurantes específicamente
    console.log('\n🏪 3. VERIFICANDO TABLA DE RESTAURANTES:');
    console.log('=======================================');
    
    const restaurantsTableExists = tablesResult.rows.some(row => row.table_name === 'restaurants');
    
    if (!restaurantsTableExists) {
      console.log('❌ PROBLEMA CRÍTICO: Tabla "restaurants" no existe');
      console.log('💡 SOLUCIÓN: Ejecutar el schema de la base de datos');
      return;
    }
    
    console.log('✅ Tabla "restaurants" existe');
    
    // 4. Verificar tabla de usuarios de restaurantes
    const usersTableExists = tablesResult.rows.some(row => row.table_name === 'restaurant_users');
    
    if (!usersTableExists) {
      console.log('❌ PROBLEMA CRÍTICO: Tabla "restaurant_users" no existe');
      console.log('💡 SOLUCIÓN: Ejecutar el schema de la base de datos');
      return;
    }
    
    console.log('✅ Tabla "restaurant_users" existe');
    
    // 5. Verificar datos en las tablas
    console.log('\n📊 4. VERIFICANDO DATOS EN LAS TABLAS:');
    console.log('=====================================');
    
    // Contar restaurantes
    const restaurantsCountResult = await client.query('SELECT COUNT(*) as count FROM restaurants');
    const restaurantsCount = parseInt(restaurantsCountResult.rows[0].count);
    console.log(`📊 Restaurantes en la base de datos: ${restaurantsCount}`);
    
    if (restaurantsCount === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: No hay restaurantes en la base de datos');
      console.log('💡 SOLUCIÓN: Sincronizar datos de restaurantes');
      console.log('   node scripts/insert-production-data.js');
    } else {
      console.log('✅ Hay restaurantes en la base de datos');
      
      // Mostrar restaurantes
      const restaurantsResult = await client.query(`
        SELECT id, name, slug, status, created_at 
        FROM restaurants 
        ORDER BY created_at
      `);
      
      console.log('\n📋 Restaurantes encontrados:');
      restaurantsResult.rows.forEach((restaurant, index) => {
        console.log(`   ${index + 1}. ${restaurant.name} (${restaurant.slug}) - ${restaurant.status}`);
      });
    }
    
    // Contar usuarios
    const usersCountResult = await client.query('SELECT COUNT(*) as count FROM restaurant_users');
    const usersCount = parseInt(usersCountResult.rows[0].count);
    console.log(`\n👥 Usuarios en la base de datos: ${usersCount}`);
    
    if (usersCount === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: No hay usuarios en la base de datos');
      console.log('💡 SOLUCIÓN: Sincronizar datos de usuarios');
    } else {
      console.log('✅ Hay usuarios en la base de datos');
    }
    
    // 6. Probar la consulta exacta que hace la API
    console.log('\n🔍 5. PROBANDO CONSULTA DE LA API:');
    console.log('==================================');
    
    try {
      const apiQueryResult = await client.query(`
        SELECT 
          r.id,
          r.name,
          r.slug,
          r.owner_email,
          r.owner_name,
          r.phone,
          r.address,
          r.city,
          r.country,
          r.config,
          r.plan,
          r.status,
          r.retell_config,
          r.twilio_config,
          r.created_at,
          r.updated_at,
          COUNT(ru.id) as user_count
        FROM restaurants r
        LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.status = 'active'
        GROUP BY r.id, r.name, r.slug, r.owner_email, r.owner_name, r.phone, 
                 r.address, r.city, r.country, r.config, r.plan, r.status, 
                 r.retell_config, r.twilio_config, r.created_at, r.updated_at
        ORDER BY r.created_at DESC
      `);
      
      console.log('✅ Consulta de la API ejecutada correctamente');
      console.log(`📊 Resultados: ${apiQueryResult.rows.length} restaurantes`);
      
      if (apiQueryResult.rows.length > 0) {
        console.log('\n📋 Datos que devolvería la API:');
        apiQueryResult.rows.forEach((restaurant, index) => {
          console.log(`   ${index + 1}. ${restaurant.name} (${restaurant.status}) - ${restaurant.user_count} usuarios`);
        });
      }
      
    } catch (queryError) {
      console.log('❌ ERROR en la consulta de la API:');
      console.log(`   ${queryError.message}`);
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   - Columnas faltantes en la tabla');
      console.log('   - Permisos insuficientes');
      console.log('   - Problemas con tipos de datos JSON');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 SOLUCIÓN PARA CONEXIÓN RECHAZADA:');
      console.log('1. Verificar que DATABASE_URL sea correcto');
      console.log('2. Asegurarse de que el servidor de base de datos esté ejecutándose');
      console.log('3. Verificar configuración de firewall/red');
    } else if (error.code === '28P01') {
      console.log('\n🔧 SOLUCIÓN PARA ERROR DE AUTENTICACIÓN:');
      console.log('1. Verificar credenciales de la base de datos');
      console.log('2. Asegurarse de que el usuario tenga permisos');
      console.log('3. Verificar contraseña en Supabase (si aplica)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 SOLUCIÓN PARA HOST NO ENCONTRADO:');
      console.log('1. Verificar que la URL de conexión sea correcta');
      console.log('2. Verificar conexión a internet');
      console.log('3. Verificar que el proyecto Supabase esté activo');
    }
    
    return;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
  
  // 7. Resumen y recomendaciones
  console.log('\n📋 RESUMEN Y RECOMENDACIONES:');
  console.log('==============================');
  
  console.log('🎯 ACCIONES INMEDIATAS:');
  console.log('1. Si no hay tablas: Ejecutar schema');
  console.log('   node scripts/setup-database.js');
  console.log('');
  console.log('2. Si no hay datos: Sincronizar restaurantes');
  console.log('   node scripts/insert-production-data.js');
  console.log('');
  console.log('3. Si hay errores de consulta: Verificar permisos');
  console.log('   - Asegurar que el usuario tenga SELECT en todas las tablas');
  console.log('   - Verificar permisos en schemas');
  
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Ejecutar las soluciones recomendadas');
  console.log('2. Probar la API nuevamente');
  console.log('3. Verificar que el panel admin cargue correctamente');
  console.log('4. Probar login de restaurantes');
}

// Ejecutar diagnóstico
debugProductionAPI().catch(console.error);
