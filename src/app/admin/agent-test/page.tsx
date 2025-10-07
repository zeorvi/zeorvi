'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AgentTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+34698765432');
  const [testMessage, setTestMessage] = useState('Quiero reservar una mesa para 4 personas mañana a las 20:00');

  const runAgentTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      const response = await fetch('/api/retell/test-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
          restaurantId: 'rest_003'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResults([
          `✅ Agente de voz configurado correctamente`,
          `📞 Número de prueba: ${testPhone}`,
          `💬 Mensaje: ${testMessage}`,
          `🏪 Restaurante: ${result.restaurantName || 'La Gaviota'}`,
          `🤖 Respuesta del agente: ${result.agentResponse || 'Configuración exitosa'}`
        ]);
      } else {
        setTestResults([
          `❌ Error en la configuración del agente`,
          `🔍 Detalles: ${result.error || 'Error desconocido'}`
        ]);
      }
    } catch (error) {
      setTestResults([
        `❌ Error de conexión`,
        `🔍 Detalles: ${error instanceof Error ? error.message : 'Error desconocido'}`
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Prueba de Agente de Voz</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Prueba</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Número de teléfono de prueba</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+34698765432"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Mensaje de prueba</Label>
                <Textarea
                  id="message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Quiero reservar una mesa para 4 personas mañana a las 20:00"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={runAgentTest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Ejecutando prueba...' : 'Ejecutar Prueba del Agente'}
              </Button>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de la Prueba</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}