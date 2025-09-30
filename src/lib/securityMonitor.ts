/**
 * Sistema de monitoreo de seguridad en tiempo real
 * Detección automática de amenazas y alertas
 */

import { logger } from './logger';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'attack_detected' | 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_access' | 'malicious_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  endpoint: string;
  description: string;
  metadata?: Record<string, any>;
}

interface SecurityMetrics {
  totalAttacks: number;
  attacksByType: Record<string, number>;
  attacksByIP: Record<string, number>;
  attacksByHour: Record<string, number>;
  blockedIPs: string[];
  suspiciousPatterns: string[];
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private metrics: SecurityMetrics = {
    totalAttacks: 0,
    attacksByType: {},
    attacksByIP: {},
    attacksByHour: {},
    blockedIPs: [],
    suspiciousPatterns: []
  };
  private maxEvents = 1000; // Mantener solo los últimos 1000 eventos

  /**
   * Registrar un evento de seguridad
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    // Agregar evento
    this.events.push(securityEvent);
    
    // Limitar número de eventos en memoria
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Actualizar métricas
    this.updateMetrics(securityEvent);

    // Log del evento
    logger.warn('Security event detected', {
      event: securityEvent.type,
      severity: securityEvent.severity,
      ip: securityEvent.ip,
      endpoint: securityEvent.endpoint,
      description: securityEvent.description,
      metadata: securityEvent.metadata
    });

    // Alertas críticas
    if (event.severity === 'critical' || event.severity === 'high') {
      this.sendCriticalAlert(securityEvent);
    }

    // Auto-bloqueo de IPs maliciosas
    if (event.type === 'attack_detected' && event.severity === 'high') {
      this.considerIPBlocking(event.ip);
    }
  }

  /**
   * Actualizar métricas de seguridad
   */
  private updateMetrics(event: SecurityEvent): void {
    this.metrics.totalAttacks++;
    
    // Por tipo
    this.metrics.attacksByType[event.type] = 
      (this.metrics.attacksByType[event.type] || 0) + 1;
    
    // Por IP
    this.metrics.attacksByIP[event.ip] = 
      (this.metrics.attacksByIP[event.ip] || 0) + 1;
    
    // Por hora
    const hour = event.timestamp.getHours().toString();
    this.metrics.attacksByHour[hour] = 
      (this.metrics.attacksByHour[hour] || 0) + 1;
  }

  /**
   * Enviar alerta crítica
   */
  private sendCriticalAlert(event: SecurityEvent): void {
    const alertMessage = `
🚨 ALERTA CRÍTICA DE SEGURIDAD 🚨
Tipo: ${event.type}
Severidad: ${event.severity}
IP: ${event.ip}
Endpoint: ${event.endpoint}
Descripción: ${event.description}
Timestamp: ${event.timestamp.toISOString()}
    `.trim();

    // Log crítico
    logger.error('CRITICAL SECURITY ALERT', {
      alert: alertMessage,
      event: event
    });

    // Aquí se podría integrar con sistemas de notificación:
    // - Email al administrador
    // - Slack/Discord webhook
    // - SMS
    // - Sistema de monitoreo externo
  }

  /**
   * Considerar bloqueo automático de IP
   */
  private considerIPBlocking(ip: string): void {
    const attacksFromIP = this.metrics.attacksByIP[ip] || 0;
    
    // Bloquear IP si tiene más de 10 ataques
    if (attacksFromIP > 10) {
      this.metrics.blockedIPs.push(ip);
      
      logger.error('IP automatically blocked due to repeated attacks', {
        ip,
        attackCount: attacksFromIP,
        blockedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener métricas de seguridad
   */
  getMetrics(): SecurityMetrics & { recentEvents: SecurityEvent[] } {
    const recentEvents = this.events.slice(-50); // Últimos 50 eventos
    
    return {
      ...this.metrics,
      recentEvents
    };
  }

  /**
   * Obtener eventos por IP
   */
  getEventsByIP(ip: string): SecurityEvent[] {
    return this.events.filter(event => event.ip === ip);
  }

  /**
   * Obtener eventos por tipo
   */
  getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Obtener eventos recientes (últimas 24 horas)
   */
  getRecentEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  /**
   * Verificar si una IP está en la lista de bloqueadas
   */
  isIPBlocked(ip: string): boolean {
    return this.metrics.blockedIPs.includes(ip);
  }

  /**
   * Agregar IP a la lista de bloqueadas manualmente
   */
  blockIP(ip: string, reason: string): void {
    if (!this.metrics.blockedIPs.includes(ip)) {
      this.metrics.blockedIPs.push(ip);
      
      logger.warn('IP manually blocked', {
        ip,
        reason,
        blockedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Remover IP de la lista de bloqueadas
   */
  unblockIP(ip: string): void {
    const index = this.metrics.blockedIPs.indexOf(ip);
    if (index > -1) {
      this.metrics.blockedIPs.splice(index, 1);
      
      logger.info('IP unblocked', {
        ip,
        unblockedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Generar reporte de seguridad
   */
  generateSecurityReport(): string {
    const metrics = this.getMetrics();
    const recentEvents = this.getRecentEvents(24);
    
    const report = `
📊 REPORTE DE SEGURIDAD - ÚLTIMAS 24 HORAS
============================================

🔢 ESTADÍSTICAS GENERALES:
- Total de ataques: ${metrics.totalAttacks}
- Eventos recientes: ${recentEvents.length}
- IPs bloqueadas: ${metrics.blockedIPs.length}

🎯 ATAQUES POR TIPO:
${Object.entries(metrics.attacksByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

🌐 TOP 5 IPs MÁS ACTIVAS:
${Object.entries(metrics.attacksByIP)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([ip, count]) => `- ${ip}: ${count} ataques`)
  .join('\n')}

🚫 IPs BLOQUEADAS:
${metrics.blockedIPs.length > 0 
  ? metrics.blockedIPs.map(ip => `- ${ip}`).join('\n')
  : 'Ninguna IP bloqueada actualmente'
}

⚠️ EVENTOS CRÍTICOS RECIENTES:
${recentEvents
  .filter(event => event.severity === 'critical' || event.severity === 'high')
  .slice(0, 5)
  .map(event => `- ${event.timestamp.toLocaleString()}: ${event.type} desde ${event.ip}`)
  .join('\n')}

============================================
Reporte generado: ${new Date().toLocaleString()}
    `.trim();

    return report;
  }

  /**
   * Limpiar eventos antiguos
   */
  cleanup(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días
    this.events = this.events.filter(event => event.timestamp > cutoff);
    
    logger.info('Security events cleanup completed', {
      eventsRemaining: this.events.length,
      cutoffDate: cutoff.toISOString()
    });
  }
}

// Instancia global del monitor de seguridad
export const securityMonitor = new SecurityMonitor();

// Limpiar eventos antiguos cada 24 horas
setInterval(() => {
  securityMonitor.cleanup();
}, 24 * 60 * 60 * 1000);

// Funciones helper para uso fácil
export function logAttack(ip: string, endpoint: string, description: string, metadata?: Record<string, any>): void {
  securityMonitor.logSecurityEvent({
    type: 'attack_detected',
    severity: 'high',
    ip,
    endpoint,
    description,
    metadata
  });
}

export function logSuspiciousActivity(ip: string, endpoint: string, description: string, metadata?: Record<string, any>): void {
  securityMonitor.logSecurityEvent({
    type: 'suspicious_activity',
    severity: 'medium',
    ip,
    endpoint,
    description,
    metadata
  });
}

export function logRateLimitExceeded(ip: string, endpoint: string, count: number): void {
  securityMonitor.logSecurityEvent({
    type: 'rate_limit_exceeded',
    severity: 'medium',
    ip,
    endpoint,
    description: `Rate limit exceeded: ${count} requests`,
    metadata: { requestCount: count }
  });
}

export function logMaliciousContent(ip: string, endpoint: string, pattern: string, content: string): void {
  securityMonitor.logSecurityEvent({
    type: 'malicious_content',
    severity: 'high',
    ip,
    endpoint,
    description: `Malicious content detected: ${pattern}`,
    metadata: { pattern, content: content.substring(0, 100) }
  });
}

export function logInvalidAccess(ip: string, endpoint: string, reason: string): void {
  securityMonitor.logSecurityEvent({
    type: 'invalid_access',
    severity: 'medium',
    ip,
    endpoint,
    description: `Invalid access attempt: ${reason}`,
    metadata: { reason }
  });
}

