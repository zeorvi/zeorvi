import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Cargar variables de entorno de producción
dotenvConfig({ path: path.join(process.cwd(), '.env.production') });

export interface ProductionConfig {
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
    idleTimeout: number;
    ssl: boolean;
  };
  redis: {
    url: string;
    maxRetriesPerRequest: number;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  monitoring: {
    enabled: boolean;
    intervalMs: number;
    alertThresholds: {
      memoryUsage: number;
      cpuUsage: number;
      responseTime: number;
      errorRate: number;
    };
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
    corsOrigins: string[];
  };
  retell: {
    apiKey: string;
    webhookSecret: string;
    timeoutMs: number;
    maxRetries: number;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    webhookUrl: string;
  };
  googleSheets: {
    credentialsPath: string;
    spreadsheetId: string;
    timeoutMs: number;
  };
  websocket: {
    port: number;
    maxConnections: number;
    heartbeatInterval: number;
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    maxFileSize: string;
    maxFiles: number;
  };
}

const config: ProductionConfig = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@host:port/database',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    ssl: process.env.NODE_ENV === 'production',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
    enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK === 'true',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
  },
  
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    intervalMs: parseInt(process.env.MONITORING_INTERVAL_MS || '30000'), // 30 segundos
    alertThresholds: {
      memoryUsage: parseInt(process.env.ALERT_MEMORY_THRESHOLD || '85'),
      cpuUsage: parseInt(process.env.ALERT_CPU_THRESHOLD || '80'),
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_THRESHOLD || '2000'),
      errorRate: parseInt(process.env.ALERT_ERROR_RATE_THRESHOLD || '5'),
    },
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },
  
  retell: {
    apiKey: process.env.RETELL_API_KEY || 'your-retell-api-key',
    webhookSecret: process.env.RETELL_WEBHOOK_SECRET || 'your-webhook-secret',
    timeoutMs: parseInt(process.env.RETELL_TIMEOUT_MS || '30000'),
    maxRetries: parseInt(process.env.RETELL_MAX_RETRIES || '3'),
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-account-sid',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-auth-token',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
    webhookUrl: process.env.TWILIO_WEBHOOK_URL || 'https://yourdomain.com/api/twilio/webhook',
  },
  
  googleSheets: {
    credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || 'google-credentials.json',
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || 'your-spreadsheet-id',
    timeoutMs: parseInt(process.env.GOOGLE_SHEETS_TIMEOUT_MS || '10000'),
  },
  
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '8081'),
    maxConnections: parseInt(process.env.WEBSOCKET_MAX_CONNECTIONS || '1000'),
    heartbeatInterval: parseInt(process.env.WEBSOCKET_HEARTBEAT_INTERVAL || '30000'),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
    enableFile: process.env.LOG_ENABLE_FILE === 'true',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
  },
};

// Validación de configuración crítica
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.database.url || config.database.url.includes('your-')) {
    errors.push('DATABASE_URL is required and must be properly configured');
  }
  
  if (!config.security.jwtSecret || config.security.jwtSecret.includes('your-')) {
    errors.push('JWT_SECRET is required and must be properly configured');
  }
  
  if (!config.retell.apiKey || config.retell.apiKey.includes('your-')) {
    errors.push('RETELL_API_KEY is required and must be properly configured');
  }
  
  if (config.database.poolSize < 5 || config.database.poolSize > 50) {
    errors.push('DB_POOL_SIZE should be between 5 and 50');
  }
  
  if (config.monitoring.alertThresholds.memoryUsage < 50 || config.monitoring.alertThresholds.memoryUsage > 100) {
    errors.push('ALERT_MEMORY_THRESHOLD should be between 50 and 100');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Función para obtener configuración específica por plan de restaurante
export function getRestaurantPlanConfig(plan: 'basic' | 'premium' | 'enterprise') {
  const baseConfig = { ...config };
  
  switch (plan) {
    case 'basic':
      return {
        ...baseConfig,
        rateLimit: {
          ...baseConfig.rateLimit,
          maxRequests: 100,
        },
        database: {
          ...baseConfig.database,
          poolSize: 5,
        },
      };
      
    case 'premium':
      return {
        ...baseConfig,
        rateLimit: {
          ...baseConfig.rateLimit,
          maxRequests: 500,
        },
        database: {
          ...baseConfig.database,
          poolSize: 10,
        },
      };
      
    case 'enterprise':
      return {
        ...baseConfig,
        rateLimit: {
          ...baseConfig.rateLimit,
          maxRequests: 2000,
        },
        database: {
          ...baseConfig.database,
          poolSize: 20,
        },
      };
      
    default:
      return baseConfig;
  }
}

// Función para calcular configuración dinámica basada en el número de restaurantes
export function getDynamicConfig(restaurantCount: number) {
  const baseConfig = { ...config };
  
  // Ajustar pool de base de datos basado en el número de restaurantes
  const dynamicPoolSize = Math.min(50, Math.max(10, Math.ceil(restaurantCount * 2)));
  
  // Ajustar límites de rate limiting
  const dynamicMaxRequests = Math.min(1000, Math.max(100, Math.ceil(restaurantCount * 10)));
  
  return {
    ...baseConfig,
    database: {
      ...baseConfig.database,
      poolSize: dynamicPoolSize,
    },
    rateLimit: {
      ...baseConfig.rateLimit,
      maxRequests: dynamicMaxRequests,
    },
    websocket: {
      ...baseConfig.websocket,
      maxConnections: Math.min(5000, Math.max(1000, restaurantCount * 50)),
    },
  };
}

// Log de configuración (sin datos sensibles)
console.log('🔧 Production Config loaded:', {
  databaseUrl: config.database.url.replace(/:[^:@]*@/, ':***@'),
  hasJwtSecret: !!config.security.jwtSecret,
  hasRetellKey: !!config.retell.apiKey,
  hasTwilioConfig: !!config.twilio.accountSid,
  poolSize: config.database.poolSize,
  monitoringEnabled: config.monitoring.enabled,
  rateLimitMaxRequests: config.rateLimit.maxRequests,
});

export default config;
