'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Phone, MessageSquare, Download } from 'lucide-react';

interface Transcript {
  id: string;
  restaurantId: string;
  callId: string;
  agentId: string;
  transcript: string;
  summary: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  fromNumber: string;
  toNumber: string;
  callStatus: string;
  createdAt: string;
  processed: boolean;
}

interface TranscriptViewerProps {
  restaurantId: string;
  restaurantName: string;
}

export default function TranscriptViewer({ restaurantId, restaurantName }: TranscriptViewerProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  const fetchTranscripts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/retell/transcripts?restaurantId=${restaurantId}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transcripts: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.transcripts) {
        setTranscripts(data.transcripts);
      } else {
        // Fallback a datos mock si no hay datos reales
        const mockTranscripts: Transcript[] = [
          {
            id: '1',
            restaurantId: 'rest_003',
            callId: 'call_123',
            agentId: 'agent_2082fc7a622cdbd22441b22060',
            transcript: 'Cliente: Hola, quiero hacer una reserva para 4 personas mañana a las 20:00.\n\nAgente: ¡Hola! Perfecto, para 4 personas mañana a las 20:00. ¿Podría darme su nombre y teléfono para confirmar la reserva?\n\nCliente: Soy Juan Pérez, mi teléfono es 123-456-789.\n\nAgente: ¡Perfecto Juan! Confirmo su reserva para 4 personas mañana a las 20:00. ¡Los esperamos en La Gaviota!',
            summary: 'Reserva confirmada para Juan Pérez, 4 personas, mañana 20:00',
            startTime: new Date(Date.now() - 3600000).toISOString(),
            endTime: new Date(Date.now() - 3540000).toISOString(),
            duration: 60,
            fromNumber: '+34123456789',
            toNumber: '+34987654321',
            callStatus: 'completed',
            createdAt: new Date().toISOString(),
            processed: true
          }
        ];
        setTranscripts(mockTranscripts);
      }
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      // En caso de error, mostrar array vacío
      setTranscripts([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId === 'rest_003') { // Solo para La Gaviota
      fetchTranscripts();
    }
  }, [restaurantId, fetchTranscripts]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completada', variant: 'default' as const },
      'in-progress': { label: 'En curso', variant: 'secondary' as const },
      failed: { label: 'Fallida', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const downloadTranscript = (transcript: Transcript) => {
    const content = `TRANSCRIPT - ${restaurantName}
Fecha: ${formatDate(transcript.startTime)}
Duración: ${transcript.duration ? formatDuration(transcript.duration) : 'N/A'}
Estado: ${transcript.callStatus}

RESUMEN:
${transcript.summary}

CONVERSACIÓN COMPLETA:
${transcript.transcript}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${transcript.callId}-${formatDate(transcript.startTime)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (restaurantId !== 'rest_003') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Transcripts de Conversaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Los transcripts están disponibles solo para La Gaviota.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Transcripts de Conversaciones - {restaurantName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Todas las conversaciones del agente de IA se guardan automáticamente aquí.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transcripts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay conversaciones registradas aún.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((transcript) => (
                <Card key={transcript.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatDate(transcript.startTime)}
                        </span>
                        {getStatusBadge(transcript.callStatus)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTranscript(transcript)}
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadTranscript(transcript)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {transcript.fromNumber}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {transcript.duration ? formatDuration(transcript.duration) : 'N/A'}
                        </div>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        <strong>Resumen:</strong> {transcript.summary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para ver transcript completo */}
      {selectedTranscript && (
        <Card className="fixed inset-4 z-50 bg-background border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transcript Completo</CardTitle>
            <Button
              variant="outline"
              onClick={() => setSelectedTranscript(null)}
            >
              Cerrar
            </Button>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Fecha:</strong> {formatDate(selectedTranscript.startTime)}
                </div>
                <div>
                  <strong>Duración:</strong> {selectedTranscript.duration ? formatDuration(selectedTranscript.duration) : 'N/A'}
                </div>
                <div>
                  <strong>Desde:</strong> {selectedTranscript.fromNumber}
                </div>
                <div>
                  <strong>Estado:</strong> {getStatusBadge(selectedTranscript.callStatus)}
                </div>
              </div>
              
              <div>
                <strong>Resumen:</strong>
                <p className="mt-1 p-3 bg-muted rounded-md">
                  {selectedTranscript.summary}
                </p>
              </div>
              
              <div>
                <strong>Conversación Completa:</strong>
                <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
                  {selectedTranscript.transcript}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadTranscript(selectedTranscript)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
