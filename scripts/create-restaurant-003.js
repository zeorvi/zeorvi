// Script para crear el restaurante rest_003
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createRestaurant() {
  const client = await pool.connect();
  
  try {
    // Crear el restaurante rest_003 (La Gaviota)
    await client.query(`
      INSERT INTO restaurants (
        id, name, slug, owner_email, owner_name, phone, address, 
        city, country, config, plan, status, created_at, updated_at
      ) VALUES (
        'rest_003',
        'La Gaviota',
        'la-gaviota',
        'info@lagaviota.com',
        'María García',
        '+34 912 345 678',
        'Paseo Marítimo, 123',
        'Valencia',
        'España',
        '{"theme": "maritime", "features": ["reservations", "tables", "menu"]}',
        'premium',
        'active',
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `);
    
    console.log('✅ Restaurante rest_003 creado/actualizado correctamente');
    
    // Verificar que se creó
    const result = await client.query('SELECT * FROM restaurants WHERE id = $1', ['rest_003']);
    console.log('📊 Restaurante:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createRestaurant();
