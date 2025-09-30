#!/usr/bin/env node

/**
 * Script de configuración rápida para Supabase
 * Guía al usuario paso a paso para configurar Supabase
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSupabase() {
  console.log('🚀 Configuración de Supabase para Restaurante AI Platform');
  console.log('='.repeat(60));
  
  try {
    // Paso 1: Verificar si ya existe .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    const envExists = fs.existsSync(envPath);
    
    if (envExists) {
      console.log('⚠️  Ya existe un archivo .env.local');
      const overwrite = await question('¿Deseas sobrescribirlo? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Configuración cancelada');
        rl.close();
        return;
      }
    }
    
    // Paso 2: Recopilar información de Supabase
    console.log('\n📋 Información de Supabase:');
    console.log('Ve a tu panel de Supabase → Settings → Database');
    console.log('Copia la "Connection string" (URI)');
    
    const databaseUrl = await question('\n🔗 DATABASE_URL (postgresql://...): ');
    
    if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
      console.log('❌ URL de base de datos inválida');
      rl.close();
      return;
    }
    
    // Paso 3: Configuración opcional
    console.log('\n⚙️  Configuración opcional:');
    
    const jwtSecret = await question('🔐 JWT_SECRET (presiona Enter para generar automáticamente): ');
    const redisUrl = await question('📦 REDIS_URL (presiona Enter para usar localhost:6379): ');
    
    // Paso 4: Generar JWT secret si no se proporcionó
    const finalJwtSecret = jwtSecret || generateJwtSecret();
    
    // Paso 5: Crear archivo .env.local
    const envContent = generateEnvContent(databaseUrl, finalJwtSecret, redisUrl);
    
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Archivo .env.local creado exitosamente');
    
    // Paso 6: Probar conexión
    console.log('\n🔍 Probando conexión...');
    const { testConnection } = require('./test-supabase-connection.js');
    
    try {
      await testConnection();
      console.log('\n🎉 ¡Configuración completada exitosamente!');
      console.log('\n📋 Próximos pasos:');
      console.log('1. Ejecutar: npm run db:setup');
      console.log('2. Probar el login con usuarios demo');
      console.log('3. Configurar tu restaurante');
    } catch (error) {
      console.log('\n⚠️  Configuración creada pero hay problemas de conexión');
      console.log('Revisa la URL de Supabase y vuelve a ejecutar: npm run db:test-connection');
    }
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    rl.close();
  }
}

function generateJwtSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateEnvContent(databaseUrl, jwtSecret, redisUrl) {
  return `# Configuración de Base de Datos PostgreSQL (Supabase)
DATABASE_URL=${databaseUrl}

# Configuración de Redis (opcional para desarrollo local)
REDIS_URL=${redisUrl || 'redis://localhost:6379'}

# JWT Secret para autenticación
JWT_SECRET=${jwtSecret}

# Firebase (mantener para compatibilidad)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Airtable (opcional)
AIRTABLE_API_KEY=your-airtable-api-key
AIRTABLE_BASE_ID=your-base-id

# Twilio (opcional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Retell AI (opcional)
RETELL_API_KEY=your-retell-api-key

# Gmail API (opcional)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
`;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupSupabase().catch(console.error);
}

module.exports = { setupSupabase };

