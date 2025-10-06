#!/usr/bin/env node

/**
 * Script de configuración para producción
 * Configura todos los servicios necesarios para el sistema de restaurantes
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Configurando sistema de restaurantes para producción...\n');

// Función para ejecutar comandos
function runCommand(command: string, description: string) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error);
    process.exit(1);
  }
}

// Función para verificar archivos
function checkFile(filePath: string, description: string): boolean {
  if (existsSync(filePath)) {
    console.log(`✅ ${description} encontrado`);
    return true;
  } else {
    console.log(`❌ ${description} no encontrado`);
    return false;
  }
}

// Función para crear archivo de configuración
function createConfigFile() {
  const configPath = join(process.cwd(), '.env.production');
  
  if (!existsSync(configPath)) {
    const configContent = `# Configuración de producción para sistema de restaurantes
# Base de datos
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_ai_platform

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Retell AI
RETELL_API_KEY=your_retell_api_key_here

# WebSocket
WS_PORT=8081

# Logging
LOG_LEVEL=info

# Analytics
ANALYTICS_CACHE_TTL=3600

# Alertas
ALERT_COOLDOWN_DEFAULT=15
ALERT_HIGH_OCCUPANCY_THRESHOLD=85
ALERT_LOW_OCCUPANCY_THRESHOLD=20

# Seguridad
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS (opcional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
`;

    writeFileSync(configPath, configContent);
    console.log('✅ Archivo de configuración .env.production creado');
  } else {
    console.log('ℹ️  Archivo de configuración .env.production ya existe');
  }
}

// Función para crear script de inicio
function createStartScript() {
  const startScriptPath = join(process.cwd(), 'start-production.js');
  
  const startScriptContent = `#!/usr/bin/env node

/**
 * Script de inicio para producción
 */

import { createServer } from 'http';
import next from 'next';
import { realtimeService } from './src/lib/realtimeService';
import { alertSystem } from './src/lib/alertSystem';
import { analyticsEngine } from './src/lib/analyticsEngine';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Inicializar servicios
  realtimeService.initialize(server);
  console.log('🔌 Servicio de tiempo real inicializado');
  
  console.log('🚨 Sistema de alertas iniciado');
  console.log('📊 Motor de analytics iniciado');

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(\`🚀 Servidor listo en http://\${hostname}:\${port}\`);
    console.log(\`📱 WebSocket disponible en ws://\${hostname}:\${port}/ws\`);
  });
});
`;

  writeFileSync(startScriptPath, startScriptContent);
  console.log('✅ Script de inicio start-production.js creado');
}

// Función para crear Dockerfile
function createDockerfile() {
  const dockerfilePath = join(process.cwd(), 'Dockerfile');
  
  if (!existsSync(dockerfilePath)) {
    const dockerfileContent = `# Dockerfile para sistema de restaurantes
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Configurar variables de entorno
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Construir la aplicación
RUN npm run build

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configurar permisos correctos para el cache de Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar archivos de construcción
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;

    writeFileSync(dockerfilePath, dockerfileContent);
    console.log('✅ Dockerfile creado');
  } else {
    console.log('ℹ️  Dockerfile ya existe');
  }
}

// Función para crear docker-compose
function createDockerCompose() {
  const composePath = join(process.cwd(), 'docker-compose.prod.yml');
  
  if (!existsSync(composePath)) {
    const composeContent = `version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: restaurant_ai_platform
      POSTGRES_USER: restaurant_user
      POSTGRES_PASSWORD: restaurant_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/setup-production-database.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U restaurant_user -d restaurant_ai_platform"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis para cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Aplicación principal
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://restaurant_user:restaurant_password@postgres:5432/restaurant_ai_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
`;

    writeFileSync(composePath, composeContent);
    console.log('✅ docker-compose.prod.yml creado');
  } else {
    console.log('ℹ️  docker-compose.prod.yml ya existe');
  }
}

// Función para crear script de despliegue
function createDeployScript() {
  const deployScriptPath = join(process.cwd(), 'deploy.sh');
  
  const deployScriptContent = `#!/bin/bash

# Script de despliegue para producción
echo "🚀 Desplegando sistema de restaurantes..."

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env.production ]; then
    echo "⚠️  Creando archivo .env.prodution desde plantilla..."
    cp .env.example .env.production
    echo "📝 Por favor, configura las variables de entorno en .env.production"
fi

# Construir y levantar servicios
echo "🔨 Construyendo servicios..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# Ejecutar migraciones
echo "📊 Ejecutando configuración de base de datos..."
docker-compose -f docker-compose.prod.yml exec app node scripts/setup-production.js

echo "✅ Despliegue completado!"
echo "🌐 Aplicación disponible en: http://localhost:3000"
echo "🔌 WebSocket disponible en: ws://localhost:3000/ws"
echo "📊 Base de datos disponible en: localhost:5432"

# Mostrar logs
echo "📋 Para ver los logs: docker-compose -f docker-compose.prod.yml logs -f"
`;

  writeFileSync(deployScriptPath, deployScriptContent);
  
  // Hacer el script ejecutable
  try {
    execSync(`chmod +x ${deployScriptPath}`);
    console.log('✅ Script de despliegue deploy.sh creado y configurado');
  } catch (error) {
    console.log('⚠️  Script de despliegue creado, pero no se pudo hacer ejecutable');
  }
}

// Función principal
async function main() {
  console.log('🔍 Verificando archivos necesarios...\n');
  
  // Verificar archivos críticos
  const criticalFiles = [
    ['package.json', 'Archivo de dependencias'],
    ['src/lib/database/production.ts', 'Servicio de base de datos'],
    ['src/lib/realtimeService.ts', 'Servicio de tiempo real'],
    ['src/lib/occupancyPredictor.ts', 'Motor de predicciones'],
    ['src/lib/alertSystem.ts', 'Sistema de alertas'],
    ['src/lib/analyticsEngine.ts', 'Motor de analytics']
  ];
  
  let allFilesExist = true;
  for (const [file, description] of criticalFiles) {
    if (!checkFile(file, description)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.log('\n❌ Faltan archivos críticos. Por favor, ejecuta primero la implementación completa.');
    process.exit(1);
  }
  
  console.log('\n✅ Todos los archivos críticos están presentes\n');
  
  // Crear archivos de configuración
  console.log('📝 Creando archivos de configuración...\n');
  createConfigFile();
  createStartScript();
  createDockerfile();
  createDockerCompose();
  createDeployScript();
  
  console.log('\n🎉 Configuración de producción completada!\n');
  
  console.log('📋 Próximos pasos:');
  console.log('1. Configura las variables de entorno en .env.production');
  console.log('2. Ejecuta: ./deploy.sh para desplegar');
  console.log('3. O ejecuta: npm run build && npm start para desarrollo');
  console.log('\n🔗 URLs importantes:');
  console.log('- Aplicación: http://localhost:3000');
  console.log('- WebSocket: ws://localhost:3000/ws');
  console.log('- Base de datos: localhost:5432');
  console.log('- Redis: localhost:6379');
}

// Ejecutar configuración
main().catch(console.error);
