#!/usr/bin/env node

/**
 * Script para corregir los hashes de contraseña en la base de datos
 * Útil cuando los hashes no se generan correctamente durante el setup
 */

const bcrypt = require('bcryptjs');
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

async function fixPasswordHashes() {
  console.log('🔧 Corrigiendo hashes de contraseña en la base de datos...');
  
  const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform'
  };
  
  let pool;
  
  try {
    pool = new Pool(dbConfig);
    const client = await pool.connect();
    
    console.log('✅ Conexión a base de datos establecida');
    
    // Definir usuarios y contraseñas
    const users = [
      { email: 'admin@restauranteia.com', password: 'admin123' },
      { email: 'admin@elbuensabor.com', password: 'restaurante123' },
      { email: 'admin@lagaviota.com', password: 'restaurante123' }
    ];
    
    for (const userData of users) {
      console.log(`\n🔐 Actualizando contraseña para: ${userData.email}`);
      
      // Generar nuevo hash
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      // Actualizar en la base de datos
      const result = await client.query(`
        UPDATE restaurant_users 
        SET password_hash = $1, updated_at = NOW()
        WHERE email = $2
      `, [passwordHash, userData.email]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Contraseña actualizada para ${userData.email}`);
        
        // Verificar que la contraseña funciona
        const verifyResult = await client.query(`
          SELECT password_hash FROM restaurant_users WHERE email = $1
        `, [userData.email]);
        
        if (verifyResult.rows.length > 0) {
          const isValid = await bcrypt.compare(userData.password, verifyResult.rows[0].password_hash);
          console.log(`🔑 Verificación: ${isValid ? '✅ Válida' : '❌ Inválida'}`);
        }
      } else {
        console.log(`❌ No se encontró usuario: ${userData.email}`);
      }
    }
    
    client.release();
    
    console.log('\n🎉 ¡Hashes de contraseña corregidos exitosamente!');
    console.log('\n📋 Usuarios disponibles:');
    console.log('  - Admin: admin@restauranteia.com / admin123');
    console.log('  - Restaurante El Buen Sabor: admin@elbuensabor.com / restaurante123');
    console.log('  - Restaurante La Gaviota: admin@lagaviota.com / restaurante123');
    
  } catch (error) {
    console.error('❌ Error corrigiendo contraseñas:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  fixPasswordHashes().catch(console.error);
}

module.exports = { fixPasswordHashes };

