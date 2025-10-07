import { productionDb, RestaurantMetrics, TableState } from './database/production';
import { occupancyPredictor } from './occupancyPredictor';
import { realtimeService } from './realtimeService';
import { logger } from './logger';

// Tipos para el sistema de alertas
export interface Alert {
  id: string;
  restaurantId: string;
  type: 'high_occupancy' | 'low_occupancy' | 'table_conflict' | 'schedule_change' | 'prediction_anomaly' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  restaurantId: string;
  type: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface AlertConfig {
  highOccupancyThreshold: number;
  lowOccupancyThreshold: number;
  predictionAnomalyThreshold: number;
  tableConflictEnabled: boolean;
  scheduleChangeEnabled: boolean;
  systemErrorEnabled: boolean;
}

class IntelligentAlertSystem {
  private alertRules: Map<string, AlertRule[]> = new Map();
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private alertHistory: Alert[] = [];
  private isInitialized = false;
  private isMonitoring = false;

  constructor() {
    // No inicializar automáticamente para evitar queries en build time
    // Solo inicializar cuando se llame a un método público
  }

  // Inicialización lazy - solo cuando se necesita
  private ensureInitialized() {
    if (!this.isInitialized) {
      this.initializeDefaultRules();
      this.isInitialized = true;
    }
  }

  // Iniciar monitoreo solo si estamos en runtime
  private ensureMonitoring() {
    if (!this.isMonitoring && typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      this.startMonitoring();
      this.isMonitoring = true;
    }
  }

  // Inicializar reglas por defecto
  private initializeDefaultRules() {
    const defaultConfig: AlertConfig = {
      highOccupancyThreshold: 85,
      lowOccupancyThreshold: 20,
      predictionAnomalyThreshold: 30,
      tableConflictEnabled: true,
      scheduleChangeEnabled: true,
      systemErrorEnabled: true
    };

    // Configuración por defecto para todos los restaurantes
    this.alertConfigs.set('default', defaultConfig);
  }

  // Iniciar monitoreo
  private startMonitoring() {
    // Solo iniciar monitoreo en runtime, no en build time
    // Detectar si estamos en build phase de Next.js
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('⚠️  Skipping alert system monitoring during build');
      return;
    }

    // Monitorear cada 30 segundos
    setInterval(() => {
      this.checkAllRestaurants().catch(err => {
        logger.error('Error checking restaurants in alert system', err);
      });
    }, 30000);

    // Monitorear predicciones cada 5 minutos
    setInterval(() => {
      this.checkPredictions().catch(err => {
        logger.error('Error checking predictions in alert system', err);
      });
    }, 300000);

    logger.info('Intelligent Alert System started');
  }

  // Verificar todos los restaurantes
  private async checkAllRestaurants() {
    try {
      // Obtener todos los restaurantes activos
      const restaurants = await this.getActiveRestaurants();
      
      for (const restaurant of restaurants) {
        await this.checkRestaurantAlerts(restaurant.id);
      }
    } catch (error) {
      logger.error('Error checking restaurant alerts', error);
    }
  }

  // Obtener restaurantes activos
  private async getActiveRestaurants(): Promise<Array<{ id: string; name: string }>> {
    // En una implementación real, esto vendría de la base de datos
    return [
      { id: 'rest_001', name: 'El Buen Sabor' },
      { id: 'rest_003', name: 'La Gaviota' }
    ];
  }

  // Verificar alertas de un restaurante específico
  private async checkRestaurantAlerts(restaurantId: string) {
    try {
      const [metrics, tables] = await Promise.all([
        productionDb.getCurrentMetrics(restaurantId),
        productionDb.getTableStates(restaurantId)
      ]);

      const config = this.getAlertConfig(restaurantId);

      // Verificar ocupación alta
      if (metrics.occupancyRate >= config.highOccupancyThreshold) {
        await this.triggerAlert(restaurantId, {
          type: 'high_occupancy',
          severity: 'high',
          title: 'Alta Ocupación Detectada',
          message: `El restaurante tiene ${metrics.occupancyRate}% de ocupación. Considera aumentar el personal o gestionar las reservas.`,
          data: { occupancyRate: metrics.occupancyRate, threshold: config.highOccupancyThreshold }
        });
      }

      // Verificar ocupación baja
      if (metrics.occupancyRate <= config.lowOccupancyThreshold) {
        await this.triggerAlert(restaurantId, {
          type: 'low_occupancy',
          severity: 'medium',
          title: 'Baja Ocupación Detectada',
          message: `El restaurante tiene solo ${metrics.occupancyRate}% de ocupación. Considera promociones o actividades especiales.`,
          data: { occupancyRate: metrics.occupancyRate, threshold: config.lowOccupancyThreshold }
        });
      }

      // Verificar conflictos de mesas
      if (config.tableConflictEnabled) {
        await this.checkTableConflicts(restaurantId, tables);
      }

    } catch (error) {
      logger.error(`Error checking alerts for restaurant ${restaurantId}`, error);
      
      if (this.getAlertConfig(restaurantId).systemErrorEnabled) {
        await this.triggerAlert(restaurantId, {
          type: 'system_error',
          severity: 'critical',
          title: 'Error del Sistema',
          message: `Error al verificar alertas del restaurante: ${error instanceof Error ? error.message : String(error)}`,
          data: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }
  }

  // Verificar conflictos de mesas
  private async checkTableConflicts(restaurantId: string, tables: TableState[]) {
    const conflicts = [];

    // Verificar mesas con estado inconsistente
    for (const table of tables) {
      // Mesa ocupada sin cliente
      if (table.status === 'ocupada' && !table.clientName) {
        conflicts.push({
          tableId: table.tableId,
          issue: 'Mesa ocupada sin información del cliente',
          severity: 'medium'
        });
      }

      // Mesa reservada sin información de reserva
      if (table.status === 'reservada' && !table.clientName) {
        conflicts.push({
          tableId: table.tableId,
          issue: 'Mesa reservada sin información del cliente',
          severity: 'medium'
        });
      }

      // Mesa ocupada por mucho tiempo
      if (table.status === 'ocupada' && table.occupiedAt) {
        const hoursOccupied = (Date.now() - table.occupiedAt.getTime()) / (1000 * 60 * 60);
        if (hoursOccupied > 4) {
          conflicts.push({
            tableId: table.tableId,
            issue: `Mesa ocupada por ${hoursOccupied.toFixed(1)} horas`,
            severity: 'low'
          });
        }
      }
    }

    // Crear alerta si hay conflictos
    if (conflicts.length > 0) {
      await this.triggerAlert(restaurantId, {
        type: 'table_conflict',
        severity: 'medium',
        title: 'Conflictos de Mesas Detectados',
        message: `Se encontraron ${conflicts.length} conflictos en las mesas. Revisa la información.`,
        data: { conflicts }
      });
    }
  }

  // Verificar predicciones
  private async checkPredictions() {
    try {
      const restaurants = await this.getActiveRestaurants();
      
      for (const restaurant of restaurants) {
        const config = this.getAlertConfig(restaurant.id);
        
        // Obtener predicciones para las próximas horas
        const now = new Date();
        const predictions = [];
        
        for (let hour = now.getHours(); hour <= 23; hour++) {
          try {
            const prediction = await occupancyPredictor.predictOccupancy(restaurant.id, now, hour);
            predictions.push({
              hour,
              predictedOccupancy: prediction.predictedOccupancy,
              confidence: prediction.confidenceScore
            });
          } catch (error) {
            logger.error(`Error getting prediction for hour ${hour}`, error);
          }
        }

        // Verificar anomalías en las predicciones
        if (predictions.length > 0) {
          const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
          
          if (avgConfidence < config.predictionAnomalyThreshold) {
            await this.triggerAlert(restaurant.id, {
              type: 'prediction_anomaly',
              severity: 'low',
              title: 'Baja Confianza en Predicciones',
              message: `Las predicciones tienen una confianza promedio de ${avgConfidence.toFixed(1)}%. Considera revisar los datos históricos.`,
              data: { 
                averageConfidence: avgConfidence, 
                threshold: config.predictionAnomalyThreshold,
                predictions 
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error checking predictions', error);
    }
  }

  // Disparar alerta
  private async triggerAlert(restaurantId: string, alertData: Omit<Alert, 'id' | 'restaurantId' | 'createdAt'>) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      restaurantId,
      ...alertData,
      createdAt: new Date()
    };

    // Verificar cooldown
    const lastAlert = this.alertHistory
      .filter(a => a.restaurantId === restaurantId && a.type === alertData.type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (lastAlert) {
      const cooldownMinutes = this.getCooldownForAlertType(alertData.type);
      const timeSinceLastAlert = (Date.now() - lastAlert.createdAt.getTime()) / (1000 * 60);
      
      if (timeSinceLastAlert < cooldownMinutes) {
        return; // Aún en cooldown
      }
    }

    // Añadir a historial
    this.alertHistory.push(alert);

    // Enviar notificación en tiempo real
    await realtimeService.broadcastToRestaurant(restaurantId, 'alert_triggered', {
      alert
    });

    // Log de la alerta
    logger.warn(`Alert triggered for restaurant ${restaurantId}`, {
      type: alertData.type,
      severity: alertData.severity,
      title: alertData.title
    });

    // En una implementación real, aquí se enviarían notificaciones por email, SMS, etc.
    await this.sendNotification(alert);
  }

  // Obtener configuración de alertas
  private getAlertConfig(restaurantId: string): AlertConfig {
    return this.alertConfigs.get(restaurantId) || this.alertConfigs.get('default')!;
  }

  // Obtener cooldown para tipo de alerta
  private getCooldownForAlertType(type: string): number {
    const cooldowns = {
      'high_occupancy': 15, // 15 minutos
      'low_occupancy': 30,  // 30 minutos
      'table_conflict': 10, // 10 minutos
      'schedule_change': 5, // 5 minutos
      'prediction_anomaly': 60, // 1 hora
      'system_error': 5    // 5 minutos
    };
    
    return cooldowns[type as keyof typeof cooldowns] || 15;
  }

  // Enviar notificación
  private async sendNotification(alert: Alert) {
    try {
      // En una implementación real, aquí se integrarían servicios como:
      // - Email (SendGrid, AWS SES)
      // - SMS (Twilio)
      // - Push notifications
      // - Slack/Discord webhooks
      
      console.log(`🔔 ALERTA [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`);
      
      // Registrar en base de datos
      await productionDb.logSystemEvent(
        alert.restaurantId,
        'alert_triggered',
        {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message
        },
        'alert_system'
      );
      
    } catch (error) {
      logger.error('Error sending notification', error);
    }
  }

  // Obtener alertas activas
  getActiveAlerts(restaurantId?: string): Alert[] {
    return this.alertHistory
      .filter(alert => 
        (!restaurantId || alert.restaurantId === restaurantId) &&
        !alert.resolvedAt
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Reconocer alerta
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledgedAt = new Date();
      
      // Enviar actualización en tiempo real
      await realtimeService.broadcastToRestaurant(alert.restaurantId, 'alert_acknowledged', {
        alertId: alert.id
      });
      
      return true;
    }
    return false;
  }

  // Resolver alerta
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      
      // Enviar actualización en tiempo real
      await realtimeService.broadcastToRestaurant(alert.restaurantId, 'alert_resolved', {
        alertId: alert.id
      });
      
      return true;
    }
    return false;
  }

  // Configurar alertas para restaurante
  async configureAlerts(restaurantId: string, config: AlertConfig): Promise<void> {
    this.ensureInitialized();
    this.alertConfigs.set(restaurantId, config);
    
    // En una implementación real, esto se guardaría en la base de datos
    await productionDb.logSystemEvent(
      restaurantId,
      'alert_config_updated',
      { config },
      'admin'
    );
  }

  // Obtener estadísticas de alertas
  getAlertStats(restaurantId?: string): {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    this.ensureInitialized();
    const alerts = restaurantId 
      ? this.alertHistory.filter(a => a.restaurantId === restaurantId)
      : this.alertHistory;

    const stats = {
      total: alerts.length,
      active: alerts.filter(a => !a.resolvedAt).length,
      acknowledged: alerts.filter(a => a.acknowledgedAt && !a.resolvedAt).length,
      resolved: alerts.filter(a => a.resolvedAt).length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    alerts.forEach(alert => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
    });

    return stats;
  }
}

// Instancia singleton
export const alertSystem = new IntelligentAlertSystem();
export default alertSystem;
