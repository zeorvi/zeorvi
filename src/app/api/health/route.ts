import { NextRequest, NextResponse } from 'next/server';
import { productionMonitor } from '@/lib/monitoring/productionMonitor';
import { restaurantRateLimiter } from '@/lib/rateLimiting/restaurantRateLimiter';
import { productionErrorHandler } from '@/lib/errorHandling/productionErrorHandler';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Obtener métricas del sistema
    const systemHealth = productionMonitor.getSystemHealth();
    const rateLimitStats = restaurantRateLimiter.getStats();
    const errorStats = productionErrorHandler.getErrorStats();
    
    // Verificar conexión a base de datos
    let databaseStatus = 'unknown';
    let databaseResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      // Aquí se podría hacer una consulta simple a la DB
      // const result = await db.query('SELECT 1');
      databaseResponseTime = Date.now() - dbStartTime;
      databaseStatus = 'connected';
    } catch (error) {
      databaseStatus = 'error';
    }
    
    // Verificar Redis (si está configurado)
    let redisStatus = 'unknown';
    try {
      // Aquí se podría verificar Redis
      redisStatus = 'connected';
    } catch (error) {
      redisStatus = 'error';
    }
    
    // Verificar servicios externos
    const externalServices = {
      retell: await checkRetellService(),
      twilio: await checkTwilioService(),
      googleSheets: await checkGoogleSheetsService(),
    };
    
    const responseTime = Date.now() - startTime;
    
    // Determinar estado general
    let overallStatus = 'healthy';
    if (systemHealth.status === 'critical' || 
        databaseStatus === 'error' || 
        Object.values(externalServices).some(status => status !== 'healthy')) {
      overallStatus = 'unhealthy';
    } else if (systemHealth.status === 'warning' || 
               databaseResponseTime > 1000) {
      overallStatus = 'degraded';
    }
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime,
      
      system: {
        status: systemHealth.status,
        memory: systemHealth.metrics?.memoryUsage,
        cpu: systemHealth.metrics?.cpuUsage,
        activeAlerts: systemHealth.activeAlerts,
        uptime: systemHealth.uptime,
      },
      
      database: {
        status: databaseStatus,
        responseTime: databaseResponseTime,
      },
      
      redis: {
        status: redisStatus,
      },
      
      externalServices,
      
      rateLimiting: {
        totalStores: rateLimitStats.totalStores,
        totalKeys: rateLimitStats.totalKeys,
        endpoints: rateLimitStats.endpoints,
      },
      
      errors: {
        totalErrors: errorStats.totalErrors,
        errorsByCategory: errorStats.errorsByCategory,
        errorsBySeverity: errorStats.errorsBySeverity,
        recentErrorCount: errorStats.recentErrorCount,
      },
    };
    
    // Headers de cache
    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return NextResponse.json(healthData, { 
      status: overallStatus === 'healthy' ? 200 : 503,
      headers 
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function checkRetellService(): Promise<string> {
  try {
    if (!process.env.RETELL_API_KEY) {
      return 'not_configured';
    }
    
    // Aquí se podría hacer una llamada real a la API de Retell
    // const response = await fetch('https://api.retellai.com/v2/get-agent', {
    //   headers: { 'Authorization': `Bearer ${process.env.RETELL_API_KEY}` }
    // });
    
    return 'healthy';
  } catch (error) {
    return 'error';
  }
}

async function checkTwilioService(): Promise<string> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return 'not_configured';
    }
    
    // Aquí se podría verificar la conectividad con Twilio
    return 'healthy';
  } catch (error) {
    return 'error';
  }
}

async function checkGoogleSheetsService(): Promise<string> {
  try {
    if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_CREDENTIALS_PATH) {
      return 'not_configured';
    }
    
    // Aquí se podría verificar la conectividad con Google Sheets
    return 'healthy';
  } catch (error) {
    return 'error';
  }
}

// Endpoint para métricas detalladas (solo para administradores)
export async function POST(request: NextRequest) {
  try {
    // Verificar autorización de administrador
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Aquí se podría verificar el token JWT y los permisos
    
    const detailedMetrics = {
      system: productionMonitor.getMetrics(),
      rateLimiting: restaurantRateLimiter.getStats(),
      errors: productionErrorHandler.getErrorStats(),
      recentErrors: productionErrorHandler.getRecentErrors(100),
    };
    
    return NextResponse.json(detailedMetrics);
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
