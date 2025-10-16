// Configuración de la aplicación
// Next.js carga automáticamente las variables de entorno desde .env.local
// No necesitamos dotenv manualmente

// Función para validar que las variables requeridas existan
function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`❌ Variable de entorno requerida faltante: ${key}`);
  }
  return value || '';
}

export const config = {
  // Base de datos
  database: {
    url: requireEnv('DATABASE_URL', 'postgresql://localhost:5432/restaurant_dev')
  },
  
  // JWT
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-key-only-for-development'),
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
    apiKey: requireEnv('RETELL_API_KEY', '')
  },
  
  // Google Sheets
  googleSheets: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    projectId: process.env.GOOGLE_PROJECT_ID || ''
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  },
  
  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development'
};

// Solo mostrar logs en desarrollo
if (!config.isProduction) {
  console.log('🔧 Config loaded:', {
    environment: config.nodeEnv,
    databaseUrl: config.database.url.replace(/:[^:@]*@/, ':***@'),
    hasJwtSecret: !!config.jwt.secret,
    hasRetellKey: !!config.retell.apiKey,
    hasGoogleSheets: !!(config.googleSheets.clientEmail && config.googleSheets.privateKey)
  });
}