import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { NextApiRequest } from 'next';
import { realtimeService } from '@/lib/realtimeService';

// Declarar el tipo para global.wss
declare global {
  var wss: WebSocketServer | undefined;
}

// Handler para WebSocket
export default function handler(req: NextApiRequest, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar si ya hay un servidor WebSocket
  if (!global.wss) {
    const server = res.socket?.server;
    if (server) {
      global.wss = new WebSocketServer({ 
        server,
        path: '/ws',
        perMessageDeflate: false
      });

      // Configurar el servicio de tiempo real
      realtimeService.initialize(server);
      
      console.log('🔌 WebSocket server initialized');
    }
  }

  res.status(200).json({ message: 'WebSocket server ready' });
}

// Configurar el servidor para manejar WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
};
