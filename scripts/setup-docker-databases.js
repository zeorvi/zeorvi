#!/usr/bin/env node

/**
 * Script para configurar bases de datos con Docker
 * Más fácil de instalar y configurar
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🐳 Configurando bases de datos con Docker...\n');

// Función para ejecutar comandos
function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    return false;
  }
  return true;
}

// Función para verificar si Docker está instalado
function dockerExists() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function setupDockerDatabases() {
  // Verificar Docker
  if (!dockerExists()) {
    console.log('❌ Docker no está instalado');
    console.log('📥 Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/');
    console.log('📋 Instrucciones:');
    console.log('   1. Descarga e instala Docker Desktop');
    console.log('   2. Reinicia tu computadora');
    console.log('   3. Ejecuta este script nuevamente\n');
    return;
  }

  console.log('✅ Docker está instalado\n');

  // Crear docker-compose.yml
  const dockerCompose = `version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: restaurant_postgres
    environment:
      POSTGRES_DB: restaurant_platform
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_restaurant_2024
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/postgres-setup.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: restaurant_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:
`;

  fs.writeFileSync('docker-compose.yml', dockerCompose);
  console.log('📄 Creado archivo: docker-compose.yml');

  // Crear script de inicialización de PostgreSQL
  const postgresInit = `
-- Script de inicialización de PostgreSQL
-- Se ejecuta automáticamente al crear el contenedor

-- Crear esquemas
CREATE SCHEMA IF NOT EXISTS public;

-- Crear tabla de restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    config JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'basic',
    plan_expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    retell_config JSONB DEFAULT '{}',
    twilio_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de usuarios de restaurantes
CREATE TABLE IF NOT EXISTS restaurant_users (
    id VARCHAR(50) PRIMARY KEY,
    restaurant_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'employee',
    permissions TEXT[] DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_email ON restaurant_users(email);
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id ON restaurant_users(restaurant_id);

-- Insertar datos de ejemplo
INSERT INTO restaurants (id, name, slug, owner_email, owner_name, phone, address, city, country) VALUES
('rest_001', 'El Buen Sabor', 'elbuensabor', 'admin@elbuensabor.com', 'María González', '+1-555-0101', '123 Main St', 'Ciudad', 'País'),
('rest_003', 'La Gaviota', 'lagaviota', 'admin@lagaviota.com', 'Carlos Rodríguez', '+1-555-0103', '456 Ocean Ave', 'Ciudad', 'País')
ON CONFLICT (id) DO NOTHING;

INSERT INTO restaurant_users (id, restaurant_id, email, password_hash, name, role) VALUES
('user_001', 'rest_001', 'admin@elbuensabor.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'María González', 'restaurant'),
('user_003', 'rest_003', 'admin@lagaviota.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K', 'Carlos Rodríguez', 'restaurant')
ON CONFLICT (id) DO NOTHING;
`;

  fs.writeFileSync('database/postgres-setup.sql', postgresInit);
  console.log('📄 Creado archivo: database/postgres-setup.sql');

  // Crear archivo de variables de entorno
  const envContent = `
# Configuración de bases de datos para desarrollo con Docker
NODE_ENV=development

# PostgreSQL (Docker)
DATABASE_URL=postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform

# Redis (Docker)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# WebSocket
WEBSOCKET_PORT=8081

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('📄 Creado archivo: .env.local');

  // Crear script de inicio
  const startScript = `@echo off
echo 🐳 Iniciando bases de datos con Docker...

echo 📦 Iniciando PostgreSQL y Redis...
docker-compose up -d

echo ⏳ Esperando que las bases de datos estén listas...
timeout /t 10 /nobreak > nul

echo 📦 Iniciando aplicación Next.js...
npm run dev

pause
`;

  fs.writeFileSync('start-docker.bat', startScript);
  console.log('📄 Creado archivo: start-docker.bat');

  // Crear script de parada
  const stopScript = `@echo off
echo 🛑 Deteniendo bases de datos...

docker-compose down

echo ✅ Bases de datos detenidas
pause
`;

  fs.writeFileSync('stop-docker.bat', stopScript);
  console.log('📄 Creado archivo: stop-docker.bat');

  console.log('🎉 Configuración con Docker completada!');
  console.log('\n📋 Para iniciar el sistema:');
  console.log('   1. Ejecuta: start-docker.bat');
  console.log('   2. O ejecuta manualmente:');
  console.log('      - docker-compose up -d');
  console.log('      - npm run dev');
  console.log('\n📋 Para detener el sistema:');
  console.log('   - Ejecuta: stop-docker.bat');
  console.log('   - O ejecuta: docker-compose down\n');
}

// Ejecutar configuración
setupDockerDatabases().catch(console.error);
