#!/usr/bin/env node

/**
 * Script para verificar los roles permitidos en restaurant_users
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

async function checkUserRoles() {
  console.log('🔍 Verificando roles permitidos en restaurant_users...\n');

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
    const client = await pool.connect();
    
    // Verificar la estructura de la tabla restaurant_users
    console.log('🔍 Verificando estructura de la tabla restaurant_users...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'restaurant_users' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Estructura de la tabla restaurant_users:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar constraints de la tabla
    console.log('\n🔍 Verificando constraints de la tabla...');
    const constraints = await client.query(`
      SELECT tc.constraint_name, tc.constraint_type, cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'restaurant_users'
    `);

    console.log('\n📋 Constraints encontradas:');
    constraints.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.constraint_type}`);
      if (row.check_clause) {
        console.log(`    Check: ${row.check_clause}`);
      }
    });

    // Verificar si hay datos existentes para ver qué roles se están usando
    console.log('\n🔍 Verificando roles existentes en la tabla...');
    const existingRoles = await client.query(`
      SELECT DISTINCT role, COUNT(*) as count
      FROM restaurant_users 
      GROUP BY role
      ORDER BY role
    `);

    if (existingRoles.rows.length > 0) {
      console.log('\n📋 Roles existentes en la tabla:');
      existingRoles.rows.forEach(row => {
        console.log(`  ${row.role}: ${row.count} usuarios`);
      });
    } else {
      console.log('\nℹ️  No hay usuarios en la tabla restaurant_users');
    }

    // Verificar si existe un enum para roles
    console.log('\n🔍 Verificando si existe un enum para roles...');
    const enumTypes = await client.query(`
      SELECT typname, enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typname LIKE '%role%'
      ORDER BY typname, enumlabel
    `);

    if (enumTypes.rows.length > 0) {
      console.log('\n📋 Enums de roles encontrados:');
      enumTypes.rows.forEach(row => {
        console.log(`  ${row.typname}: ${row.enumlabel}`);
      });
    } else {
      console.log('\nℹ️  No se encontraron enums de roles');
    }

    client.release();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Ejecutar verificación
checkUserRoles().catch(console.error);
