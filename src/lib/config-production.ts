// Configuración optimizada para producción
export const productionConfig = {
  // Base de datos
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres.rjalwnbkknjqdxzwatrw:asturias-1999-asturias@aws-1-eu-west-2.pooler.supabase.com:6543/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
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
  },

  googleSheets: {
    sheetId: process.env.GOOGLE_SHEETS_ID || 'tu_id_de_la_hoja_de_calculo_aqui',
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json'
  },

  // Configuración de seguridad
  security: {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://www.zeorvi.com', 'https://zeorvi.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // límite por IP
    }
  },

  // Configuración de logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production'
  }
};

// Validar configuración crítica
export function validateConfig() {
  const errors: string[] = [];

  if (!productionConfig.database.url) {
    errors.push('DATABASE_URL es requerida');
  }

  if (!productionConfig.jwt.secret || productionConfig.jwt.secret === 'your-super-secret-jwt-key-change-in-production-2024') {
    errors.push('JWT_SECRET debe ser configurada en producción');
  }

  if (!productionConfig.retell.apiKey || productionConfig.retell.apiKey === 'your-retell-api-key') {
    errors.push('RETELL_API_KEY debe ser configurada');
  }

  if (errors.length > 0) {
    console.error('❌ Errores de configuración:', errors);
    throw new Error(`Configuración inválida: ${errors.join(', ')}`);
  }

  console.log('✅ Configuración validada correctamente');
  return true;
}

export default productionConfig;
