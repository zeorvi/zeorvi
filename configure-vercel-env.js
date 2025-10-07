#!/usr/bin/env node

/**
 * Script para configurar variables de entorno en Vercel
 * Ejecutar después del despliegue para configurar todas las variables necesarias
 */

const { execSync } = require('child_process');

// Variables de entorno necesarias para producción
const ENV_VARS = {
  // Base de datos
  'DATABASE_URL': 'postgresql://postgres.rjalwnbkknjqdxzwatrw:***@aws-1-eu-west-2.pooler.supabase.com:6543/postgres',
  
  // JWT
  'JWT_SECRET': 'your-super-secret-jwt-key-change-in-production-2024',
  'JWT_EXPIRES_IN': '7d',
  
  // Google Sheets API (REQUERIDO - Reemplazar con valores reales)
  'GOOGLE_CLIENT_EMAIL': 'tu-service-account@proyecto.iam.gserviceaccount.com',
  'GOOGLE_PRIVATE_KEY': '-----BEGIN PRIVATE KEY-----\\ntu-private-key\\n-----END PRIVATE KEY-----',
  
  // Retell AI (REQUERIDO - Reemplazar con valores reales)
  'RETELL_API_KEY': 'tu-retell-api-key',
  
  // Aplicación
  'NEXT_PUBLIC_BASE_URL': 'https://zeorvi-pir5k5iqv-zeorvis-projects.vercel.app',
  'NODE_ENV': 'production',
  
  // Redis (opcional)
  'REDIS_URL': 'redis://localhost:6379',
  
  // WebSocket
  'WEBSOCKET_PORT': '8081',
  
  // API
  'NEXT_PUBLIC_API_URL': 'https://zeorvi-pir5k5iqv-zeorvis-projects.vercel.app/api',
  
  // Email (opcional)
  'GMAIL_CLIENT_ID': 'tu-gmail-client-id',
  'GMAIL_CLIENT_SECRET': 'tu-gmail-client-secret',
  'GMAIL_REFRESH_TOKEN': 'tu-gmail-refresh-token',
  
  // Twilio (opcional)
  'TWILIO_ACCOUNT_SID': 'tu-twilio-account-sid',
  'TWILIO_AUTH_TOKEN': 'tu-twilio-auth-token',
  'TWILIO_PHONE_NUMBER': '+1234567890',
  
  // Airtable (opcional)
  'AIRTABLE_API_KEY': 'tu-airtable-api-key',
  'AIRTABLE_BASE_ID': 'tu-airtable-base-id'
};

console.log('🚀 Configurando variables de entorno en Vercel...\n');

// Configurar cada variable
Object.entries(ENV_VARS).forEach(([key, value]) => {
  try {
    console.log(`📝 Configurando ${key}...`);
    
    // Escapar comillas y caracteres especiales para la shell
    const escapedValue = value.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    
    // Usar vercel env add para cada variable
    const command = `vercel env add ${key} production`;
    
    // Simular input para el comando interactivo
    const fullCommand = `echo "${escapedValue}" | ${command}`;
    
    execSync(fullCommand, { stdio: 'pipe' });
    console.log(`✅ ${key} configurado`);
  } catch (error) {
    console.error(`❌ Error configurando ${key}:`, error.message);
  }
});

console.log('\n🎉 Configuración completada!');
console.log('\n📋 Variables configuradas:');
Object.keys(ENV_VARS).forEach(key => {
  console.log(`   ✅ ${key}`);
});

console.log('\n⚠️  IMPORTANTE:');
console.log('1. Reemplaza los valores de GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY con tus credenciales reales');
console.log('2. Reemplaza RETELL_API_KEY con tu clave real de Retell AI');
console.log('3. Actualiza NEXT_PUBLIC_BASE_URL con tu dominio final');
console.log('\n🔧 Para actualizar variables:');
console.log('   vercel env ls');
console.log('   vercel env rm VARIABLE_NAME');
console.log('   vercel env add VARIABLE_NAME production');

console.log('\n🌐 URL de producción:');
console.log('   https://zeorvi-pir5k5iqv-zeorvis-projects.vercel.app');

console.log('\n🧪 Para probar el sistema:');
console.log('   curl https://zeorvi-pir5k5iqv-zeorvis-projects.vercel.app/api/test-simple');
