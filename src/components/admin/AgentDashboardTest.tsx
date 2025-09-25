'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Phone, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';

interface TestResult {
  success: boolean;
  agentResponse: string;
  dashboardData?: {
    totalTables: number;
    available: number;
    occupied: number;
    occupancyRate: number;
  };
  availabilityData?: {
    hasAvailability: boolean;
    availableTables: number;
    recommendations: string[];
  };
  timestamp: string;
}

export default function AgentDashboardTest() {
  const [restaurantId, setRestaurantId] = useState('rest_003');
  const [message, setMessage] = useState('¿Tienen disponibilidad para 4 personas esta noche?');
  const [people, setPeople] = useState(4);
  const [date, setDate] = useState('hoy');
  const [time, setTime] = useState('20:00');
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/retell/test-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          message,
          people,
          date,
          time
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success('✅ Prueba del agente completada');
      } else {
        toast.error('❌ Error en la prueba del agente');
      }
    } catch (error) {
      console.error('Error testing agent:', error);
      toast.error('Error al probar el agente');
    } finally {
      setIsLoading(false);
    }
  };

  const testScenarios = [
    {
      name: 'Consulta Disponibilidad',
      message: '¿Tienen disponibilidad para 4 personas esta noche?',
      people: 4,
      date: 'hoy',
      time: '20:00'
    },
    {
      name: 'Crear Reserva',
      message: 'Quiero reservar una mesa para 4 personas esta noche a las 20:00',
      people: 4,
      date: 'hoy',
      time: '20:00'
    },
    {
      name: 'Ver Agenda',
      message: '¿Cómo está la agenda de hoy? ¿Hay muchas reservas?',
      people: 2,
      date: 'hoy',
      time: '20:00'
    },
    {
      name: 'Buscar Cliente',
      message: 'Busco información del cliente María García',
      people: 2,
      date: 'hoy',
      time: '20:00'
    },
    {
      name: 'Gestionar Mesa',
      message: 'Necesito liberar la mesa S1',
      people: 2,
      date: 'hoy',
      time: '20:00'
    },
    {
      name: 'Estado Mesas',
      message: '¿Cuál es el estado actual de todas las mesas?',
      people: 2,
      date: 'hoy',
      time: '20:00'
    }
  ];

  const applyScenario = (scenario: typeof testScenarios[0]) => {
    setMessage(scenario.message);
    setPeople(scenario.people);
    setDate(scenario.date);
    setTime(scenario.time);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-blue-400" />
            <span>Prueba de Agente IA - Acceso al Dashboard</span>
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
                className="w-full mt-1 px-3 py-2 bg-slate-700/50 border border-blue-400/30 text-white rounded-md"
              >
                <option value="rest_003">La Gaviota</option>
                <option value="rest_001">El Buen Sabor</option>
                <option value="rest_002">La Parrilla del Chef</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="people">Personas</Label>
              <Input
                id="people"
                type="number"
                value={people}
                onChange={(e) => setPeople(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="hoy, mañana, lunes..."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="20:00, 8 pm..."
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="message">Mensaje del Cliente</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="¿Tienen disponibilidad para 4 personas esta noche?"
              className="mt-1"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleTest} disabled={isLoading} className="flex-1">
              {isLoading ? 'Probando...' : 'Probar Agente'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {testScenarios.map((scenario, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => applyScenario(scenario)}
                className="text-xs"
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span>Respuesta del Agente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg border border-blue-400/20">
              <p className="text-white">{result.agentResponse}</p>
            </div>
            
            {result.dashboardData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-green-400/20">
                  <div className="text-2xl font-bold text-green-400">{result.dashboardData.totalTables}</div>
                  <div className="text-sm text-gray-300">Total Mesas</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-blue-400/20">
                  <div className="text-2xl font-bold text-blue-400">{result.dashboardData.available}</div>
                  <div className="text-sm text-gray-300">Disponibles</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-red-400/20">
                  <div className="text-2xl font-bold text-red-400">{result.dashboardData.occupied}</div>
                  <div className="text-sm text-gray-300">Ocupadas</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-yellow-400/20">
                  <div className="text-2xl font-bold text-yellow-400">{result.dashboardData.occupancyRate}%</div>
                  <div className="text-sm text-gray-300">Ocupación</div>
                </div>
              </div>
            )}
            
            {result.availabilityData && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={result.availabilityData.hasAvailability ? 'bg-green-500' : 'bg-red-500'}>
                    {result.availabilityData.hasAvailability ? 'Disponible' : 'No Disponible'}
                  </Badge>
                  <span className="text-gray-300">
                    {result.availabilityData.availableTables} mesa{result.availabilityData.availableTables > 1 ? 's' : ''} disponible{result.availabilityData.availableTables > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {result.availabilityData.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                      <span className="text-blue-400">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-600">
              Prueba realizada: {new Date(result.timestamp).toLocaleString('es-ES')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
