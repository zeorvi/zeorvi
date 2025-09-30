import { logger } from '@/lib/logger';
import { Restaurant, Call, Reservation, Order, Incident, AIInsight, Report } from '@/lib/types/restaurant';

interface RetellConfig {
  apiKey: string;
  baseUrl: string;
}

interface RetellCallRequest {
  agent_id: string;
  to_number: string;
  from_number: string;
  metadata?: Record<string, any>;
}

interface RetellCallResponse {
  call_id: string;
  status: string;
  message?: string;
}

interface RetellWebhookPayload {
  event: string;
  call_id: string;
  agent_id: string;
  transcript?: string;
  summary?: string;
  metadata?: Record<string, any>;
  duration?: number;
  status?: string;
}

export class AIAgentService {
  private retellConfig: RetellConfig;

  constructor() {
    this.retellConfig = {
      apiKey: process.env.RETELL_API_KEY || '',
      baseUrl: process.env.RETELL_BASE_URL || 'https://api.retellai.com'
    };
  }

  // Gestión de agentes IA por restaurante
  async createAgentForRestaurant(restaurant: Restaurant): Promise<string> {
    try {
      const agentConfig = {
        name: `${restaurant.name} AI Assistant`,
        voice_settings: restaurant.aiAgent.voiceSettings,
        language: restaurant.aiAgent.language,
        personality: restaurant.aiAgent.personality,
        instructions: [
          `Eres el asistente virtual de ${restaurant.name}, un ${restaurant.type}.`,
          `Tu trabajo es atender llamadas, gestionar reservas y ayudar a los clientes.`,
          `El restaurante está ubicado en ${restaurant.address}.`,
          `Teléfono: ${restaurant.phone}`,
          `Horarios: ${this.formatOperatingHours(restaurant.operatingHours)}`,
          ...restaurant.aiAgent.customInstructions
        ].join('\n'),
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
        functions: this.getAgentFunctions()
      };

      const response = await fetch(`${this.retellConfig.baseUrl}/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.retellConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(agentConfig)
      });

      if (!response.ok) {
        throw new Error(`Failed to create agent: ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('AI Agent created for restaurant', { 
        restaurantId: restaurant.id, 
        agentId: result.agent_id 
      });

      return result.agent_id;
    } catch (error) {
      logger.error('Error creating AI agent', { 
        restaurantId: restaurant.id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // Realizar llamada saliente
  async makeOutboundCall(
    restaurantId: string, 
    agentId: string, 
    toNumber: string, 
    purpose: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const restaurant = await this.getRestaurant(restaurantId);
      
      const callRequest: RetellCallRequest = {
        agent_id: agentId,
        to_number: toNumber,
        from_number: restaurant.aiAgent.phoneNumber,
        metadata: {
          purpose,
          restaurantId,
          ...metadata
        }
      };

      const response = await fetch(`${this.retellConfig.baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.retellConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to make call: ${response.statusText}`);
      }

      const result: RetellCallResponse = await response.json();
      
      // Registrar la llamada en la base de datos
      await this.logCall({
        id: result.call_id,
        restaurantId,
        retellCallId: result.call_id,
        direction: 'outbound',
        fromNumber: restaurant.aiAgent.phoneNumber,
        toNumber,
        status: 'in_progress',
        duration: 0,
        startTime: new Date().toISOString(),
        purpose: purpose as any,
        outcome: 'successful',
        actionItems: [],
        cost: 0,
        createdAt: new Date().toISOString(),
        tags: [purpose]
      });

      logger.info('Outbound call initiated', { 
        restaurantId, 
        callId: result.call_id, 
        purpose 
      });

      return result.call_id;
    } catch (error) {
      logger.error('Error making outbound call', { 
        restaurantId, 
        toNumber, 
        purpose, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // Procesar webhook de Retell
  async processWebhook(payload: RetellWebhookPayload): Promise<void> {
    try {
      logger.info('Processing Retell webhook', { 
        event: payload.event, 
        callId: payload.call_id 
      });

      switch (payload.event) {
        case 'call_started':
          await this.handleCallStarted(payload);
          break;
        case 'call_ended':
          await this.handleCallEnded(payload);
          break;
        case 'call_analyzed':
          await this.handleCallAnalyzed(payload);
          break;
        case 'function_called':
          await this.handleFunctionCalled(payload);
          break;
        default:
          logger.warn('Unknown webhook event', { event: payload.event });
      }
    } catch (error) {
      logger.error('Error processing webhook', { 
        payload, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // Generar insights automáticos
  async generateInsights(restaurantId: string, dateRange: { from: string; to: string }): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      
      // Analizar patrones de llamadas
      const callInsights = await this.analyzeCallPatterns(restaurantId, dateRange);
      insights.push(...callInsights);
      
      // Analizar patrones de reservas
      const reservationInsights = await this.analyzeReservationPatterns(restaurantId, dateRange);
      insights.push(...reservationInsights);
      
      // Analizar satisfacción del cliente
      const customerInsights = await this.analyzeCustomerSatisfaction(restaurantId, dateRange);
      insights.push(...customerInsights);
      
      // Analizar eficiencia operativa
      const operationalInsights = await this.analyzeOperationalEfficiency(restaurantId, dateRange);
      insights.push(...operationalInsights);

      logger.info('AI insights generated', { 
        restaurantId, 
        insightCount: insights.length 
      });

      return insights;
    } catch (error) {
      logger.error('Error generating insights', { 
        restaurantId, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // Generar reporte automático
  async generateReport(
    restaurantId: string, 
    type: 'daily' | 'weekly' | 'monthly', 
    period?: { from: string; to: string }
  ): Promise<Report> {
    try {
      const reportPeriod = period || this.getDefaultPeriod(type);
      
      // Recopilar métricas
      const metrics = await this.gatherMetrics(restaurantId, reportPeriod);
      
      // Generar insights
      const insights = await this.generateInsights(restaurantId, reportPeriod);
      
      // Generar recomendaciones
      const recommendations = await this.generateRecommendations(restaurantId, metrics, insights);

      const report: Report = {
        id: `report_${Date.now()}`,
        restaurantId,
        type,
        period: reportPeriod,
        metrics,
        insights: insights.map(i => i.description),
        recommendations,
        generatedAt: new Date().toISOString(),
        generatedBy: 'ai_agent',
        status: 'final'
      };

      logger.info('AI report generated', { 
        restaurantId, 
        reportType: type 
      });

      return report;
    } catch (error) {
      logger.error('Error generating report', { 
        restaurantId, 
        type, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  // Funciones de análisis privadas
  private async handleCallStarted(payload: RetellWebhookPayload): Promise<void> {
    // Actualizar estado de llamada en la base de datos
    await this.updateCallStatus(payload.call_id, 'in_progress');
  }

  private async handleCallEnded(payload: RetellWebhookPayload): Promise<void> {
    // Actualizar llamada con información final
    await this.updateCall(payload.call_id, {
      status: payload.status as any,
      duration: payload.duration || 0,
      endTime: new Date().toISOString()
    });
  }

  private async handleCallAnalyzed(payload: RetellWebhookPayload): Promise<void> {
    // Procesar transcript y summary
    if (payload.transcript || payload.summary) {
      await this.updateCall(payload.call_id, {
        transcript: payload.transcript,
        summary: payload.summary
      });
      
      // Extraer action items del summary
      const actionItems = this.extractActionItems(payload.summary || '');
      if (actionItems.length > 0) {
        await this.updateCall(payload.call_id, { actionItems });
      }
    }
  }

  private async handleFunctionCalled(payload: RetellWebhookPayload): Promise<void> {
    // Manejar llamadas a funciones específicas (reservas, cancelaciones, etc.)
    const { metadata } = payload;
    
    if (metadata?.function === 'create_reservation') {
      await this.createReservationFromCall(payload);
    } else if (metadata?.function === 'cancel_reservation') {
      await this.cancelReservationFromCall(payload);
    } else if (metadata?.function === 'check_availability') {
      await this.checkAvailabilityFromCall(payload);
    }
  }

  private async analyzeCallPatterns(restaurantId: string, dateRange: { from: string; to: string }): Promise<AIInsight[]> {
    // Analizar patrones en las llamadas (horarios pico, tipos de consultas, etc.)
    const insights: AIInsight[] = [];
    
    // Mock insight - en producción se haría análisis real de datos
    insights.push({
      id: `insight_calls_${Date.now()}`,
      restaurantId,
      type: 'customer_behavior',
      title: 'Patrón de llamadas en horarios pico',
      description: 'Se detecta un aumento del 40% en llamadas entre 19:00-21:00. Considerar aumentar personal.',
      data: { peakHours: ['19:00', '20:00', '21:00'], increasePercentage: 40 },
      recommendations: [
        'Asignar personal adicional en horarios pico',
        'Implementar sistema de colas telefónicas',
        'Promocionar reservas online para reducir llamadas'
      ],
      priority: 'medium',
      confidence: 85,
      dateRange,
      status: 'new',
      createdAt: new Date().toISOString()
    });
    
    return insights;
  }

  private async analyzeReservationPatterns(restaurantId: string, dateRange: { from: string; to: string }): Promise<AIInsight[]> {
    // Análisis de patrones de reservas
    const insights: AIInsight[] = [];
    
    insights.push({
      id: `insight_reservations_${Date.now()}`,
      restaurantId,
      type: 'sales_pattern',
      title: 'Oportunidad de optimización de mesas',
      description: 'Las mesas de 4 personas tienen 30% más demanda que disponibilidad los fines de semana.',
      data: { tableSize: 4, demandIncrease: 30, days: ['friday', 'saturday', 'sunday'] },
      recommendations: [
        'Considerar reconfigurar algunas mesas de 6 a 4 personas',
        'Implementar política de tiempo límite en mesas populares',
        'Ofrecer descuentos para horarios menos populares'
      ],
      priority: 'high',
      confidence: 92,
      dateRange,
      status: 'new',
      createdAt: new Date().toISOString()
    });
    
    return insights;
  }

  private async analyzeCustomerSatisfaction(restaurantId: string, dateRange: { from: string; to: string }): Promise<AIInsight[]> {
    // Análisis de satisfacción del cliente
    const insights: AIInsight[] = [];
    
    insights.push({
      id: `insight_satisfaction_${Date.now()}`,
      restaurantId,
      type: 'customer_behavior',
      title: 'Mejora en satisfacción del cliente',
      description: 'La calificación promedio ha aumentado de 4.2 a 4.6 tras implementar el asistente IA.',
      data: { previousRating: 4.2, currentRating: 4.6, improvement: 0.4 },
      recommendations: [
        'Continuar utilizando el asistente IA para todas las llamadas',
        'Implementar seguimiento post-visita automatizado',
        'Crear programa de fidelización basado en satisfacción'
      ],
      priority: 'medium',
      confidence: 88,
      dateRange,
      status: 'new',
      createdAt: new Date().toISOString()
    });
    
    return insights;
  }

  private async analyzeOperationalEfficiency(restaurantId: string, dateRange: { from: string; to: string }): Promise<AIInsight[]> {
    // Análisis de eficiencia operativa
    const insights: AIInsight[] = [];
    
    insights.push({
      id: `insight_efficiency_${Date.now()}`,
      restaurantId,
      type: 'operational_efficiency',
      title: 'Reducción en tiempo de gestión de reservas',
      description: 'El asistente IA ha reducido el tiempo promedio de gestión de reservas en 60%.',
      data: { timeReduction: 60, previousAverage: 5, currentAverage: 2 },
      recommendations: [
        'Expandir automatización a cancelaciones y modificaciones',
        'Implementar confirmación automática de reservas',
        'Crear dashboard de métricas operativas'
      ],
      priority: 'low',
      confidence: 95,
      dateRange,
      status: 'new',
      createdAt: new Date().toISOString()
    });
    
    return insights;
  }

  private async gatherMetrics(restaurantId: string, period: { from: string; to: string }): Promise<any> {
    // Mock metrics - en producción se consultaría la base de datos real
    return {
      sales: {
        total: 15750,
        orders: 125,
        averageOrderValue: 126,
        topItems: [
          { name: 'Pizza Margherita', quantity: 45, revenue: 2250 },
          { name: 'Pasta Carbonara', quantity: 38, revenue: 1900 },
          { name: 'Ensalada César', quantity: 32, revenue: 960 }
        ]
      },
      operations: {
        callsReceived: 89,
        callsAnswered: 85,
        reservations: 67,
        cancellations: 8,
        noShows: 3,
        tableOccupancy: 78
      },
      customers: {
        newClients: 23,
        returningClients: 44,
        averageRating: 4.6,
        complaints: 2,
        compliments: 15
      },
      staff: {
        hoursWorked: 320,
        attendance: 96,
        productivity: 89
      },
      inventory: {
        itemsLowStock: 5,
        itemsOutOfStock: 1,
        wasteAmount: 45,
        costOfGoods: 4725
      }
    };
  }

  private async generateRecommendations(restaurantId: string, metrics: any, insights: AIInsight[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Recomendaciones basadas en métricas
    if (metrics.operations.tableOccupancy > 85) {
      recommendations.push('Considerar expandir capacidad o implementar sistema de turnos');
    }
    
    if (metrics.customers.averageRating < 4.0) {
      recommendations.push('Implementar programa de mejora de calidad del servicio');
    }
    
    if (metrics.inventory.itemsOutOfStock > 0) {
      recommendations.push('Revisar sistema de reabastecimiento automático');
    }
    
    // Recomendaciones basadas en insights
    insights.forEach(insight => {
      if (insight.priority === 'high') {
        recommendations.push(`PRIORITARIO: ${insight.recommendations[0]}`);
      }
    });
    
    return recommendations;
  }

  private getDefaultPeriod(type: 'daily' | 'weekly' | 'monthly'): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString();
    
    let from: Date;
    switch (type) {
      case 'daily':
        from = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        from = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        from = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }
    
    return { from: from.toISOString(), to };
  }

  private formatOperatingHours(hours: Restaurant['operatingHours']): string {
    return Object.entries(hours)
      .map(([day, schedule]) => {
        if (schedule.closed) return `${day}: Cerrado`;
        return `${day}: ${schedule.open} - ${schedule.close}`;
      })
      .join(', ');
  }

  private getAgentFunctions(): any[] {
    return [
      {
        name: 'create_reservation',
        description: 'Crear una nueva reserva',
        parameters: {
          type: 'object',
          properties: {
            clientName: { type: 'string' },
            clientPhone: { type: 'string' },
            partySize: { type: 'number' },
            dateTime: { type: 'string' },
            specialRequests: { type: 'string' }
          },
          required: ['clientName', 'clientPhone', 'partySize', 'dateTime']
        }
      },
      {
        name: 'cancel_reservation',
        description: 'Cancelar una reserva existente',
        parameters: {
          type: 'object',
          properties: {
            reservationId: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['reservationId']
        }
      },
      {
        name: 'check_availability',
        description: 'Verificar disponibilidad de mesas',
        parameters: {
          type: 'object',
          properties: {
            dateTime: { type: 'string' },
            partySize: { type: 'number' }
          },
          required: ['dateTime', 'partySize']
        }
      }
    ];
  }

  // Métodos auxiliares (mock implementations)
  private async getRestaurant(restaurantId: string): Promise<Restaurant> {
    // Mock implementation - en producción consultaría la base de datos
    return {
      id: restaurantId,
      name: 'Restaurante Demo',
      type: 'restaurante',
      address: 'Calle Demo 123',
      phone: '+1234567890',
      email: 'demo@restaurant.com',
      aiAgent: {
        retellAgentId: 'agent_123',
        phoneNumber: '+1234567890',
        voiceSettings: { voice: 'es-ES-Standard-A', speed: 1.0, pitch: 0 },
        language: 'es',
        personality: 'Amigable y profesional',
        customInstructions: []
      },
      operatingHours: {},
      menu: { categories: [], specialOffers: [] },
      tables: [],
      staff: [],
      inventory: [],
      notifications: {
        whatsapp: true,
        email: true,
        sms: true,
        push: true,
        emailRecipients: []
      },
      settings: {
        timezone: 'America/Mexico_City',
        currency: 'MXN',
        taxRate: 16,
        serviceCharge: 10,
        reservationPolicy: '',
        cancellationPolicy: '',
        maxAdvanceBookingDays: 30,
        minAdvanceBookingHours: 2
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      status: 'active'
    };
  }

  private async logCall(call: Call): Promise<void> {
    // Mock implementation - en producción guardaría en la base de datos
    logger.info('Call logged', { callId: call.id });
  }

  private async updateCallStatus(callId: string, status: string): Promise<void> {
    // Mock implementation
    logger.info('Call status updated', { callId, status });
  }

  private async updateCall(callId: string, updates: Partial<Call>): Promise<void> {
    // Mock implementation
    logger.info('Call updated', { callId, updates });
  }

  private extractActionItems(summary: string): string[] {
    // Extraer action items del summary usando NLP básico
    const actionKeywords = ['reservar', 'cancelar', 'confirmar', 'llamar', 'enviar', 'programar'];
    const sentences = summary.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    return sentences.filter(sentence => 
      actionKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    );
  }

  private async createReservationFromCall(payload: RetellWebhookPayload): Promise<void> {
    // Mock implementation
    logger.info('Reservation created from call', { callId: payload.call_id });
  }

  private async cancelReservationFromCall(payload: RetellWebhookPayload): Promise<void> {
    // Mock implementation
    logger.info('Reservation cancelled from call', { callId: payload.call_id });
  }

  private async checkAvailabilityFromCall(payload: RetellWebhookPayload): Promise<void> {
    // Mock implementation
    logger.info('Availability checked from call', { callId: payload.call_id });
  }
}

export const aiAgentService = new AIAgentService();
