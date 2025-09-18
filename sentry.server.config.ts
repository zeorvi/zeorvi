import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Configuración de performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configuración del entorno
  environment: process.env.NODE_ENV || 'development',
  
  // Configuración de release
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Configuración de contexto adicional
  initialScope: {
    tags: {
      component: 'server'
    }
  },

  // Filtros para errores del servidor
  beforeSend(event, hint) {
    // No capturar errores de desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry server event (dev):', event);
    }

    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message;
      
      // Filtrar errores de validación esperados
      if (message.includes('Validation error') || 
          message.includes('Datos de entrada inválidos')) {
        return null;
      }
      
      // Filtrar errores de autenticación esperados
      if (message.includes('No autorizado') || 
          message.includes('Acceso denegado')) {
        return null;
      }
    }

    return event;
  },

  // Configuración para capturar errores no manejados
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
