const path = require('path');
const bcrypt = require('bcryptjs');

// Importar SQLite directamente
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

class SQLiteDatabase {
  constructor() {
    const dbPath = path.join(process.cwd(), 'restaurant_dev.db');
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  async init() {
    const run = promisify(this.db.run.bind(this.db));
    
    // Crear tabla de restaurantes si no existe
    await run(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        owner_email TEXT,
        owner_name TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        country TEXT,
        config TEXT DEFAULT '{}',
        plan TEXT DEFAULT 'basic',
        plan_expires_at DATETIME,
        status TEXT DEFAULT 'active',
        retell_config TEXT DEFAULT '{}',
        twilio_config TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de usuarios si no existe
    await run(`
      CREATE TABLE IF NOT EXISTS restaurant_users (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'employee',
        permissions TEXT DEFAULT '[]',
        status TEXT DEFAULT 'active',
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
      )
    `);

    // Crear restaurantes de prueba si no existen
    await run(`
      INSERT OR IGNORE INTO restaurants (id, name, slug, owner_email, status) VALUES 
      ('admin', 'Administración', 'admin', 'admin@restauranteia.com', 'active'),
      ('rest_001', 'El Buen Sabor', 'elbuensabor', 'admin@elbuensabor.com', 'active'),
      ('rest_003', 'La Gaviota', 'lagaviota', 'admin@lagaviota.com', 'active')
    `);
  }

  async getUserByEmail(email, restaurantId) {
    const get = promisify(this.db.get.bind(this.db));
    try {
      let query;
      
      if (restaurantId) {
        query = `SELECT * FROM restaurant_users WHERE email = '${email}' AND restaurant_id = '${restaurantId}' AND status = 'active'`;
      } else {
        query = `SELECT * FROM restaurant_users WHERE email = '${email}' AND status = 'active'`;
      }
      
      const row = await get(query);
      return row;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData) {
    const run = promisify(this.db.run.bind(this.db));
    try {
      await run(`
        INSERT INTO restaurant_users (
          id, restaurant_id, email, password_hash, name, role, permissions, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.id,
        userData.restaurant_id,
        userData.email,
        userData.password_hash,
        userData.name,
        userData.role,
        userData.permissions,
        userData.status
      ]);
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      return false;
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

async function setupTestUsers() {
  const sqliteDb = new SQLiteDatabase();
  
  try {
    console.log('🔧 Configurando usuarios de prueba en SQLite...');
    
    // Crear usuarios de prueba
    const testUsers = [
      {
        id: 'admin_001',
        restaurant_id: 'admin',
        email: 'admin@restauranteia.com',
        password: 'Admin123!',
        name: 'Administrador',
        role: 'admin',
        permissions: JSON.stringify(['all']),
        status: 'active'
      },
      {
        id: 'rest_001',
        restaurant_id: 'rest_001',
        email: 'admin@elbuensabor.com',
        password: 'ElBuenSabor123!',
        name: 'El Buen Sabor',
        role: 'restaurant',
        permissions: JSON.stringify(['restaurant']),
        status: 'active'
      },
      {
        id: 'rest_003',
        restaurant_id: 'rest_003',
        email: 'admin@lagaviota.com',
        password: 'LaGaviota123!',
        name: 'La Gaviota',
        role: 'restaurant',
        permissions: JSON.stringify(['restaurant']),
        status: 'active'
      }
    ];

    for (const user of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await sqliteDb.getUserByEmail(user.email);
        if (existingUser) {
          console.log(`✅ Usuario ${user.email} ya existe`);
          continue;
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(user.password, 12);

        // Crear usuario
        const success = await sqliteDb.createUser({
          ...user,
          password_hash: passwordHash
        });

        if (success) {
          console.log(`✅ Usuario creado: ${user.email} (${user.password})`);
        } else {
          console.log(`❌ Error creando usuario: ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Error con usuario ${user.email}:`, error.message);
      }
    }

    console.log('🎉 Configuración de usuarios completada');
  } catch (error) {
    console.error('❌ Error en setup:', error);
  } finally {
    await sqliteDb.close();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  setupTestUsers();
}

module.exports = { setupTestUsers };
