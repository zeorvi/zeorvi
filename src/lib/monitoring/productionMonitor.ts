import { logger } from '@/lib/logger';

export interface SystemMetrics {
  timestamp: Date;
  restaurantCount: number;
  activeConnections: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  databaseConnections: number;
  responseTime: number;
  errorRate: number;
  requestsPerSecond: number;
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'capacity' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  restaurantId?: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

class ProductionMonitor {
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private alertThresholds = {
    memoryUsage: 85, // 85%
    cpuUsage: 80, // 80%
    responseTime: 2000, // 2 segundos
    errorRate: 5, // 5%
    databaseConnections: 80, // 80% del pool máximo
  };

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitoreo cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Limpieza de métricas antiguas cada hora
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        restaurantCount: await this.getRestaurantCount(),
        activeConnections: this.getActiveConnections(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: await this.getCpuUsage(),
        databaseConnections: await this.getDatabaseConnections(),
        responseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        requestsPerSecond: await this.getRequestsPerSecond(),
      };

      this.metrics.push(metrics);
      this.checkThresholds(metrics);
      
      // Mantener solo las últimas 1000 métricas
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      logger.info('System metrics collected', metrics);
    } catch (error) {
      logger.error('Error collecting metrics', error);
    }
  }

  private async getRestaurantCount(): Promise<number> {
    try {
      // Implementar consulta real a la base de datos
      return 0; // Placeholder
    } catch (error) {
      logger.error('Error getting restaurant count', error);
      return 0;
    }
  }

  private getActiveConnections(): number {
    // Implementar conteo de conexiones activas
    return 0; // Placeholder
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const cpuPercent = (endUsage.user + endUsage.system) / 1000000; // Convertir a porcentaje
        resolve(cpuPercent);
      }, 100);
    });
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      // Implementar consulta real a la base de datos
      return 0; // Placeholder
    } catch (error) {
      logger.error('Error getting database connections', error);
      return 0;
    }
  }

  private async getAverageResponseTime(): Promise<number> {
    // Implementar cálculo de tiempo de respuesta promedio
    return 0; // Placeholder
  }

  private async getErrorRate(): Promise<number> {
    // Implementar cálculo de tasa de errores
    return 0; // Placeholder
  }

  private async getRequestsPerSecond(): Promise<number> {
    // Implementar conteo de requests por segundo
    return 0; // Placeholder
  }

  private checkThresholds(metrics: SystemMetrics): void {
    const alerts: Alert[] = [];

    // Verificar uso de memoria
    const memoryPercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryPercent > this.alertThresholds.memoryUsage) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: 'performance',
        severity: memoryPercent > 95 ? 'critical' : 'high',
        message: `High memory usage: ${memoryPercent.toFixed(2)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { memoryPercent, threshold: this.alertThresholds.memoryUsage }
      });
    }

    // Verificar uso de CPU
    if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        type: 'performance',
        severity: metrics.cpuUsage > 95 ? 'critical' : 'high',
        message: `High CPU usage: ${metrics.cpuUsage.toFixed(2)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { cpuUsage: metrics.cpuUsage, threshold: this.alertThresholds.cpuUsage }
      });
    }

    // Verificar tiempo de respuesta
    if (metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        id: `response-${Date.now()}`,
        type: 'performance',
        severity: metrics.responseTime > 5000 ? 'critical' : 'high',
        message: `Slow response time: ${metrics.responseTime}ms`,
        timestamp: new Date(),
        resolved: false,
        metadata: { responseTime: metrics.responseTime, threshold: this.alertThresholds.responseTime }
      });
    }

    // Verificar tasa de errores
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        id: `error-rate-${Date.now()}`,
        type: 'error',
        severity: metrics.errorRate > 10 ? 'critical' : 'high',
        message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { errorRate: metrics.errorRate, threshold: this.alertThresholds.errorRate }
      });
    }

    // Agregar nuevas alertas
    alerts.forEach(alert => {
      this.alerts.push(alert);
      this.sendAlert(alert);
    });
  }

  private sendAlert(alert: Alert): void {
    logger.warn('Production Alert', alert);
    
    // Aquí se podría integrar con servicios como:
    // - Slack
    // - Discord
    // - Email
    // - SMS
    // - PagerDuty
    
    console.log(`🚨 ALERTA [${alert.severity.toUpperCase()}] ${alert.message}`);
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 3600000);
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    // Limpiar alertas resueltas antiguas
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.alerts = this.alerts.filter(a => !a.resolved || a.timestamp > oneDayAgo);
  }

  // Métodos públicos
  public getMetrics(): SystemMetrics[] {
    return [...this.metrics];
  }

  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Alert resolved', { alertId, type: alert.type });
    }
  }

  public getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics | null;
    activeAlerts: number;
    uptime: number;
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    const activeAlerts = this.getActiveAlerts();
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (activeAlerts.some(a => a.severity === 'critical')) {
      status = 'critical';
    } else if (activeAlerts.some(a => a.severity === 'high')) {
      status = 'warning';
    }

    return {
      status,
      metrics: latestMetrics || null,
      activeAlerts: activeAlerts.length,
      uptime: process.uptime()
    };
  }

  public updateThresholds(newThresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    logger.info('Alert thresholds updated', newThresholds);
  }
}

// Singleton instance
export const productionMonitor = new ProductionMonitor();
export default productionMonitor;
