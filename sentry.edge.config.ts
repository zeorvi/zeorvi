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
      component: 'edge'
    }
  },
});
