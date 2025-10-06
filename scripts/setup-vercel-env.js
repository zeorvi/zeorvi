const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Leer el archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parsear las variables de entorno
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

console.log('🔧 Configurando variables de entorno en Vercel...');

// Configurar cada variable de entorno
Object.entries(envVars).forEach(([key, value]) => {
  if (key && value) {
    try {
      console.log(`📝 Configurando ${key}...`);
      execSync(`vercel env add ${key} production`, {
        input: value,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(`✅ ${key} configurado exitosamente`);
    } catch (error) {
      console.error(`❌ Error configurando ${key}:`, error.message);
    }
  }
});

console.log('🎉 Configuración de variables de entorno completada');
