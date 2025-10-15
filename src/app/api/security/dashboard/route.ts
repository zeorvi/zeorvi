/**
 * API de monitoreo de seguridad para administradores
 * Dashboard de seguridad en tiempo real
 */

import { NextRequest } from 'next/server';
import { createSecureAPIMiddleware, createSecureResponse, getClientIP } from '@/lib/apiSecurity';
import { securityMonitor } from '@/lib/securityMonitor';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener dashboard de seguridad
const secureGET = createSecureAPIMiddleware()(async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  try {
    // Verificar que es un administrador (aquí se implementaría la verificación real)
    const isAdmin = true; // Por ahora permitir acceso
    
    if (!isAdmin) {
      logger.warn('Unauthorized access to security dashboard', { ip: clientIP });
      return createSecureResponse({ error: 'Unauthorized' }, 403);
    }

    // Obtener métricas de seguridad
    const metrics = securityMonitor.getMetrics();
    const recentEvents = securityMonitor.getRecentEvents(24); // Últimas 24 horas
    const criticalEvents = recentEvents.filter(event => 
      event.severity === 'critical' || event.severity === 'high'
    );

    // Generar reporte de seguridad
    const securityReport = securityMonitor.generateSecurityReport();

    return createSecureResponse({
      success: true,
      data: {
        metrics,
        recentEvents: recentEvents.slice(0, 100), // Últimos 100 eventos
        criticalEvents: criticalEvents.slice(0, 20), // Últimos 20 eventos críticos
        securityReport,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting security dashboard', { 
      ip: clientIP, 
      error: (error as Error).message 
    });
    return createSecureResponse({ error: 'Error al obtener dashboard de seguridad' }, 500);
  }
});

// POST - Bloquear/desbloquear IP
const securePOST = createSecureAPIMiddleware()(async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  try {
    const body = await request.json();
    const { action, ip, reason } = body;

    // Verificar que es un administrador
    const isAdmin = true; // Por ahora permitir acceso
    
    if (!isAdmin) {
      logger.warn('Unauthorized IP management attempt', { ip: clientIP, action, targetIP: ip });
      return createSecureResponse({ error: 'Unauthorized' }, 403);
    }

    if (!ip || !action) {
      return createSecureResponse({ error: 'IP and action are required' }, 400);
    }

    if (action === 'block') {
      securityMonitor.blockIP(ip, reason || 'Manually blocked by admin');
      logger.info('IP blocked by admin', { ip: clientIP, blockedIP: ip, reason });
      
      return createSecureResponse({
        success: true,
        message: `IP ${ip} bloqueada exitosamente`,
        action: 'blocked'
      });
    } else if (action === 'unblock') {
      securityMonitor.unblockIP(ip);
      logger.info('IP unblocked by admin', { ip: clientIP, unblockedIP: ip });
      
      return createSecureResponse({
        success: true,
        message: `IP ${ip} desbloqueada exitosamente`,
        action: 'unblocked'
      });
    } else {
      return createSecureResponse({ error: 'Invalid action. Use "block" or "unblock"' }, 400);
    }

  } catch (error) {
    logger.error('Error managing IP', { 
      ip: clientIP, 
      error: (error as Error).message 
    });
    return createSecureResponse({ error: 'Error al gestionar IP' }, 500);
  }
});

export { secureGET as GET, securePOST as POST };

