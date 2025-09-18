import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Configuración de performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Configuración de session replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,

  // Configuración del entorno
  environment: process.env.NODE_ENV || 'development',
  
  // Configuración de release
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Filtros para errores que no queremos capturar
  beforeSend(event, hint) {
    // No capturar errores de desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry event (dev):', event);
    }

    // Filtrar errores comunes del navegador
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as Error).message;
      
      // Filtrar errores de red comunes
      if (message.includes('Network Error') || 
          message.includes('fetch') ||
          message.includes('AbortError')) {
        return null;
      }
      
      // Filtrar errores de autenticación esperados
      if (message.includes('auth/') || 
          message.includes('Token inválido')) {
        return null;
      }
    }

    return event;
  },

  // Configuración de contexto adicional
  initialScope: {
    tags: {
      component: 'client'
    }
  },

  // Configuración de integrations
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
