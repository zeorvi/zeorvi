import { productionDb, RestaurantMetrics, TableState, Reservation } from './database/production';
import { occupancyPredictor } from './occupancyPredictor';
import { logger } from './logger';

// Interfaces para analytics
export interface AnalyticsReport {
  restaurantId: string;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  generatedAt: Date;
  summary: AnalyticsSummary;
  occupancy: OccupancyAnalytics;
  revenue: RevenueAnalytics;
  tables: TableAnalytics;
  reservations: ReservationAnalytics;
  predictions: PredictionAnalytics;
  recommendations: string[];
}

export interface AnalyticsSummary {
  totalRevenue: number;
  averageOccupancy: number;
  totalReservations: number;
  totalTables: number;
  peakHours: number[];
  bestPerformingLocation: string;
  growthRate: number;
  customerSatisfaction: number;
}

export interface OccupancyAnalytics {
  averageOccupancy: number;
  peakOccupancy: number;
  lowOccupancy: number;
  occupancyByHour: Array<{ hour: number; occupancy: number }>;
  occupancyByDay: Array<{ day: string; occupancy: number }>;
  occupancyTrend: 'increasing' | 'decreasing' | 'stable';
  capacityUtilization: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageRevenuePerTable: number;
  revenueByHour: Array<{ hour: number; revenue: number }>;
  revenueByDay: Array<{ day: string; revenue: number }>;
  revenueTrend: 'increasing' | 'decreasing' | 'stable';
  projectedRevenue: number;
}

export interface TableAnalytics {
  totalTables: number;
  averageTableTime: number;
  tableUtilization: number;
  topPerformingTables: Array<{ tableId: string; utilization: number; revenue: number }>;
  leastUsedTables: Array<{ tableId: string; utilization: number }>;
  tableConflicts: number;
  maintenanceAlerts: number;
}

export interface ReservationAnalytics {
  totalReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  noShowRate: number;
  averagePartySize: number;
  reservationTrend: 'increasing' | 'decreasing' | 'stable';
  peakReservationHours: number[];
  customerRetention: number;
}

export interface PredictionAnalytics {
  predictionAccuracy: number;
  confidenceScore: number;
  upcomingPeakHours: number[];
  recommendedActions: string[];
  riskFactors: string[];
  opportunities: string[];
}

class AdvancedAnalyticsEngine {
  private cache: Map<string, AnalyticsReport> = new Map();
  private cacheExpiry: Map<string, Date> = new Map();

  // Generar reporte completo de analytics
  async generateAnalyticsReport(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'week'
  ): Promise<AnalyticsReport> {
    const cacheKey = `${restaurantId}_${period}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey)!;
      if (expiry > new Date()) {
        return this.cache.get(cacheKey)!;
      }
    }

    try {
      logger.info(`Generating analytics report for restaurant ${restaurantId}, period: ${period}`);

      const [occupancy, revenue, tables, reservations, predictions] = await Promise.all([
        this.generateOccupancyAnalytics(restaurantId, period),
        this.generateRevenueAnalytics(restaurantId, period),
        this.generateTableAnalytics(restaurantId, period),
        this.generateReservationAnalytics(restaurantId, period),
        this.generatePredictionAnalytics(restaurantId, period)
      ]);

      const summary = this.generateSummary(occupancy, revenue, tables, reservations);
      const recommendations = this.generateRecommendations(occupancy, revenue, tables, reservations, predictions);

      const report: AnalyticsReport = {
        restaurantId,
        period,
        generatedAt: new Date(),
        summary,
        occupancy,
        revenue,
        tables,
        reservations,
        predictions,
        recommendations
      };

      // Guardar en cache (expira en 1 hora)
      this.cache.set(cacheKey, report);
      this.cacheExpiry.set(cacheKey, new Date(Date.now() + 60 * 60 * 1000));

      return report;

    } catch (error) {
      logger.error('Error generating analytics report', error);
      throw error;
    }
  }

  // Generar analytics de ocupación
  private async generateOccupancyAnalytics(
    restaurantId: string,
    period: string
  ): Promise<OccupancyAnalytics> {
    const dateRange = this.getDateRange(period);
    const metrics = await productionDb.getRestaurantMetrics(restaurantId, dateRange.start);

    // Calcular estadísticas básicas
    const occupancyValues = metrics.map(m => m.occupancyRate);
    const averageOccupancy = occupancyValues.reduce((sum, val) => sum + val, 0) / occupancyValues.length;
    const peakOccupancy = Math.max(...occupancyValues);
    const lowOccupancy = Math.min(...occupancyValues);

    // Ocupación por hora
    const occupancyByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourMetrics = metrics.filter(m => m.hour === hour);
      const avgOccupancy = hourMetrics.length > 0 
        ? hourMetrics.reduce((sum, m) => sum + m.occupancyRate, 0) / hourMetrics.length
        : 0;
      return { hour, occupancy: avgOccupancy };
    });

    // Ocupación por día
    const occupancyByDay = this.getDaysInPeriod(period).map(day => {
      const dayMetrics = metrics.filter(m => m.date === day);
      const avgOccupancy = dayMetrics.length > 0
        ? dayMetrics.reduce((sum, m) => sum + m.occupancyRate, 0) / dayMetrics.length
        : 0;
      return { day, occupancy: avgOccupancy };
    });

    // Tendencia de ocupación
    const occupancyTrend = this.calculateTrend(occupancyValues);

    return {
      averageOccupancy,
      peakOccupancy,
      lowOccupancy,
      occupancyByHour,
      occupancyByDay,
      occupancyTrend,
      capacityUtilization: averageOccupancy
    };
  }

  // Generar analytics de ingresos
  private async generateRevenueAnalytics(
    restaurantId: string,
    period: string
  ): Promise<RevenueAnalytics> {
    const dateRange = this.getDateRange(period);
    const metrics = await productionDb.getRestaurantMetrics(restaurantId, dateRange.start);

    // Calcular estadísticas de ingresos
    const revenueValues = metrics.map(m => m.revenue || 0);
    const totalRevenue = revenueValues.reduce((sum, val) => sum + val, 0);
    const averageRevenuePerTable = totalRevenue / metrics.length;

    // Ingresos por hora
    const revenueByHour = Array.from({ length: 24 }, (_, hour) => {
      const hourMetrics = metrics.filter(m => m.hour === hour);
      const totalHourRevenue = hourMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
      return { hour, revenue: totalHourRevenue };
    });

    // Ingresos por día
    const revenueByDay = this.getDaysInPeriod(period).map(day => {
      const dayMetrics = metrics.filter(m => m.date === day);
      const totalDayRevenue = dayMetrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
      return { day, revenue: totalDayRevenue };
    });

    // Tendencia de ingresos
    const revenueTrend = this.calculateTrend(revenueValues);

    // Proyección de ingresos (simplificada)
    const projectedRevenue = this.projectRevenue(revenueValues, period);

    return {
      totalRevenue,
      averageRevenuePerTable,
      revenueByHour,
      revenueByDay,
      revenueTrend,
      projectedRevenue
    };
  }

  // Generar analytics de mesas
  private async generateTableAnalytics(
    restaurantId: string,
    period: string
  ): Promise<TableAnalytics> {
    const tables = await productionDb.getTableStates(restaurantId);
    const metrics = await productionDb.getRestaurantMetrics(restaurantId);

    // Calcular utilización de mesas
    const tableUtilization = tables.map(table => {
      const tableMetrics = metrics.filter(m => 
        // Simulación: asumir que cada mesa contribuye proporcionalmente
        true
      );
      
      const utilization = tableMetrics.length > 0
        ? tableMetrics.reduce((sum, m) => sum + m.occupancyRate, 0) / tableMetrics.length
        : 0;

      return {
        tableId: table.tableId,
        utilization,
        revenue: 0 // En una implementación real, esto vendría de datos de ventas
      };
    });

    // Mesas mejor y peor rendimiento
    const topPerformingTables = tableUtilization
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 3);

    const leastUsedTables = tableUtilization
      .sort((a, b) => a.utilization - b.utilization)
      .slice(0, 3);

    // Calcular tiempo promedio de mesa
    const averageTableTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.averageTableTime || 0), 0) / metrics.length
      : 0;

    return {
      totalTables: tables.length,
      averageTableTime,
      tableUtilization: tableUtilization.reduce((sum, t) => sum + t.utilization, 0) / tableUtilization.length,
      topPerformingTables,
      leastUsedTables,
      tableConflicts: 0, // En una implementación real, esto vendría del sistema de alertas
      maintenanceAlerts: 0
    };
  }

  // Generar analytics de reservas
  private async generateReservationAnalytics(
    restaurantId: string,
    period: string
  ): Promise<ReservationAnalytics> {
    const dateRange = this.getDateRange(period);
    const reservations = await productionDb.getReservations(restaurantId, dateRange.start);

    // Calcular estadísticas de reservas
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter(r => r.status === 'confirmada').length;
    const cancelledReservations = reservations.filter(r => r.status === 'cancelada').length;
    const noShowRate = cancelledReservations / totalReservations;

    const averagePartySize = reservations.length > 0
      ? reservations.reduce((sum, r) => sum + r.partySize, 0) / reservations.length
      : 0;

    // Horas pico de reservas
    const reservationHours = reservations.map(r => parseInt(r.reservationTime.split(':')[0]));
    const hourCounts = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: reservationHours.filter(h => h === hour).length
    }));
    const peakReservationHours = hourCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    // Tendencia de reservas
    const reservationTrend = this.calculateTrend(reservations.map((_, i) => i));

    return {
      totalReservations,
      confirmedReservations,
      cancelledReservations,
      noShowRate,
      averagePartySize,
      reservationTrend,
      peakReservationHours,
      customerRetention: 0.75 // Simulado
    };
  }

  // Generar analytics de predicciones
  private async generatePredictionAnalytics(
    restaurantId: string,
    period: string
  ): Promise<PredictionAnalytics> {
    try {
      const now = new Date();
      const predictions = [];

      // Obtener predicciones para las próximas horas
      for (let hour = now.getHours(); hour <= 23; hour++) {
        try {
          const prediction = await occupancyPredictor.predictOccupancy(restaurantId, now, hour);
          predictions.push({
            hour,
            predictedOccupancy: prediction.predictedOccupancy,
            confidence: prediction.confidenceScore
          });
        } catch (error) {
          logger.error(`Error getting prediction for hour ${hour}`, error);
        }
      }

      // Calcular precisión de predicciones (simplificada)
      const predictionAccuracy = predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0;

      // Horas pico próximas
      const upcomingPeakHours = predictions
        .filter(p => p.predictedOccupancy > 70)
        .map(p => p.hour);

      // Acciones recomendadas
      const recommendedActions = [];
      if (upcomingPeakHours.length > 0) {
        recommendedActions.push('Preparar personal adicional para horas pico');
      }
      if (predictionAccuracy < 0.7) {
        recommendedActions.push('Mejorar calidad de datos históricos');
      }

      return {
        predictionAccuracy,
        confidenceScore: predictionAccuracy,
        upcomingPeakHours,
        recommendedActions,
        riskFactors: [],
        opportunities: []
      };

    } catch (error) {
      logger.error('Error generating prediction analytics', error);
      return {
        predictionAccuracy: 0,
        confidenceScore: 0,
        upcomingPeakHours: [],
        recommendedActions: [],
        riskFactors: ['Error en sistema de predicciones'],
        opportunities: []
      };
    }
  }

  // Generar resumen
  private generateSummary(
    occupancy: OccupancyAnalytics,
    revenue: RevenueAnalytics,
    tables: TableAnalytics,
    reservations: ReservationAnalytics
  ): AnalyticsSummary {
    return {
      totalRevenue: revenue.totalRevenue,
      averageOccupancy: occupancy.averageOccupancy,
      totalReservations: reservations.totalReservations,
      totalTables: tables.totalTables,
      peakHours: occupancy.occupancyByHour
        .sort((a, b) => b.occupancy - a.occupancy)
        .slice(0, 3)
        .map(h => h.hour),
      bestPerformingLocation: 'Terraza', // Simulado
      growthRate: 0.15, // Simulado
      customerSatisfaction: 0.85 // Simulado
    };
  }

  // Generar recomendaciones
  private generateRecommendations(
    occupancy: OccupancyAnalytics,
    revenue: RevenueAnalytics,
    tables: TableAnalytics,
    reservations: ReservationAnalytics,
    predictions: PredictionAnalytics
  ): string[] {
    const recommendations = [];

    // Recomendaciones basadas en ocupación
    if (occupancy.averageOccupancy > 80) {
      recommendations.push('Considera expandir el restaurante o aumentar la capacidad');
    } else if (occupancy.averageOccupancy < 30) {
      recommendations.push('Implementa estrategias de marketing para aumentar la ocupación');
    }

    // Recomendaciones basadas en ingresos
    if (revenue.revenueTrend === 'decreasing') {
      recommendations.push('Revisa la estrategia de precios y promociones');
    }

    // Recomendaciones basadas en reservas
    if (reservations.noShowRate > 0.2) {
      recommendations.push('Implementa sistema de confirmación de reservas');
    }

    // Recomendaciones basadas en predicciones
    recommendations.push(...predictions.recommendedActions);

    return recommendations;
  }

  // Utilidades
  private getDateRange(period: string): { start: string; end: string } {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }

  private getDaysInPeriod(period: string): string[] {
    const days = [];
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        days.push(now.toISOString().split('T')[0]);
        break;
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const day = new Date();
          day.setDate(now.getDate() - i);
          days.push(day.toISOString().split('T')[0]);
        }
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const day = new Date();
          day.setDate(now.getDate() - i);
          days.push(day.toISOString().split('T')[0]);
        }
        break;
    }

    return days;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private projectRevenue(values: number[], period: string): number {
    if (values.length === 0) return 0;

    const avgRevenue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    switch (period) {
      case 'today':
        return avgRevenue * 1;
      case 'week':
        return avgRevenue * 7;
      case 'month':
        return avgRevenue * 30;
      case 'quarter':
        return avgRevenue * 90;
      case 'year':
        return avgRevenue * 365;
      default:
        return avgRevenue;
    }
  }

  // Obtener reporte desde cache
  getCachedReport(restaurantId: string, period: string): AnalyticsReport | null {
    const cacheKey = `${restaurantId}_${period}`;
    return this.cache.get(cacheKey) || null;
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    logger.info('Analytics cache cleared');
  }
}

// Instancia singleton
export const analyticsEngine = new AdvancedAnalyticsEngine();
export default analyticsEngine;
