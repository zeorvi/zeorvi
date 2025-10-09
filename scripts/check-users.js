const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'restaurant_dev.db');
const db = sqlite3(dbPath);

console.log('🔍 Verificando usuarios en SQLite...\n');

// Verificar estructura de la tabla
let users = [];
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  if (tableInfo.length === 0) {
    throw new Error('Table does not exist');
  }
  console.log('📊 Estructura de la tabla users:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  console.log('');
  
  // Obtener todos los usuarios
  users = db.prepare('SELECT id, restaurant_id, email, name, role, status FROM users').all();
} catch (error) {
  console.log('⚠️  Tabla users no existe, creándola...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'employee',
      permissions TEXT,
      status TEXT DEFAULT 'active',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(restaurant_id, email)
    );
  `);
  
  console.log('✅ Tabla users creada\n');
  users = [];
}

console.log(`👥 Usuarios encontrados: ${users.length}\n`);

if (users.length > 0) {
  users.forEach(user => {
    console.log(`  📧 ${user.email}`);
    console.log(`     ID: ${user.id}`);
    console.log(`     Restaurant: ${user.restaurant_id}`);
    console.log(`     Rol: ${user.role}`);
    console.log(`     Estado: ${user.status}\n`);
  });
} else {
  console.log('⚠️  No hay usuarios en la base de datos');
  console.log('💡 Creando usuarios de prueba...\n');
  
  const saltRounds = 12;
  const password = 'admin123';
  const passwordHash = bcrypt.hashSync(password, saltRounds);
  
  const usersToCreate = [
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
  
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO users (id, restaurant_id, email, password_hash, name, role, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);
  
  usersToCreate.forEach(user => {
    insertStmt.run(user.id, user.restaurant_id, user.email, passwordHash, user.name, user.role);
    console.log(`✅ Usuario creado: ${user.email} (contraseña: ${password})`);
  });
  
  console.log('\n🎉 Usuarios creados exitosamente!');
}

// Verificar restaurantes
console.log('\n🏪 Verificando restaurantes...\n');
try {
  const restaurants = db.prepare('SELECT id, name, slug FROM restaurants').all();
  console.log(`Restaurantes encontrados: ${restaurants.length}\n`);
  restaurants.forEach(rest => {
    console.log(`  🍽️  ${rest.name} (${rest.id}) - slug: ${rest.slug}`);
  });
} catch (error) {
  console.log('⚠️  Error verificando restaurantes:', error.message);
}

db.close();
console.log('\n✅ Verificación completada');

