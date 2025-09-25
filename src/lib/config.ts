// Configuración de la aplicación
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local
dotenvConfig({ path: path.join(process.cwd(), '.env.local') });

export const config = {
  // Base de datos
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres.rjalwnbkknjqdxzwatrw:asturias-1999-asturias@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  // WebSocket
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '8081')
  },
  
  // API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    publicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  },
  
  // Servicios externos
  retell: {
    apiKey: process.env.RETELL_API_KEY || 'your-retell-api-key'
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
  }
};

console.log('🔧 Config loaded:', {
  databaseUrl: config.database.url.replace(/:[^:@]*@/, ':***@'),
  hasJwtSecret: !!config.jwt.secret,
  hasRetellKey: !!config.retell.apiKey
});