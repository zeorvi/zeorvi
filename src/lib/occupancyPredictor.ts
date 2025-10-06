import { productionDb, RestaurantMetrics, OccupancyPrediction } from './database/production';
import { logger } from '@/lib/logger';

// Interfaces para el motor de IA
interface HistoricalData {
  date: string;
  hour: number;
  occupancyRate: number;
  totalTables: number;
  occupiedTables: number;
  reservedTables: number;
  freeTables: number;
  revenue?: number;
}

interface PredictionFactors {
  dayOfWeek: string;
  hour: number;
  seasonality: number;
  historicalAverage: number;
  recentTrend: number;
  specialEvents: string[];
  weather?: string;
}

interface PredictionResult {
  predictedOccupancy: number;
  confidenceScore: number;
  factors: PredictionFactors;
  recommendations: string[];
}

class OccupancyPredictor {
  private historicalData: Map<string, HistoricalData[]> = new Map();
  private predictionCache: Map<string, OccupancyPrediction> = new Map();

  // Obtener datos históricos para un restaurante
  async getHistoricalData(restaurantId: string, days: number = 30): Promise<HistoricalData[]> {
    const cacheKey = `${restaurantId}_${days}`;
    
    if (this.historicalData.has(cacheKey)) {
      return this.historicalData.get(cacheKey)!;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const metrics = await productionDb.getRestaurantMetrics(
        restaurantId,
        startDate.toISOString().split('T')[0]
      );

      const historicalData: HistoricalData[] = metrics.map(metric => ({
        date: metric.date,
        hour: metric.hour,
        occupancyRate: metric.occupancyRate,
        totalTables: metric.totalTables,
        occupiedTables: metric.occupiedTables,
        reservedTables: metric.reservedTables,
        freeTables: metric.freeTables,
        revenue: metric.revenue
      }));

      this.historicalData.set(cacheKey, historicalData);
      return historicalData;
    } catch (error) {
      logger.error('Error getting historical data', error);
      return [];
    }
  }

  // Analizar patrones en los datos históricos
  async analyzePatterns(restaurantId: string): Promise<{
    hourlyAverages: Map<number, number>;
    dailyAverages: Map<string, number>;
    weeklyTrend: number;
    peakHours: number[];
    lowHours: number[];
  }> {
    const historicalData = await this.getHistoricalData(restaurantId, 30);
    
    if (historicalData.length === 0) {
      return {
        hourlyAverages: new Map(),
        dailyAverages: new Map(),
        weeklyTrend: 0,
        peakHours: [],
        lowHours: []
      };
    }

    // Calcular promedios por hora
    const hourlyTotals = new Map<number, { sum: number; count: number }>();
    const dailyTotals = new Map<string, { sum: number; count: number }>();

    for (const data of historicalData) {
      // Por hora
      if (!hourlyTotals.has(data.hour)) {
        hourlyTotals.set(data.hour, { sum: 0, count: 0 });
      }
      const hourData = hourlyTotals.get(data.hour)!;
      hourData.sum += data.occupancyRate;
      hourData.count++;

      // Por día de la semana
      const dayOfWeek = new Date(data.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (!dailyTotals.has(dayOfWeek)) {
        dailyTotals.set(dayOfWeek, { sum: 0, count: 0 });
      }
      const dayData = dailyTotals.get(dayOfWeek)!;
      dayData.sum += data.occupancyRate;
      dayData.count++;
    }

    // Convertir a promedios
    const hourlyAverages = new Map<number, number>();
    for (const [hour, data] of hourlyTotals.entries()) {
      hourlyAverages.set(hour, data.sum / data.count);
    }

    const dailyAverages = new Map<string, number>();
    for (const [day, data] of dailyTotals.entries()) {
      dailyAverages.set(day, data.sum / data.count);
    }

    // Calcular tendencia semanal
    const weeklyTrend = this.calculateWeeklyTrend(historicalData);

    // Identificar horas pico y valle
    const sortedHours = Array.from(hourlyAverages.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const peakHours = sortedHours.slice(0, 3).map(([hour]) => hour);
    const lowHours = sortedHours.slice(-3).map(([hour]) => hour);

    return {
      hourlyAverages,
      dailyAverages,
      weeklyTrend,
      peakHours,
      lowHours
    };
  }

  // Calcular tendencia semanal
  private calculateWeeklyTrend(historicalData: HistoricalData[]): number {
    if (historicalData.length < 14) return 0;

    // Dividir en semanas
    const weeks: HistoricalData[][] = [];
    let currentWeek: HistoricalData[] = [];
    let lastWeek = -1;

    for (const data of historicalData) {
      const week = this.getWeekNumber(new Date(data.date));
      
      if (week !== lastWeek) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
        lastWeek = week;
      }
      
      currentWeek.push(data);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    if (weeks.length < 2) return 0;

    // Calcular promedio por semana
    const weeklyAverages = weeks.map(week => 
      week.reduce((sum, data) => sum + data.occupancyRate, 0) / week.length
    );

    // Calcular tendencia (diferencia entre últimas dos semanas)
    const recentTrend = weeklyAverages[weeklyAverages.length - 1] - weeklyAverages[weeklyAverages.length - 2];
    return recentTrend;
  }

  // Obtener número de semana
  private getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

  // Obtener factores externos
  async getExternalFactors(date: Date): Promise<{
    dayOfWeek: string;
    seasonality: number;
    specialEvents: string[];
    weather?: string;
  }> {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Calcular estacionalidad (simplificado)
    const month = date.getMonth();
    const seasonality = this.calculateSeasonality(month);
    
    // Detectar eventos especiales (simplificado)
    const specialEvents = this.detectSpecialEvents(date);
    
    // Weather sería integrado con una API externa
    const weather = await this.getWeatherData(date);

    return {
      dayOfWeek,
      seasonality,
      specialEvents,
      weather
    };
  }

  // Calcular estacionalidad
  private calculateSeasonality(month: number): number {
    // Factores estacionales simplificados
    const seasonalFactors = [
      0.8,  // Enero
      0.7,  // Febrero
      0.9,  // Marzo
      1.0,  // Abril
      1.1,  // Mayo
      1.2,  // Junio
      1.3,  // Julio
      1.2,  // Agosto
      1.1,  // Septiembre
      1.0,  // Octubre
      0.9,  // Noviembre
      1.1   // Diciembre
    ];
    
    return seasonalFactors[month] || 1.0;
  }

  // Detectar eventos especiales
  private detectSpecialEvents(date: Date): string[] {
    const events: string[] = [];
    
    // Días festivos españoles (simplificado)
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (month === 1 && day === 1) events.push('Año Nuevo');
    if (month === 1 && day === 6) events.push('Reyes');
    if (month === 4 && day === 23) events.push('San Jorge');
    if (month === 5 && day === 1) events.push('Día del Trabajo');
    if (month === 8 && day === 15) events.push('Asunción');
    if (month === 10 && day === 12) events.push('Día de la Hispanidad');
    if (month === 11 && day === 1) events.push('Todos los Santos');
    if (month === 12 && day === 6) events.push('Día de la Constitución');
    if (month === 12 && day === 8) events.push('Inmaculada');
    if (month === 12 && day === 25) events.push('Navidad');
    
    // Días especiales del restaurante
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      events.push('Fin de semana');
    }
    
    return events;
  }

  // Obtener datos del clima (simulado)
  private async getWeatherData(date: Date): Promise<string> {
    // En una implementación real, esto se conectaría con una API del clima
    const month = date.getMonth();
    
    if (month >= 2 && month <= 4) return 'primavera';
    if (month >= 5 && month <= 7) return 'verano';
    if (month >= 8 && month <= 10) return 'otoño';
    return 'invierno';
  }

  // Generar predicción principal
  async predictOccupancy(
    restaurantId: string,
    date: Date,
    hour: number
  ): Promise<PredictionResult> {
    const cacheKey = `${restaurantId}_${date.toISOString().split('T')[0]}_${hour}`;
    
    // Verificar cache
    if (this.predictionCache.has(cacheKey)) {
      const cached = this.predictionCache.get(cacheKey)!;
      return {
        predictedOccupancy: cached.predictedOccupancy,
        confidenceScore: cached.confidenceScore,
        factors: cached.factors as PredictionFactors,
        recommendations: this.generateRecommendations(cached.predictedOccupancy, cached.factors as PredictionFactors)
      };
    }

    try {
      // Obtener datos históricos y patrones
      const [historicalData, patterns, externalFactors] = await Promise.all([
        this.getHistoricalData(restaurantId, 30),
        this.analyzePatterns(restaurantId),
        this.getExternalFactors(date)
      ]);

      // Calcular predicción base
      const basePrediction = this.calculateBasePrediction(patterns, hour, externalFactors.dayOfWeek);
      
      // Aplicar factores externos
      const adjustedPrediction = this.applyExternalFactors(
        basePrediction,
        externalFactors,
        patterns
      );

      // Calcular confianza
      const confidenceScore = this.calculateConfidence(historicalData, patterns);

      // Crear factores de predicción
      const factors: PredictionFactors = {
        dayOfWeek: externalFactors.dayOfWeek,
        hour,
        seasonality: externalFactors.seasonality,
        historicalAverage: patterns.hourlyAverages.get(hour) || 0,
        recentTrend: patterns.weeklyTrend,
        specialEvents: externalFactors.specialEvents,
        weather: externalFactors.weather
      };

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(adjustedPrediction, factors);

      // Guardar en cache
      const prediction: OccupancyPrediction = {
        id: '',
        restaurantId,
        predictionDate: date.toISOString().split('T')[0],
        predictionHour: hour,
        predictedOccupancy: adjustedPrediction,
        confidenceScore,
        factors,
        createdAt: new Date()
      };

      this.predictionCache.set(cacheKey, prediction);

      // Guardar en base de datos
      await productionDb.createOccupancyPrediction(prediction);

      return {
        predictedOccupancy: adjustedPrediction,
        confidenceScore,
        factors,
        recommendations
      };

    } catch (error) {
      logger.error('Error generating occupancy prediction', error);
      throw error;
    }
  }

  // Calcular predicción base
  private calculateBasePrediction(
    patterns: any,
    hour: number,
    dayOfWeek: string
  ): number {
    const hourlyAvg = patterns.hourlyAverages.get(hour) || 0;
    const dailyAvg = patterns.dailyAverages.get(dayOfWeek) || 0;
    
    // Promedio ponderado
    return (hourlyAvg * 0.7) + (dailyAvg * 0.3);
  }

  // Aplicar factores externos
  private applyExternalFactors(
    basePrediction: number,
    externalFactors: any,
    patterns: any
  ): number {
    let adjusted = basePrediction;

    // Aplicar estacionalidad
    adjusted *= externalFactors.seasonality;

    // Aplicar eventos especiales
    if (externalFactors.specialEvents.includes('Fin de semana')) {
      adjusted *= 1.2;
    }
    
    if (externalFactors.specialEvents.some((event: string) => 
      ['Año Nuevo', 'Navidad', 'Reyes'].includes(event)
    )) {
      adjusted *= 1.5;
    }

    // Aplicar tendencia reciente
    adjusted += patterns.weeklyTrend;

    // Limitar entre 0 y 100
    return Math.max(0, Math.min(100, adjusted));
  }

  // Calcular confianza
  private calculateConfidence(historicalData: HistoricalData[], patterns: any): number {
    if (historicalData.length === 0) return 0.3;

    // Base de confianza según cantidad de datos
    let confidence = Math.min(0.9, 0.3 + (historicalData.length / 100));

    // Reducir confianza si hay mucha variabilidad
    const hourlyVariances = new Map<number, number[]>();
    
    for (const data of historicalData) {
      if (!hourlyVariances.has(data.hour)) {
        hourlyVariances.set(data.hour, []);
      }
      hourlyVariances.get(data.hour)!.push(data.occupancyRate);
    }

    let totalVariance = 0;
    let varianceCount = 0;

    for (const [hour, values] of hourlyVariances.entries()) {
      if (values.length > 1) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        totalVariance += variance;
        varianceCount++;
      }
    }

    if (varianceCount > 0) {
      const avgVariance = totalVariance / varianceCount;
      confidence -= Math.min(0.3, avgVariance / 1000);
    }

    return Math.max(0.1, confidence);
  }

  // Generar recomendaciones
  private generateRecommendations(predictedOccupancy: number, factors: PredictionFactors): string[] {
    const recommendations: string[] = [];

    if (predictedOccupancy > 80) {
      recommendations.push('Alta ocupación esperada - considera aumentar personal');
      recommendations.push('Recomienda reservas con anticipación');
    } else if (predictedOccupancy < 30) {
      recommendations.push('Baja ocupación esperada - considera promociones');
      recommendations.push('Ideal para mantenimiento o capacitación');
    }

    if (factors.specialEvents.length > 0) {
      recommendations.push(`Eventos especiales: ${factors.specialEvents.join(', ')}`);
    }

    if (factors.recentTrend > 5) {
      recommendations.push('Tendencia creciente de ocupación');
    } else if (factors.recentTrend < -5) {
      recommendations.push('Tendencia decreciente de ocupación');
    }

    return recommendations;
  }

  // Obtener predicciones para un rango de fechas
  async getPredictionsForDateRange(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<OccupancyPrediction[]> {
    const predictions: OccupancyPrediction[] = [];
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      for (let hour = 12; hour <= 23; hour++) {
        try {
          const result = await this.predictOccupancy(restaurantId, currentDate, hour);
          
          predictions.push({
            id: '',
            restaurantId,
            predictionDate: currentDate.toISOString().split('T')[0],
            predictionHour: hour,
            predictedOccupancy: result.predictedOccupancy,
            confidenceScore: result.confidenceScore,
            factors: result.factors,
            createdAt: new Date()
          });
        } catch (error) {
          logger.error(`Error predicting for ${currentDate} ${hour}:00`, error);
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return predictions;
  }

  // Limpiar cache
  clearCache() {
    this.historicalData.clear();
    this.predictionCache.clear();
    logger.info('Prediction cache cleared');
  }
}

// Instancia singleton
export const occupancyPredictor = new OccupancyPredictor();
export default occupancyPredictor;
