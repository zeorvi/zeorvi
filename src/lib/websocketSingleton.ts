/**
 * WebSocket Singleton para evitar múltiples instancias
 * Este archivo asegura que solo haya un servidor WebSocket en toda la aplicación
 * 
 * NOTA: WebSocket no funciona en Vercel (serverless)
 * Este módulo solo se usa en desarrollo local o servidores con estado
 */

import type { Server as WebSocketServerType } from 'ws';

// Type alias para mantener compatibilidad
export type WebSocketServer = WebSocketServerType;

// Singleton global para el WebSocket server
let wss: WebSocketServerType | null = null;
let isInitializing = false;

export function getWebSocketServer(port: number = 8081): WebSocketServerType | null {
  // Si estamos en Vercel o entorno serverless, no crear WebSocket
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('⚠️  WebSocket no disponible en entorno serverless');
    return null;
  }

  // Si ya existe una instancia, retornarla
  if (wss) {
    return wss;
  }

  // Si ya se está inicializando, esperar
  if (isInitializing) {
    console.log('⏳ WebSocket ya se está inicializando...');
    return null;
  }

  try {
    isInitializing = true;

    // Importación dinámica para evitar errores en build
    const { Server } = require('ws');
    
    // Crear nueva instancia del WebSocket server
    wss = new Server({ 
      port,
      perMessageDeflate: false,
      clientTracking: true
    });

    console.log(`✅ WebSocket server iniciado en puerto ${port}`);

    // Manejar conexiones
    if (wss) {
      wss.on('connection', (ws: any) => {
      console.log('🔌 Nueva conexión WebSocket');

      ws.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('📨 Mensaje recibido:', data);
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 Conexión WebSocket cerrada');
      });

      ws.on('error', (error: any) => {
        console.error('❌ Error en WebSocket:', error);
      });
      });

      // Manejar errores del servidor
      wss.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Puerto ${port} ya está en uso, usando instancia existente`);
        wss = null;
      } else {
        console.error('❌ Error en WebSocket server:', error);
      }
      });
    }

    isInitializing = false;
    return wss;

  } catch (error: unknown) {
    isInitializing = false;
    const err = error as any;
    
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Puerto ${port} ya está en uso`);
      return null;
    }
    
    console.error('❌ Error creando WebSocket server:', error);
    return null;
  }
}

// Función para broadcast a todos los clientes conectados
export function broadcastToClients(data: unknown): void {
  if (!wss) {
    return;
  }

  const message = JSON.stringify(data);
  let clientCount = 0;

  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      clientCount++;
    }
  });

  if (clientCount > 0) {
    console.log(`📡 Mensaje broadcast a ${clientCount} cliente(s)`);
  }
}

// Función para cerrar el servidor (útil para testing)
export function closeWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
    console.log('🔌 WebSocket server cerrado');
  }
}
