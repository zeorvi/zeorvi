'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, Bot, Settings, Play, Pause, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface AgentInfo {
  agent_id: string;
  agent_name: string;
  status: string;
  restaurant_id: string;
  restaurant_name: string;
  webhook_url: string;
  redirect_webhook_url: string;
  llm_websocket_url: string;
  created_at: string;
  last_updated: string;
}

interface CallInfo {
  call_id: string;
  agent_id: string;
  to_number: string;
  from_number: string;
  status: string;
  created_at: string;
}

export default function RetellAgentManager() {
  const [restaurantId, setRestaurantId] = useState('rest_003');
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [callInfo, setCallInfo] = useState<CallInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/retell/create-agent?restaurantId=${restaurantId}`);
      const data = await response.json();
      
      if (data.success) {
        setAgentInfo(data.agent);
        toast.success('✅ Información del agente obtenida');
      } else {
        toast.error('❌ Error al obtener información del agente');
      }
    } catch (error) {
      console.error('Error getting agent:', error);
      toast.error('Error al obtener información del agente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/retell/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAgentInfo(data.agent);
        toast.success('✅ Agente creado exitosamente');
      } else {
        toast.error('❌ Error al crear agente');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Error al crear agente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/retell/configure-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAgentInfo(data.agent);
        toast.success('✅ Agente configurado con prompt específico');
        console.log('Configuración completa:', data.configuration);
        console.log('Prompt específico:', data.prompt);
      } else {
        toast.error('❌ Error al configurar agente');
      }
    } catch (error) {
      console.error('Error configuring agent:', error);
      toast.error('Error al configurar agente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCall = async () => {
    if (!agentInfo) {
      toast.error('❌ Primero debe obtener información del agente');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/retell/start-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          restaurantId, 
          phoneNumber,
          testMode: true 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCallInfo(data.call);
        toast.success('✅ Llamada iniciada exitosamente');
      } else {
        toast.error('❌ Error al iniciar llamada');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Error al iniciar llamada');
    } finally {
      setIsLoading(false);
    }
  };

  const restaurants = [
    { id: 'rest_003', name: 'La Gaviota' },
    { id: 'rest_001', name: 'El Buen Sabor' },
    { id: 'rest_002', name: 'La Parrilla del Chef' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <span>Gestión de Agentes Retell AI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="restaurantId">Restaurante</Label>
              <select
                id="restaurantId"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-purple-400/30 text-white rounded-md"
              >
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Número de Teléfono</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleGetAgent} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              Obtener Agente
            </Button>
            
            <Button 
              onClick={handleCreateAgent} 
              disabled={isLoading}
              className="flex-1 bg-purple-500 hover:bg-purple-600"
            >
              <Bot className="h-4 w-4 mr-2" />
              Crear Agente
            </Button>
            
            <Button 
              onClick={handleConfigureAgent} 
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Configurar Agente
            </Button>
            
            <Button 
              onClick={handleStartCall} 
              disabled={isLoading || !agentInfo}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-4 w-4 mr-2" />
              Iniciar Llamada
            </Button>
          </div>
        </CardContent>
      </Card>

      {agentInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-green-400" />
              <span>Información del Agente</span>
              <Badge className={agentInfo.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                {agentInfo.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-300 font-medium">ID del Agente</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white font-mono text-sm">
                  {agentInfo.agent_id}
                </div>
              </div>
              
              <div>
                <Label className="text-purple-300 font-medium">Nombre del Agente</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white">
                  {agentInfo.agent_name}
                </div>
              </div>
              
              <div>
                <Label className="text-purple-300 font-medium">Restaurante</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white">
                  {agentInfo.restaurant_name}
                </div>
              </div>
              
              <div>
                <Label className="text-purple-300 font-medium">Estado</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white">
                  <Badge className={agentInfo.status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                    {agentInfo.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-purple-300 font-medium">Webhook URL</Label>
              <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white font-mono text-sm">
                {agentInfo.webhook_url}
              </div>
            </div>
            
            <div>
              <Label className="text-purple-300 font-medium">Dashboard Redirect URL</Label>
              <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white font-mono text-sm">
                {agentInfo.redirect_webhook_url}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-purple-300 font-medium">Creado</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white text-sm">
                  {new Date(agentInfo.created_at).toLocaleString('es-ES')}
                </div>
              </div>
              
              <div>
                <Label className="text-purple-300 font-medium">Última Actualización</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white text-sm">
                  {new Date(agentInfo.last_updated).toLocaleString('es-ES')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {callInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-400" />
              <span>Llamada en Progreso</span>
              <Badge className={callInfo.status === 'initiated' ? 'bg-blue-500' : 'bg-gray-500'}>
                {callInfo.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-blue-300 font-medium">ID de Llamada</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded text-white font-mono text-sm">
                  {callInfo.call_id}
                </div>
              </div>
              
              <div>
                <Label className="text-blue-300 font-medium">Número Destino</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded text-white">
                  {callInfo.to_number}
                </div>
              </div>
              
              <div>
                <Label className="text-blue-300 font-medium">Número Origen</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded text-white">
                  {callInfo.from_number}
                </div>
              </div>
              
              <div>
                <Label className="text-blue-300 font-medium">Estado</Label>
                <div className="px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded text-white">
                  <Badge className={callInfo.status === 'initiated' ? 'bg-blue-500' : 'bg-gray-500'}>
                    {callInfo.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-blue-300 font-medium">Iniciada</Label>
              <div className="px-3 py-2 bg-slate-700/50 border border-blue-400/30 rounded text-white text-sm">
                {new Date(callInfo.created_at).toLocaleString('es-ES')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
