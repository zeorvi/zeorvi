#!/usr/bin/env node

/**
 * Script para configurar bases de datos de desarrollo
 * Instala y configura PostgreSQL y Redis
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando bases de datos para desarrollo...\n');

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

// Función para verificar si un comando existe
function commandExists(command) {
  try {
    execSync(`where ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function setupDatabases() {
  console.log('🔍 Verificando instalaciones existentes...\n');

  // Verificar PostgreSQL
  if (commandExists('psql')) {
    console.log('✅ PostgreSQL ya está instalado');
  } else {
    console.log('❌ PostgreSQL no está instalado');
    console.log('📥 Instalando PostgreSQL...');
    
    // Descargar e instalar PostgreSQL
    const postgresUrl = 'https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64.exe';
    console.log(`📥 Descarga PostgreSQL desde: ${postgresUrl}`);
    console.log('📋 Instrucciones:');
    console.log('   1. Descarga el instalador de PostgreSQL');
    console.log('   2. Ejecuta el instalador como administrador');
    console.log('   3. Usa la contraseña: "secure_restaurant_2024"');
    console.log('   4. Puerto: 5432 (por defecto)');
    console.log('   5. Reinicia este script después de la instalación\n');
    
    // Crear script de configuración automática
    const postgresConfig = `
-- Script de configuración de PostgreSQL para desarrollo
-- Ejecutar como superusuario (postgres)

-- Crear base de datos
CREATE DATABASE restaurant_platform;

-- Crear usuario
CREATE USER admin WITH PASSWORD 'secure_restaurant_2024';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE restaurant_platform TO admin;

-- Conectar a la base de datos
\\c restaurant_platform;

-- Crear esquemas
CREATE SCHEMA IF NOT EXISTS public;

-- Dar permisos en el esquema
GRANT ALL ON SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Configurar permisos por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
`;

    fs.writeFileSync('database/postgres-setup.sql', postgresConfig);
    console.log('📄 Creado archivo: database/postgres-setup.sql');
    console.log('📋 Ejecuta este archivo en PostgreSQL después de la instalación\n');
  }

  // Verificar Redis
  if (commandExists('redis-server')) {
    console.log('✅ Redis ya está instalado');
  } else {
    console.log('❌ Redis no está instalado');
    console.log('📥 Instalando Redis...');
    
    // Para Windows, usar Redis en WSL o Docker
    console.log('📋 Opciones para Redis en Windows:');
    console.log('   1. WSL2 + Redis (recomendado)');
    console.log('   2. Docker Desktop + Redis');
    console.log('   3. Memurai (Redis para Windows)\n');
    
    // Crear configuración de Redis
    const redisConfig = `
# Configuración de Redis para desarrollo
port 6379
bind 127.0.0.1
protected-mode no
save 900 1
save 300 10
save 60 10000
`;

    fs.writeFileSync('database/redis.conf', redisConfig);
    console.log('📄 Creado archivo: database/redis.conf');
  }

  // Crear archivo de variables de entorno
  const envContent = `
# Configuración de bases de datos para desarrollo
NODE_ENV=development

# PostgreSQL
DATABASE_URL=postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform

# Redis
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

  // Crear script de inicio rápido
  const startScript = `@echo off
echo 🚀 Iniciando servicios de desarrollo...

echo 📦 Iniciando Redis...
start "Redis" redis-server database/redis.conf

echo 📦 Iniciando PostgreSQL...
echo ✅ PostgreSQL debe estar ejecutándose en el puerto 5432

echo 📦 Iniciando aplicación Next.js...
npm run dev

pause
`;

  fs.writeFileSync('start-dev.bat', startScript);
  console.log('📄 Creado archivo: start-dev.bat');

  console.log('🎉 Configuración completada!');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Instala PostgreSQL si no está instalado');
  console.log('   2. Instala Redis (WSL2, Docker, o Memurai)');
  console.log('   3. Ejecuta: database/postgres-setup.sql en PostgreSQL');
  console.log('   4. Ejecuta: start-dev.bat para iniciar todo');
  console.log('   5. O ejecuta: npm run dev\n');
}

// Ejecutar configuración
setupDatabases().catch(console.error);
