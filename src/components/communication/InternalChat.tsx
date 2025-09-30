'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'ai_agent' | 'manager' | 'waiter' | 'chef' | 'host' | 'cleaner';
  content: string;
  timestamp: string;
  type: 'text' | 'alert' | 'task' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  mentions?: string[];
  reactions?: { emoji: string; userId: string; userName: string }[];
  threadId?: string;
  edited?: boolean;
  editedAt?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'alerts' | 'tasks' | 'ai_reports' | 'private';
  participants: string[];
  unreadCount: number;
  lastMessage?: Message;
  muted: boolean;
}

interface InternalChatProps {
  restaurantId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}

export default function InternalChat({ 
  restaurantId, 
  currentUserId, 
  currentUserName, 
  currentUserRole 
}: InternalChatProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Mock data - en producción se conectaría a WebSocket/Firebase
  useEffect(() => {
    const mockChannels: ChatChannel[] = [
      {
        id: 'general',
        name: 'General',
        description: 'Canal principal para comunicación del equipo',
        type: 'general',
        participants: ['user_001', 'user_002', 'user_003', 'ai_agent'],
        unreadCount: 3,
        muted: false
      },
      {
        id: 'alerts',
        name: 'Alertas IA',
        description: 'Notificaciones automáticas del asistente IA',
        type: 'alerts',
        participants: ['user_001', 'ai_agent'],
        unreadCount: 1,
        muted: false
      },
      {
        id: 'kitchen',
        name: 'Cocina',
        description: 'Comunicación específica de cocina',
        type: 'general',
        participants: ['user_001', 'user_003'],
        unreadCount: 0,
        muted: false
      },
      {
        id: 'front_desk',
        name: 'Recepción',
        description: 'Comunicación del área de recepción',
        type: 'general',
        participants: ['user_001', 'user_002', 'user_004'],
        unreadCount: 0,
        muted: false
      }
    ];

    const mockMessages: Message[] = [
      {
        id: 'msg_001',
        senderId: 'ai_agent',
        senderName: 'IA Asistente',
        senderRole: 'ai_agent',
        content: 'Buenos días equipo! 🌅 He procesado 12 llamadas esta mañana y tenemos 8 reservas confirmadas para hoy. Mesa 5 tiene una solicitud especial para celebración de cumpleaños.',
        timestamp: '2025-09-21T09:00:00Z',
        type: 'system',
        priority: 'medium',
        reactions: [
          { emoji: '👍', userId: 'user_001', userName: 'María González' },
          { emoji: '💪', userId: 'user_002', userName: 'Juan Pérez' }
        ]
      },
      {
        id: 'msg_002',
        senderId: 'user_001',
        senderName: 'María González',
        senderRole: 'manager',
        content: 'Perfecto, gracias IA! @Juan prepara algo especial para la mesa 5. @Carlos asegúrate de tener suficiente pastel.',
        timestamp: '2025-09-21T09:05:00Z',
        type: 'text',
        mentions: ['user_002', 'user_003']
      },
      {
        id: 'msg_003',
        senderId: 'user_002',
        senderName: 'Juan Pérez',
        senderRole: 'waiter',
        content: '✅ Entendido! Ya tengo preparada la decoración especial y coordinaré con Carlos para el postre.',
        timestamp: '2025-09-21T09:07:00Z',
        type: 'text'
      },
      {
        id: 'msg_004',
        senderId: 'ai_agent',
        senderName: 'IA Asistente',
        senderRole: 'ai_agent',
        content: '⚠️ ALERTA: Stock de queso mozzarella está bajo (2kg restantes). Recomiendo hacer pedido urgente al proveedor.',
        timestamp: '2025-09-21T10:30:00Z',
        type: 'alert',
        priority: 'high'
      },
      {
        id: 'msg_005',
        senderId: 'user_003',
        senderName: 'Carlos Rodríguez',
        senderRole: 'chef',
        content: 'Ya contacté al proveedor, llega en 2 horas. Mientras tanto tengo suficiente para el servicio de mediodía.',
        timestamp: '2025-09-21T10:35:00Z',
        type: 'text'
      },
      {
        id: 'msg_006',
        senderId: 'user_001',
        senderName: 'María González',
        senderRole: 'manager',
        content: 'Excelente coordinación equipo! 👏 Esto es exactamente como debe funcionar nuestro sistema.',
        timestamp: '2025-09-21T10:40:00Z',
        type: 'text',
        reactions: [
          { emoji: '🎉', userId: 'user_002', userName: 'Juan Pérez' },
          { emoji: '👏', userId: 'user_003', userName: 'Carlos Rodríguez' },
          { emoji: '🤖', userId: 'ai_agent', userName: 'IA Asistente' }
        ]
      }
    ];

    setChannels(mockChannels);
    setMessages(mockMessages);
    setOnlineUsers(['user_001', 'user_002', 'ai_agent']);
    setLoading(false);
  }, [restaurantId]);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ai_agent': return '🤖';
      case 'manager': return '👔';
      case 'waiter': return '🍽️';
      case 'chef': return '👨‍🍳';
      case 'host': return '🙋‍♀️';
      case 'cleaner': return '🧹';
      default: return '👤';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ai_agent': return 'IA Asistente';
      case 'manager': return 'Gerente';
      case 'waiter': return 'Mesero';
      case 'chef': return 'Chef';
      case 'host': return 'Anfitrión';
      case 'cleaner': return 'Limpieza';
      default: return 'Usuario';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return '';
    }
  };

  const getMessageTypeStyle = (type: string) => {
    switch (type) {
      case 'alert': return 'border-l-4 border-red-500 bg-red-50';
      case 'system': return 'border-l-4 border-blue-500 bg-blue-50';
      case 'task': return 'border-l-4 border-green-500 bg-green-50';
      default: return '';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole as any,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      reactions: []
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simular respuesta automática de la IA en algunos casos
    if (newMessage.toLowerCase().includes('ia') || newMessage.toLowerCase().includes('asistente')) {
      setTimeout(() => {
        const aiResponse: Message = {
          id: `msg_${Date.now() + 1}`,
          senderId: 'ai_agent',
          senderName: 'IA Asistente',
          senderRole: 'ai_agent',
          content: '¡Hola! Estoy aquí para ayudar. ¿Necesitas información sobre reservas, inventario o algún reporte?',
          timestamp: new Date().toISOString(),
          type: 'text',
          reactions: []
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1500);
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji && r.userId === currentUserId);
        if (existingReaction) {
          // Remover reacción existente
          return {
            ...msg,
            reactions: msg.reactions?.filter(r => !(r.emoji === emoji && r.userId === currentUserId)) || []
          };
        } else {
          // Agregar nueva reacción
          return {
            ...msg,
            reactions: [
              ...(msg.reactions || []),
              { emoji, userId: currentUserId, userName: currentUserName }
            ]
          };
        }
      }
      return msg;
    }));
    setShowEmojiPicker(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    }
  };

  const renderMentions = (content: string, mentions?: string[]) => {
    if (!mentions || mentions.length === 0) return content;
    
    let result = content;
    mentions.forEach(userId => {
      // En un caso real, buscarías el nombre del usuario por su ID
      const userName = userId === 'user_002' ? 'Juan' : userId === 'user_003' ? 'Carlos' : 'Usuario';
      result = result.replace(`@${userName}`, `<span class="bg-blue-100 text-blue-800 px-1 rounded">@${userName}</span>`);
    });
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            💬 Chat Interno del Equipo
          </h1>
          <p className="text-gray-600 mt-1">
            Comunicación en tiempo real con tu equipo y asistente IA
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800">
            {onlineUsers.length} en línea
          </Badge>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                ⚙️ Configurar Chat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración del Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span>Notificaciones de sonido</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span>Notificaciones push</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span>Mostrar cuando escribo</span>
                  <input type="checkbox" defaultChecked />
                </div>
                <Button className="w-full">Guardar Configuración</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Lista de Canales */}
        <Card className="p-4 lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-4">Canales</h3>
          
          <div className="space-y-2">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeChannel === channel.id
                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{channel.name}</span>
                      {channel.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {channel.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{channel.description}</p>
                  </div>
                  {channel.muted && <span className="text-gray-400">🔇</span>}
                </div>
              </button>
            ))}
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            ➕ Crear Canal
          </Button>
        </Card>

        {/* Área de Mensajes */}
        <Card className="lg:col-span-3 flex flex-col">
          {/* Header del canal activo */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  #{channels.find(c => c.id === activeChannel)?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {channels.find(c => c.id === activeChannel)?.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 4).map(userId => (
                    <div
                      key={userId}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white"
                    >
                      {userId === 'ai_agent' ? '🤖' : userId.slice(-1)}
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline">
                  👥 {onlineUsers.length}
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${getMessageTypeStyle(message.type)} ${
                  message.senderId === currentUserId ? 'ml-8' : 'mr-8'
                }`}
              >
                {/* Header del mensaje */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getRoleIcon(message.senderRole)}</span>
                    <span className="font-medium text-gray-900">{message.senderName}</span>
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    {message.priority && (
                      <Badge className={getPriorityColor(message.priority)}>
                        {message.priority.toUpperCase()}
                      </Badge>
                    )}
                    {message.edited && (
                      <span className="text-xs text-gray-400">(editado)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                    >
                      😊
                    </Button>
                  </div>
                </div>

                {/* Contenido del mensaje */}
                <div className="text-gray-700 mb-3">
                  {renderMentions(message.content, message.mentions)}
                </div>

                {/* Reacciones */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(
                      message.reactions.reduce((acc, reaction) => {
                        const key = reaction.emoji;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(reaction);
                        return acc;
                      }, {} as Record<string, typeof message.reactions>)
                    ).map(([emoji, reactions]) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(message.id, emoji)}
                        className={`px-2 py-1 rounded-full text-sm border ${
                          reactions.some(r => r.userId === currentUserId)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                        }`}
                        title={reactions.map(r => r.userName).join(', ')}
                      >
                        {emoji} {reactions.length}
                      </button>
                    ))}
                  </div>
                )}

                {/* Picker de emojis */}
                {showEmojiPicker === message.id && (
                  <div className="flex gap-2 p-2 bg-white border rounded-lg shadow-lg">
                    {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(message.id, emoji)}
                        className="text-xl hover:bg-gray-100 p-1 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input para nuevo mensaje */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Escribe un mensaje en #${channels.find(c => c.id === activeChannel)?.name}...`}
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button size="sm" variant="ghost">
                    📎
                  </Button>
                  <Button size="sm" variant="ghost">
                    😊
                  </Button>
                </div>
              </div>
              
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                Enviar
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>💡 Usa @nombre para mencionar a alguien</span>
              <span>🤖 Menciona "IA" para consultar al asistente</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Panel de usuarios en línea (opcional) */}
      <Card className="mt-6 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">👥 Equipo en Línea</h3>
        <div className="flex flex-wrap gap-3">
          {onlineUsers.map(userId => {
            const isAI = userId === 'ai_agent';
            const userName = isAI ? 'IA Asistente' : 
                           userId === 'user_001' ? 'María González' :
                           userId === 'user_002' ? 'Juan Pérez' : 
                           userId === 'user_003' ? 'Carlos Rodríguez' : 'Usuario';
            const userRole = isAI ? 'ai_agent' : 
                           userId === 'user_001' ? 'manager' :
                           userId === 'user_002' ? 'waiter' : 'chef';
            
            return (
              <div key={userId} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="relative">
                  <span className="text-xl">{getRoleIcon(userRole)}</span>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{getRoleName(userRole)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
