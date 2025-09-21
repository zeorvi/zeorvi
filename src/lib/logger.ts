// Logger simple que funciona en cualquier entorno (Edge Runtime compatible)
const createLogger = () => ({
  info: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message: string, meta?: unknown) => {
    const timestamp = new Date().toISOString();
    console.debug(`[${timestamp}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
  }
});

export const logger = createLogger();

// Logger específico para auditoría (usa el mismo logger simple)
export const auditLogger = createLogger();

// Funciones helper para logging estructurado
export const logAuth = (action: string, userId?: string, details?: unknown) => {
  auditLogger.info('Authentication event', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logAPI = (method: string, path: string, userId?: string, status?: number, duration?: number) => {
  logger.info('API Request', {
    method,
    path,
    userId,
    status,
    duration,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error: Error, context?: unknown) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

export const logReservation = (action: string, reservationId: string, restaurantId: string, details?: unknown) => {
  auditLogger.info('Reservation event', {
    action,
    reservationId,
    restaurantId,
    details,
    timestamp: new Date().toISOString()
  });
};

export default logger;
