#!/usr/bin/env node

/**
 * Script simple para probar la conexión a la base de datos
 */

const { Pool } = require('pg');

// Cargar variables de entorno como lo hace Next.js
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 PROBANDO CONEXIÓN A LA BASE DE DATOS');
  console.log('=====================================\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL no encontrado en las variables de entorno');
    console.log('Variables disponibles:');
    console.log('- DATABASE_URL:', process.env.DATABASE_URL || 'NO CONFIGURADO');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'NO CONFIGURADO');
    console.log('- RETELL_API_KEY:', process.env.RETELL_API_KEY ? 'CONFIGURADO' : 'NO CONFIGURADO');
    return;
  }
  
  console.log('✅ DATABASE_URL encontrado');
  console.log('📊 Configuración:', databaseUrl.replace(/\/\/.*@/, '//***:***@'));
  
  let pool;
  
  try {
    // Conectar a PostgreSQL
    console.log('\n🔌 Conectando a PostgreSQL...');
    pool = new Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    console.log('✅ Conexión establecida correctamente');
    
    // Probar consulta básica
    console.log('\n📋 Probando consulta básica...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Consulta exitosa - Tiempo del servidor:', result.rows[0].current_time);
    
    // Verificar tabla de restaurantes
    console.log('\n🏪 Verificando tabla de restaurantes...');
    const restaurantsResult = await client.query('SELECT COUNT(*) as count FROM restaurants');
    const restaurantCount = parseInt(restaurantsResult.rows[0].count);
    console.log(`📊 Restaurantes en la base de datos: ${restaurantCount}`);
    
    if (restaurantCount === 0) {
      console.log('❌ PROBLEMA: No hay restaurantes en la base de datos');
      console.log('💡 SOLUCIÓN: Ejecutar sincronización de datos');
      console.log('   node scripts/insert-production-data.js');
    } else {
      console.log('✅ Hay restaurantes en la base de datos');
      
      // Mostrar restaurantes
      const restaurants = await client.query('SELECT name, slug, status FROM restaurants ORDER BY created_at');
      console.log('\n📋 Restaurantes encontrados:');
      restaurants.rows.forEach((restaurant, index) => {
        console.log(`   ${index + 1}. ${restaurant.name} (${restaurant.slug}) - ${restaurant.status}`);
      });
    }
    
    // Probar la consulta exacta de la API
    console.log('\n🔍 Probando consulta de la API...');
    try {
      const apiQuery = await client.query(`
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
      
      console.log('✅ Consulta de la API exitosa');
      console.log(`📊 Resultados: ${apiQuery.rows.length} restaurantes`);
      
    } catch (queryError) {
      console.log('❌ ERROR en consulta de la API:', queryError.message);
    }
    
    client.release();
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETADO');
    console.log('========================');
    
    if (restaurantCount === 0) {
      console.log('🚨 ACCIÓN REQUERIDA: Sincronizar datos');
      console.log('   Ejecuta: node scripts/insert-production-data.js');
    } else {
      console.log('✅ TODO FUNCIONANDO CORRECTAMENTE');
      console.log('   La API debería funcionar en producción');
    }
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 SOLUCIÓN:');
      console.log('1. Verificar que la URL de conexión sea correcta');
      console.log('2. Verificar que el servidor de base de datos esté ejecutándose');
      console.log('3. Verificar configuración de red/firewall');
    } else if (error.code === '28P01') {
      console.log('\n🔧 SOLUCIÓN:');
      console.log('1. Verificar credenciales de la base de datos');
      console.log('2. Verificar contraseña en Supabase');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 SOLUCIÓN:');
      console.log('1. Verificar que la URL de conexión sea correcta');
      console.log('2. Verificar conexión a internet');
      console.log('3. Verificar que el proyecto Supabase esté activo');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

testConnection().catch(console.error);
