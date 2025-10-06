import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '@/lib/logger';
import { productionDb } from './database/production';

// Tipos para WebSocket
interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'update' | 'error';
  restaurantId?: string;
  data?: any;
  timestamp?: string;
}

interface RestaurantSubscriber {
  ws: WebSocket;
  restaurantId: string;
  userId?: string;
  lastPing: number;
}

class RealtimeService {
  private wss: WebSocketServer | null = null;
  private subscribers: Map<string, RestaurantSubscriber[]> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupPingInterval();
  }

  // Inicializar servidor WebSocket
  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: false
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    logger.info('WebSocket server initialized');
  }

  // Manejar nueva conexión
  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    const clientId = this.generateClientId();
    logger.info(`New WebSocket connection: ${clientId}`);

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message, clientId);
      } catch (error) {
        logger.error('Error parsing WebSocket message', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });

    // Enviar mensaje de bienvenida
    this.sendMessage(ws, {
      type: 'update',
      data: { message: 'Connected to realtime service' },
      timestamp: new Date().toISOString()
    });
  }

  // Manejar mensajes del cliente
  private handleMessage(ws: WebSocket, message: WebSocketMessage, clientId: string) {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(ws, message, clientId);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscribe(ws, message, clientId);
        break;
      
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  // Suscribir a actualizaciones de un restaurante
  private handleSubscribe(ws: WebSocket, message: WebSocketMessage, clientId: string) {
    if (!message.restaurantId) {
      this.sendError(ws, 'restaurantId is required for subscription');
      return;
    }

    const subscriber: RestaurantSubscriber = {
      ws,
      restaurantId: message.restaurantId,
      userId: message.data?.userId,
      lastPing: Date.now()
    };

    // Añadir a la lista de suscriptores
    if (!this.subscribers.has(message.restaurantId)) {
      this.subscribers.set(message.restaurantId, []);
    }
    
    this.subscribers.get(message.restaurantId)!.push(subscriber);

    logger.info(`Client ${clientId} subscribed to restaurant ${message.restaurantId}`);
    
    // Enviar estado actual del restaurante
    this.sendCurrentState(message.restaurantId, ws);
  }

  // Desuscribir de actualizaciones
  private handleUnsubscribe(ws: WebSocket, message: WebSocketMessage, clientId: string) {
    if (!message.restaurantId) {
      this.sendError(ws, 'restaurantId is required for unsubscription');
      return;
    }

    const subscribers = this.subscribers.get(message.restaurantId);
    if (subscribers) {
      const index = subscribers.findIndex(sub => sub.ws === ws);
      if (index !== -1) {
        subscribers.splice(index, 1);
        logger.info(`Client ${clientId} unsubscribed from restaurant ${message.restaurantId}`);
      }
    }
  }

  // Manejar desconexión
  private handleDisconnection(clientId: string) {
    logger.info(`WebSocket client disconnected: ${clientId}`);
    
    // Remover de todas las suscripciones
    for (const [restaurantId, subscribers] of this.subscribers.entries()) {
      const index = subscribers.findIndex(sub => 
        sub.ws.readyState === WebSocket.CLOSED || sub.ws.readyState === WebSocket.CLOSING
      );
      
      if (index !== -1) {
        subscribers.splice(index, 1);
        logger.info(`Removed disconnected client from restaurant ${restaurantId}`);
      }
    }
  }

  // Enviar actualización a todos los suscriptores de un restaurante
  async broadcastToRestaurant(restaurantId: string, eventType: string, data: any) {
    const subscribers = this.subscribers.get(restaurantId);
    if (!subscribers || subscribers.length === 0) {
      return;
    }

    const message: WebSocketMessage = {
      type: 'update',
      data: {
        eventType,
        ...data
      },
      timestamp: new Date().toISOString()
    };

    // Enviar a todos los suscriptores activos
    const activeSubscribers = subscribers.filter(sub => 
      sub.ws.readyState === WebSocket.OPEN
    );

    for (const subscriber of activeSubscribers) {
      try {
        this.sendMessage(subscriber.ws, message);
      } catch (error) {
        logger.error('Error sending message to subscriber', error);
      }
    }

    logger.info(`Broadcasted ${eventType} to ${activeSubscribers.length} subscribers for restaurant ${restaurantId}`);
  }

  // Enviar estado actual del restaurante
  private async sendCurrentState(restaurantId: string, ws: WebSocket) {
    try {
      const [tableStates, metrics, schedule] = await Promise.all([
        productionDb.getTableStates(restaurantId),
        productionDb.getCurrentMetrics(restaurantId),
        productionDb.getRestaurantSchedule(restaurantId)
      ]);

      this.sendMessage(ws, {
        type: 'update',
        data: {
          eventType: 'initial_state',
          tableStates,
          metrics,
          schedule
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error sending current state', error);
      this.sendError(ws, 'Error loading restaurant state');
    }
  }

  // Enviar mensaje a un WebSocket específico
  private sendMessage(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Enviar error a un WebSocket específico
  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      data: { error },
      timestamp: new Date().toISOString()
    });
  }

  // Generar ID único para cliente
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configurar ping para mantener conexiones vivas
  private setupPingInterval() {
    this.pingInterval = setInterval(() => {
      this.pingSubscribers();
    }, 30000); // Ping cada 30 segundos
  }

  // Ping a todos los suscriptores
  private pingSubscribers() {
    for (const [restaurantId, subscribers] of this.subscribers.entries()) {
      const activeSubscribers = subscribers.filter(sub => 
        sub.ws.readyState === WebSocket.OPEN
      );

      for (const subscriber of activeSubscribers) {
        try {
          subscriber.ws.ping();
          subscriber.lastPing = Date.now();
        } catch (error) {
          logger.error('Error pinging subscriber', error);
        }
      }

      // Remover suscriptores inactivos (no responden por más de 2 minutos)
      const now = Date.now();
      const inactiveSubscribers = activeSubscribers.filter(sub => 
        now - sub.lastPing > 120000
      );

      if (inactiveSubscribers.length > 0) {
        logger.info(`Removing ${inactiveSubscribers.length} inactive subscribers for restaurant ${restaurantId}`);
        this.subscribers.set(restaurantId, 
          subscribers.filter(sub => !inactiveSubscribers.includes(sub))
        );
      }
    }
  }

  // Obtener estadísticas del servicio
  getStats() {
    const stats = {
      totalSubscribers: 0,
      restaurants: 0,
      subscribersByRestaurant: {} as Record<string, number>
    };

    for (const [restaurantId, subscribers] of this.subscribers.entries()) {
      const activeSubscribers = subscribers.filter(sub => 
        sub.ws.readyState === WebSocket.OPEN
      );
      
      stats.totalSubscribers += activeSubscribers.length;
      stats.restaurants++;
      stats.subscribersByRestaurant[restaurantId] = activeSubscribers.length;
    }

    return stats;
  }

  // Cerrar servicio
  close() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    logger.info('Realtime service closed');
  }
}

// Instancia singleton
export const realtimeService = new RealtimeService();
export default realtimeService;
