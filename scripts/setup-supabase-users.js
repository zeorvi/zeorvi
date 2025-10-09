const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Usar DATABASE_URL si está disponible
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Configurando usuarios en Supabase...\n');
    
    // Crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'employee',
        permissions TEXT,
        status TEXT DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(restaurant_id, email)
      );
    `);
    
    console.log('✅ Tabla users verificada\n');
    
    // Verificar usuarios existentes
    const { rows: existingUsers } = await client.query('SELECT email FROM users');
    console.log(`📊 Usuarios existentes: ${existingUsers.length}\n`);
    
    if (existingUsers.length > 0) {
      existingUsers.forEach(u => console.log(`  - ${u.email}`));
      console.log('\n⚠️  Ya hay usuarios. ¿Deseas reemplazarlos? (Ctrl+C para cancelar)\n');
    }
    
    // Crear usuarios
    const saltRounds = 12;
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const users = [
      {
        id: 'user_admin',
        restaurant_id: 'rest_001',
        email: 'admin@restauranteia.com',
        name: 'Administrador',
        role: 'admin'
      },
      {
        id: 'user_lagaviota',
        restaurant_id: 'rest_003',
        email: 'admin@lagaviota.com',
        name: 'La Gaviota',
        role: 'restaurant'
      },
      {
        id: 'user_elbuensabor',
        restaurant_id: 'rest_002',
        email: 'admin@elbuensabor.com',
        name: 'El Buen Sabor',
        role: 'restaurant'
      }
    ];
    
    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, restaurant_id, email, password_hash, name, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        ON CONFLICT (restaurant_id, email) 
        DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          updated_at = CURRENT_TIMESTAMP
      `, [user.id, user.restaurant_id, user.email, passwordHash, user.name, user.role]);
      
      console.log(`✅ Usuario: ${user.email} (contraseña: ${password})`);
    }
    
    console.log('\n🎉 Usuarios configurados exitosamente en Supabase!');
    console.log('\n📝 Credenciales para login:');
    console.log('   - lagaviota / admin123');
    console.log('   - admin@lagaviota.com / admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupUsers().catch(console.error);

