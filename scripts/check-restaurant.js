const { productionDb } = require('./src/lib/database/production.ts');

async function checkRestaurant() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    const client = await productionDb.pg.connect();
    
    console.log('📊 Verificando restaurante rest_003...');
    const result = await client.query('SELECT * FROM restaurants WHERE id = $1', ['rest_003']);
    
    if (result.rows.length > 0) {
      console.log('✅ Restaurante encontrado:', result.rows[0]);
    } else {
      console.log('❌ Restaurante rest_003 no encontrado');
      
      // Verificar qué restaurantes existen
      const allRestaurants = await client.query('SELECT id, name FROM restaurants LIMIT 10');
      console.log('📋 Restaurantes disponibles:', allRestaurants.rows);
    }
    
    client.release();
    console.log('✅ Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkRestaurant();
