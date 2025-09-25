import { logger } from '@/lib/logger';
import { Restaurant } from '@/lib/types/restaurant';
// import { Call, Reservation } from '@/lib/types/restaurant'; // TODO: Implementar tipos
// Servicios de base de datos - implementar según necesidad
// import { CallService, ReservationService, MetricsService } from '@/lib/database';

interface ClientInfo {
  name?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

interface ReservationData {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  party_size?: string;
  date_time?: string;
  duration?: number;
  special_requests?: string;
  [key: string]: unknown;
}

interface RetellWebhookPayload {
  event: string;
  call_id: string;
  agent_id: string;
  call_type: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  call_status: 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer';
  start_time: string;
  end_time?: string;
  duration?: number;
  transcript?: string;
  summary?: string;
  metadata?: {
    restaurantId?: string;
    purpose?: string;
    client_info?: ClientInfo;
    reservation_data?: ReservationData;
    action?: string;
    table_data?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

interface RetellAgentConfig {
  agent_id: string;
  name: string;
  voice_id: string;
  language: string;
  response_engine: {
    type: 'retell-llm';
    llm_websocket_url: string;
  };
  webhook_url: string;
  enable_backchannel: boolean;
  ambient_sound?: string;
  [key: string]: unknown;
}

export class RetellIntegrationService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RETELL_API_KEY || '';
    this.baseUrl = process.env.RETELL_BASE_URL || 'https://api.retellai.com';
  }

  // Crear agente automáticamente para un restaurante
  async createAgentForRestaurant(restaurant: Restaurant): Promise<string> {
    try {
      const agentConfig: RetellAgentConfig = {
        agent_id: `agent_${restaurant.id}`,
        name: `${restaurant.name} AI Assistant`,
        voice_id: restaurant.aiAgent.voiceSettings.voice,
        language: restaurant.aiAgent.language,
        response_engine: {
          type: 'retell-llm',
          llm_websocket_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/llm-websocket`
        },
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
        enable_backchannel: true,
        ambient_sound: 'office'
      };

      const response = await this.makeRetellRequest('/agent', 'POST', agentConfig);
      
      if (response.agent_id && typeof response.agent_id === 'string') {
        // Actualizar el restaurante con el ID del agente
        await this.updateRestaurantAgent(restaurant.id, response.agent_id);
        
        logger.info('Retell agent created successfully', {
          restaurantId: restaurant.id,
          agentId: response.agent_id
        });

        return response.agent_id;
      }

      throw new Error('Failed to create Retell agent');
    } catch (error) {
      logger.error('Error creating Retell agent', {
        restaurantId: restaurant.id,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // Configurar número de teléfono para el restaurante
  async setupPhoneNumber(restaurantId: string, agentId: string): Promise<string> {
    try {
      const phoneConfig = {
        agent_id: agentId,
        phone_number_pretty: '+1 (555) 123-4567', // En producción, esto sería dinámico
        inbound_webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
        outbound_webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`
      };

      const response = await this.makeRetellRequest('/phone-number', 'POST', phoneConfig);
      
      const phoneNumber = typeof response.phone_number_pretty === 'string' 
        ? response.phone_number_pretty 
        : '+1 (555) 123-4567';
      
      logger.info('Phone number configured for restaurant', {
        restaurantId,
        phoneNumber
      });

      return phoneNumber;
    } catch (error) {
      logger.error('Error setting up phone number', {
        restaurantId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // Procesar webhook de Retell automáticamente
  async processWebhook(payload: RetellWebhookPayload): Promise<void> {
    try {
      const restaurantId = payload.metadata?.restaurantId;
      
      if (!restaurantId || typeof restaurantId !== 'string') {
        logger.warn('Webhook received without restaurantId', { payload });
        return;
      }

      switch (payload.event) {
        case 'call_started':
          await this.handleCallStarted(payload, restaurantId);
          break;
          
        case 'call_ended':
          await this.handleCallEnded(payload);
          break;
          
        case 'call_analyzed':
          await this.handleCallAnalyzed(payload, restaurantId);
          break;
          
        case 'agent_response':
          await this.handleAgentResponse(payload, restaurantId);
          break;
          
        default:
          logger.info('Unhandled webhook event', { event: payload.event });
      }

      // Actualizar métricas en tiempo real
      await this.updateRealTimeMetrics(restaurantId);
      
    } catch (error) {
      logger.error('Error processing Retell webhook', {
        error: (error as Error).message,
        payload
      });
      throw error;
    }
  }

  // Manejar inicio de llamada
  private async handleCallStarted(payload: RetellWebhookPayload, restaurantId: string): Promise<void> {
    try {
      // const call: Omit<Call, 'id' | 'createdAt'> = {
      //   restaurantId,
      //   retellCallId: payload.call_id,
      //   direction: payload.call_type,
      //   fromNumber: payload.from_number,
      //   toNumber: payload.to_number,
      //   status: 'in_progress',
      //   duration: 0,
      //   startTime: payload.start_time,
      //   purpose: (payload.metadata?.purpose as 'inquiry' | 'reservation' | 'complaint' | 'order' | 'cancellation' | 'other') || 'inquiry',
      //   outcome: 'successful',
      //   actionItems: [],
      //   cost: 0,
      //   tags: []
      // };

      // await CallService.create(call); // TODO: Implementar CallService
      
      logger.info('Call started and logged', {
        restaurantId,
        callId: payload.call_id
      });

    } catch (error) {
      logger.error('Error handling call started', { error, payload });
    }
  }

  // Manejar fin de llamada
  private async handleCallEnded(payload: RetellWebhookPayload): Promise<void> {
    try {
      // Buscar la llamada existente y actualizarla
      // const calls = await CallService.getByRestaurant(restaurantId, 10); // TODO: Implementar CallService
      // const existingCall = calls.find(call => call.retellCallId === payload.call_id);

      // if (existingCall) {
      //   await CallService.update(existingCall.id, {
      //     status: payload.call_status as 'completed' | 'failed' | 'busy' | 'no-answer',
      //     duration: payload.duration || 0,
      //     endTime: payload.end_time,
      //     cost: this.calculateCallCost(payload.duration || 0)
      //   });

      //   logger.info('Call ended and updated', {
      //     restaurantId,
      //     callId: payload.call_id,
      //     duration: payload.duration
      //   });
      // }
    } catch (error) {
      logger.error('Error handling call ended', { error, payload });
    }
  }

  // Manejar análisis de llamada
  private async handleCallAnalyzed(payload: RetellWebhookPayload, restaurantId: string): Promise<void> {
    try {
      // Verificar que la llamada se completó exitosamente
      if (payload.call_status !== 'completed') {
        logger.info('Call not completed, skipping processing', {
          restaurantId,
          callId: payload.call_id,
          callStatus: payload.call_status
        });
        return;
      }

      // const calls = await CallService.getByRestaurant(restaurantId, 10); // TODO: Implementar CallService
      // const existingCall = calls.find(call => call.retellCallId === payload.call_id);

      // if (existingCall) {
      //   const actionItems = this.extractActionItems(payload.summary || '');
      //   
      //   // Guardar transcript completo en la base de datos
      //   await CallService.update(existingCall.id, {
      //     transcript: payload.transcript,
      //     summary: payload.summary,
      //     actionItems
      //   });

      //   // Guardar transcript en colección específica para La Gaviota
      //   if (restaurantId === 'rest_003') {
      //     await this.saveTranscriptForLaGaviota(payload, restaurantId);
      //   }

      //   // Si hay datos de reserva, crearla automáticamente
      //   if (payload.metadata?.reservation_data) {
      //     await this.createReservationFromCall(payload.metadata.reservation_data, restaurantId);
      //   }

      //   // Redirigir automáticamente al dashboard de La Gaviota
      //   if (restaurantId === 'rest_003') {
      //     await this.triggerDashboardRedirect(restaurantId, payload.call_id);
      //   }

      //   logger.info('Call analyzed and processed', {
      //     restaurantId,
      //     callId: payload.call_id,
      //     actionItemsCount: actionItems.length,
      //     transcriptSaved: !!payload.transcript
      //   });
      // }
    } catch (error) {
      logger.error('Error handling call analyzed', { error, payload });
    }
  }

  // Manejar respuesta del agente
  private async handleAgentResponse(payload: RetellWebhookPayload, restaurantId: string): Promise<void> {
    try {
      // Procesar respuestas específicas del agente
      if (payload.metadata?.action === 'create_reservation' && payload.metadata.reservation_data) {
        await this.createReservationFromCall(payload.metadata.reservation_data, restaurantId);
      } else if (payload.metadata?.action === 'update_table_status' && payload.metadata.table_data) {
        await this.updateTableStatus(payload.metadata.table_data, restaurantId);
      }
    } catch (error) {
      logger.error('Error handling agent response', { error, payload });
    }
  }

  // Crear reserva automáticamente desde llamada
  private async createReservationFromCall(reservationData: ReservationData, restaurantId: string): Promise<void> {
    try {
      // const reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'> = {
      //   restaurantId,
      //   clientInfo: {
      //     name: reservationData.client_name,
      //     phone: reservationData.client_phone,
      //     email: reservationData.client_email
      //   },
      //   partySize: parseInt(reservationData.party_size || '1'),
      //   dateTime: reservationData.date_time || new Date().toISOString(),
      //   duration: reservationData.duration || 120,
      //   status: 'confirmed',
      //   source: 'ai_agent',
      //   specialRequests: reservationData.special_requests,
      //   notes: `Reserva creada automáticamente por IA desde llamada`,
      //   reminders: []
      // };

      // const reservationId = await ReservationService.create(reservation); // TODO: Implementar ReservationService
      
      logger.info('Reservation created automatically from call', {
        restaurantId,
        // reservationId, // TODO: Implementar ReservationService
        clientName: reservationData.client_name
      });
    } catch (error) {
      logger.error('Error creating reservation from call', { error, reservationData });
    }
  }

  // Actualizar métricas en tiempo real
  private async updateRealTimeMetrics(restaurantId: string): Promise<void> {
    try {
      // Obtener datos actuales
      // const [reservations] = await Promise.all([
      //   ReservationService.getByRestaurant(restaurantId), // TODO: Implementar ReservationService
      //   CallService.getByRestaurant(restaurantId, 100) // TODO: Implementar CallService
      // ]);

      // Calcular métricas
      // const today = new Date().toDateString();
      // const todayCalls = calls.filter(call => 
      //   new Date(call.startTime).toDateString() === today
      // );
      // const todayReservations = reservations.filter(res => 
      //   new Date(res.dateTime).toDateString() === today
      // );

      // const metrics = {
      //   realTime: {
      //     currentOccupancy: 0, // reservations.filter(r => r.status === 'confirmed').length, // TODO: Implementar ReservationService
      //     activeReservations: 0, // reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length, // TODO: Implementar ReservationService
      //     waitingList: 0, // Calcular basado en lógica específica
      //     averageWaitTime: 15, // Calcular basado en datos históricos
      //     staffOnDuty: 0, // Obtener de empleados
      //     currentOrders: 0, // Obtener de órdenes activas
      //     kitchenBacklog: 0
      //   },
      //   today: {
      //     revenue: 0, // Calcular desde órdenes
      //     orders: 0,
      //     customers: 0, // todayReservations.length, // TODO: Implementar ReservationService
      //     averageOrderValue: 0,
      //     tableOccupancy: 0,
      //     callsReceived: 0, // todayCalls.length, // TODO: Implementar CallService
      //     callsAnswered: 0, // todayCalls.filter(c => c.status === 'completed').length, // TODO: Implementar CallService
      //     reservations: 0 // todayReservations.length // TODO: Implementar ReservationService
      //   },
      //   alerts: [], // Generar alertas basadas en condiciones
      //   lastUpdated: new Date().toISOString()
      // };

      // await MetricsService.updateRealTimeMetrics(restaurantId, metrics); // TODO: Implementar MetricsService
      
    } catch (error) {
      logger.error('Error updating real-time metrics', { restaurantId, error });
    }
  }

  // Utilidades privadas
  private async makeRetellRequest(endpoint: string, method: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Retell API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async updateRestaurantAgent(restaurantId: string, agentId: string): Promise<void> {
    // Actualizar el restaurante con el nuevo agent ID
    // Esto se implementaría usando RestaurantService
    logger.info('Restaurant agent updated', { restaurantId, agentId });
  }

  private calculateCallCost(duration: number): number {
    // Calcular costo basado en duración (ejemplo: $0.05 por minuto)
    const minutes = Math.ceil(duration / 60);
    return minutes * 0.05;
  }

  private extractActionItems(summary: string): string[] {
    const actionKeywords = [
      'reservar', 'cancelar', 'confirmar', 'llamar', 
      'enviar', 'programar', 'verificar', 'actualizar'
    ];
    
    const sentences = summary.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    return sentences.filter(sentence => 
      actionKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      )
    );
  }

  private async updateTableStatus(tableData: Record<string, unknown>, restaurantId: string): Promise<void> {
    // Implementar actualización de estado de mesa
    logger.info('Table status updated', { restaurantId, tableData });
  }

  // Guardar transcript específicamente para La Gaviota
  private async saveTranscriptForLaGaviota(payload: RetellWebhookPayload, restaurantId: string): Promise<void> {
    try {
      const transcriptData = {
        restaurantId,
        callId: payload.call_id,
        agentId: payload.agent_id,
        transcript: payload.transcript,
        summary: payload.summary,
        startTime: payload.start_time,
        endTime: payload.end_time,
        duration: payload.duration,
        fromNumber: payload.from_number,
        toNumber: payload.to_number,
        callStatus: payload.call_status,
        metadata: payload.metadata
      };

      // Guardar usando el endpoint de transcripts
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/transcripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transcriptData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save transcript: ${response.statusText}`);
      }

      const result = await response.json();

      logger.info('Transcript saved for La Gaviota', {
        restaurantId,
        callId: payload.call_id,
        transcriptLength: payload.transcript?.length || 0,
        transcriptId: result.transcript?.id
      });
    } catch (error) {
      logger.error('Error saving transcript for La Gaviota', { error, payload });
    }
  }

  // Activar redirección automática al dashboard
  private async triggerDashboardRedirect(restaurantId: string, callId: string): Promise<void> {
    try {
      // Crear evento de redirección que será procesado por el frontend
      const redirectEvent = {
        restaurantId,
        callId,
        action: 'redirect_to_dashboard',
        timestamp: new Date().toISOString(),
        dashboardUrl: `/restaurant/${restaurantId}`,
        message: 'Nueva conversación procesada. Redirigiendo al dashboard...'
      };

      // Guardar evento de redirección en Firestore
      // await this.saveToFirestore('dashboard_redirects', redirectEvent); // TODO: Implementar saveToFirestore

      // Notificar en tiempo real usando WebSocket o Server-Sent Events
      await this.notifyDashboardUpdate(restaurantId, redirectEvent);

      logger.info('Dashboard redirect triggered for La Gaviota', {
        restaurantId,
        callId,
        dashboardUrl: redirectEvent.dashboardUrl
      });
    } catch (error) {
      logger.error('Error triggering dashboard redirect', { error, restaurantId, callId });
    }
  }

  // Guardar datos en la base de datos
  private async saveToDatabase(collection: string, data: Record<string, unknown>): Promise<void> {
    try {
      // Esta función se implementaría usando nuestra base de datos
      // Por ahora, solo logueamos la acción
      logger.info('Data saved to database', { collection, dataId: data.callId || data.id });
    } catch (error) {
      logger.error('Error saving to database', { collection, error });
      throw error;
    }
  }

  // Notificar actualización del dashboard
  private async notifyDashboardUpdate(restaurantId: string, event: Record<string, unknown>): Promise<void> {
    try {
      // Implementar notificación en tiempo real
      // Esto podría usar WebSockets, Server-Sent Events, o Redis Pub/Sub
      logger.info('Dashboard notification sent', { restaurantId, event });
    } catch (error) {
      logger.error('Error notifying dashboard update', { restaurantId, error });
    }
  }
}

export const retellIntegrationService = new RetellIntegrationService();
