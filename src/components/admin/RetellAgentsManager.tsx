'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Plus, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface RetellAgent {
  restaurantId: string;
  restaurantName: string;
  agentId: string;
  webhookUrl: string;
  status: 'active' | 'inactive' | 'pending';
  lastCall?: string;
  totalCalls?: number;
}

interface AgentConfig {
  agentId: string;
  voiceId: string;
  language: string;
  functions: string[];
  prompt: string;
}

export default function RetellAgentsManager() {
  const [agents, setAgents] = useState<RetellAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configForm, setConfigForm] = useState<AgentConfig>({
    agentId: '',
    voiceId: 'es-ES-ElviraNeural',
    language: 'es-ES',
    functions: ['verificar_disponibilidad', 'crear_reserva'],
    prompt: ''
  });

  // Cargar agentes al montar el componente
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/retell/agents');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
      } else {
        setError(data.error || 'Error cargando agentes');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async () => {
    if (!selectedRestaurant || !configForm.agentId) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const response = await fetch(`/api/retell/agents/${selectedRestaurant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configForm),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Agente creado exitosamente');
        setShowConfigForm(false);
        setConfigForm({
          agentId: '',
          voiceId: 'es-ES-ElviraNeural',
          language: 'es-ES',
          functions: ['verificar_disponibilidad', 'crear_reserva'],
          prompt: ''
        });
        loadAgents();
      } else {
        setError(data.error || 'Error creando agente');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const deleteAgent = async (restaurantId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este agente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/retell/agents/${restaurantId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Agente eliminado exitosamente');
        loadAgents();
      } else {
        setError(data.error || 'Error eliminando agente');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccess('URL del webhook copiada al portapapeles');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><RefreshCw className="w-3 h-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Cargando agentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Agentes Retell</h1>
          <p className="text-gray-600">Configura y gestiona los agentes de voz para cada restaurante</p>
        </div>
        <Button onClick={() => setShowConfigForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Agente
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Formulario de configuración */}
      {showConfigForm && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Nuevo Agente</CardTitle>
            <CardDescription>
              Configura un nuevo agente de voz para un restaurante específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="restaurant">Restaurante</Label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rest_003">La Gaviota</SelectItem>
                    <SelectItem value="rest_004">El Buen Sabor</SelectItem>
                    <SelectItem value="rest_005">Nuevo Restaurante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="agentId">Agent ID</Label>
                <Input
                  id="agentId"
                  value={configForm.agentId}
                  onChange={(e) => setConfigForm({ ...configForm, agentId: e.target.value })}
                  placeholder="agent_restaurant_001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voiceId">Voz</Label>
                <Select value={configForm.voiceId} onValueChange={(value) => setConfigForm({ ...configForm, voiceId: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-ES-ElviraNeural">Elvira (Español)</SelectItem>
                    <SelectItem value="es-ES-AlvaroNeural">Álvaro (Español)</SelectItem>
                    <SelectItem value="en-US-AriaNeural">Aria (Inglés)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select value={configForm.language} onValueChange={(value) => setConfigForm({ ...configForm, language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-ES">Español</SelectItem>
                    <SelectItem value="en-US">Inglés</SelectItem>
                    <SelectItem value="fr-FR">Francés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prompt">Prompt del Agente</Label>
              <Textarea
                id="prompt"
                value={configForm.prompt}
                onChange={(e) => setConfigForm({ ...configForm, prompt: e.target.value })}
                placeholder="Eres el asistente de voz del restaurante..."
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={createAgent}>Crear Agente</Button>
              <Button variant="outline" onClick={() => setShowConfigForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de agentes */}
      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.restaurantId}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{agent.restaurantName}</h3>
                    {getStatusBadge(agent.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Agent ID:</strong> {agent.agentId}</p>
                    <p><strong>Restaurant ID:</strong> {agent.restaurantId}</p>
                    {agent.lastCall && (
                      <p><strong>Última llamada:</strong> {new Date(agent.lastCall).toLocaleString()}</p>
                    )}
                    {agent.totalCalls !== undefined && (
                      <p><strong>Total llamadas:</strong> {agent.totalCalls}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyWebhookUrl(agent.webhookUrl)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar Webhook
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAgent(agent.restaurantId)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-1">Webhook URL:</p>
                <code className="text-xs text-gray-600 break-all">{agent.webhookUrl}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No hay agentes configurados</p>
            <Button 
              onClick={() => setShowConfigForm(true)} 
              className="mt-4"
              variant="outline"
            >
              Crear Primer Agente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
