#!/usr/bin/env node

/**
 * Script para insertar datos de restaurantes en producción
 * Solo inserta si no existen datos
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

async function insertProductionData() {
  console.log('🚀 Insertando datos de restaurantes en producción...');
  
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
    
    // Verificar si ya existen restaurantes
    const countResult = await client.query('SELECT COUNT(*) as count FROM restaurants');
    const restaurantCount = parseInt(countResult.rows[0].count);
    
    console.log(`📊 Restaurantes existentes: ${restaurantCount}`);
    
    if (restaurantCount > 0) {
      console.log('⚠️  Ya existen restaurantes en la base de datos');
      console.log('📋 Restaurantes actuales:');
      
      const restaurantsResult = await client.query(`
        SELECT name, slug, owner_email, status 
        FROM restaurants 
        ORDER BY created_at
      `);
      
      restaurantsResult.rows.forEach(restaurant => {
        console.log(`  - ${restaurant.name} (${restaurant.slug}) - ${restaurant.status}`);
      });
      
      console.log('\n¿Quieres continuar e insertar datos adicionales? (y/N)');
      // En un script automatizado, asumimos que sí
      console.log('🔄 Continuando con la inserción...');
    }
    
    // Insertar restaurantes si no existen
    const restaurantsToInsert = [
      {
        name: 'Restaurante El Buen Sabor',
        slug: 'el-buen-sabor',
        owner_email: 'admin@elbuensabor.com',
        owner_name: 'María González',
        phone: '+34123456789',
        address: 'Calle Principal 123',
        city: 'Madrid',
        retell_config: {
          agent_id: 'agent_2082fc7a622cdbd22441b22060',
          api_key: 'key_af2cbf1b9fb5a43ebc84bc56b27b',
          phone_number: '+34984175959'
        },
        twilio_config: {
          account_sid: 'TKeeaa06c4cb6cc36135a403c046fef1f2',
          auth_token: '8a1ec4fac38025b24b3945a48eb1b48d',
          phone_number: '+34984175959'
        }
      },
      {
        name: 'Restaurante La Gaviota',
        slug: 'la-gaviota',
        owner_email: 'admin@lagaviota.com',
        owner_name: 'Carlos Rodríguez',
        phone: '+34912345678',
        address: 'Avenida del Mar 45',
        city: 'Valencia',
        retell_config: {
          agent_id: 'agent_la_gaviota_001',
          api_key: 'key_la_gaviota_2024',
          phone_number: '+34912345678'
        },
        twilio_config: {
          account_sid: 'TKeeaa06c4cb6cc36135a403c046fef1f2',
          auth_token: '8a1ec4fac38025b24b3945a48eb1b48d',
          phone_number: '+34912345678'
        }
      }
    ];
    
    for (const restaurantData of restaurantsToInsert) {
      // Verificar si el restaurante ya existe
      const existingResult = await client.query(
        'SELECT id FROM restaurants WHERE slug = $1',
        [restaurantData.slug]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`⏭️  Restaurante "${restaurantData.name}" ya existe, saltando...`);
        continue;
      }
      
      // Insertar restaurante
      const insertResult = await client.query(`
        INSERT INTO restaurants (
          name, slug, owner_email, owner_name, phone, address, city,
          retell_config, twilio_config, status, plan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        restaurantData.name,
        restaurantData.slug,
        restaurantData.owner_email,
        restaurantData.owner_name,
        restaurantData.phone,
        restaurantData.address,
        restaurantData.city,
        JSON.stringify(restaurantData.retell_config),
        JSON.stringify(restaurantData.twilio_config),
        'active',
        'basic'
      ]);
      
      const restaurantId = insertResult.rows[0].id;
      console.log(`✅ Restaurante "${restaurantData.name}" insertado con ID: ${restaurantId}`);
      
      // Crear schema del restaurante
      await client.query('SELECT create_restaurant_schema($1)', [restaurantId]);
      console.log(`🏗️  Schema creado para restaurante: ${restaurantId}`);
      
      // Insertar usuario del restaurante
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('restaurante123', 12);
      
      await client.query(`
        INSERT INTO restaurant_users (
          restaurant_id, email, password_hash, name, role, restaurant_name,
          permissions, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        restaurantId,
        restaurantData.owner_email,
        passwordHash,
        restaurantData.owner_name,
        'restaurant',
        restaurantData.name,
        JSON.stringify(['tables:read', 'tables:write', 'reservations:read', 'reservations:write', 'clients:read', 'clients:write', 'reports:read']),
        'active'
      ]);
      
      console.log(`👤 Usuario creado para "${restaurantData.name}": ${restaurantData.owner_email}`);
    }
    
    // Verificar resultado final
    const finalResult = await client.query('SELECT COUNT(*) as count FROM restaurants');
    const finalCount = parseInt(finalResult.rows[0].count);
    
    console.log(`\n🎉 ¡Datos insertados exitosamente!`);
    console.log(`📊 Total de restaurantes: ${finalCount}`);
    
    // Mostrar lista final
    const finalRestaurantsResult = await client.query(`
      SELECT name, slug, owner_email, status 
      FROM restaurants 
      ORDER BY created_at
    `);
    
    console.log('\n📋 Restaurantes en la base de datos:');
    finalRestaurantsResult.rows.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (${restaurant.slug}) - ${restaurant.status}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error insertando datos:', error);
    
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
  insertProductionData().catch(console.error);
}

module.exports = { insertProductionData };
