/**
 * Script para probar la conexión a la base de datos en producción
 */

const { Pool } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.rjalwnbkknjqdxzwatrw:asturias-1999-asturias@aws-1-eu-west-2.pooler.supabase.com:6543/postgres';
  
  console.log('📡 Connection string:', connectionString.replace(/:[^:@]*@/, ':***@'));
  
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔄 Attempting to connect...');
    const client = await pool.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Current time from DB:', result.rows[0].current_time);
    
    // Test restaurants table
    console.log('🏪 Testing restaurants table...');
    const restaurantsResult = await client.query('SELECT COUNT(*) as count FROM restaurants');
    console.log('📊 Total restaurants:', restaurantsResult.rows[0].count);
    
    // Test specific restaurant
    console.log('🔍 Testing specific restaurant query...');
    const restaurantResult = await client.query(`
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
      WHERE r.id = $1
      GROUP BY r.id, r.name, r.slug, r.owner_email, r.owner_name, r.phone, 
               r.address, r.city, r.country, r.config, r.plan, r.status, 
               r.retell_config, r.twilio_config, r.created_at, r.updated_at
    `, ['rest_003']);
    
    if (restaurantResult.rows.length > 0) {
      console.log('✅ Restaurant rest_003 found:', restaurantResult.rows[0].name);
    } else {
      console.log('❌ Restaurant rest_003 not found');
    }
    
    client.release();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    await pool.end();
    console.log('🔚 Connection pool closed');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
