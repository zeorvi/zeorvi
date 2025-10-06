#!/usr/bin/env node

/**
 * Script para configurar la base de datos de producción
 * Ejecutar con: node scripts/setup-production.js
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuración de la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setupProductionDatabase() {
  console.log('🚀 Configurando base de datos de producción...');
  
  try {
    // Leer el archivo SQL
    const sqlFile = join(process.cwd(), 'scripts', 'setup-production-database.sql');
    const sqlContent = readFileSync(sqlFile, 'utf8');
    
    // Ejecutar el script SQL
    await pool.query(sqlContent);
    
    console.log('✅ Base de datos configurada correctamente');
    
    // Verificar que las tablas se crearon
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('table_states', 'reservations', 'restaurant_schedules', 'restaurant_metrics', 'occupancy_predictions', 'system_events', 'clients')
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Inicializar datos para restaurantes existentes
    await initializeRestaurantData();
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function initializeRestaurantData() {
  console.log('🏪 Inicializando datos de restaurantes...');
  
  try {
    // Obtener restaurantes existentes
    const restaurantsResult = await pool.query(`
      SELECT id, name FROM restaurants 
      WHERE id IN ('rest_001', 'rest_003')
    `);
    
    for (const restaurant of restaurantsResult.rows) {
      console.log(`  Configurando ${restaurant.name} (${restaurant.id})...`);
      
      // Verificar si ya tiene mesas
      const tablesResult = await pool.query(
        'SELECT COUNT(*) as count FROM table_states WHERE restaurant_id = $1',
        [restaurant.id]
      );
      
      if (parseInt(tablesResult.rows[0].count) === 0) {
        // Inicializar mesas por defecto
        const defaultTables = [
          { id: 'M1', name: 'Mesa 1', capacity: 4, location: 'Terraza' },
          { id: 'M2', name: 'Mesa 2', capacity: 2, location: 'Terraza' },
          { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal' },
          { id: 'M4', name: 'Mesa 4', capacity: 4, location: 'Salón Principal' },
          { id: 'M5', name: 'Mesa 5', capacity: 2, location: 'Comedor Privado' },
          { id: 'M6', name: 'Mesa 6', capacity: 8, location: 'Terraza' },
          { id: 'M7', name: 'Mesa 7', capacity: 4, location: 'Salón Principal' },
          { id: 'M8', name: 'Mesa 8', capacity: 2, location: 'Comedor Privado' },
        ];
        
        for (const table of defaultTables) {
          await pool.query(`
            INSERT INTO table_states (
              restaurant_id, table_id, table_name, capacity, location, status
            ) VALUES ($1, $2, $3, $4, $5, 'libre')
          `, [restaurant.id, table.id, table.name, table.capacity, table.location]);
        }
        
        console.log(`    ✅ ${defaultTables.length} mesas inicializadas`);
      } else {
        console.log(`    ℹ️  Ya tiene mesas configuradas`);
      }
    }
    
    console.log('✅ Datos de restaurantes inicializados');
    
  } catch (error) {
    console.error('❌ Error inicializando datos de restaurantes:', error);
    throw error;
  }
}

// Ejecutar el script
if (import.meta.url === `file://${process.argv[1]}`) {
  setupProductionDatabase();
}
