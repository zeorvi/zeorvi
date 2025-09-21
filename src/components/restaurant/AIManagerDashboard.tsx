'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AIInsight, Report, Call, Incident } from '@/lib/types/restaurant';

interface AIManagerDashboardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

export default function AIManagerDashboard({ restaurantId, restaurantName, restaurantType }: AIManagerDashboardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'reports' | 'calls' | 'incidents'>('insights');

  // Mock data - en producción vendría de la API
  useEffect(() => {
    const mockInsights: AIInsight[] = [
      {
        id: 'insight_001',
        restaurantId,
        type: 'sales_pattern',
        title: 'Oportunidad de aumento en ventas nocturnas',
        description: 'Los datos muestran que las ventas después de las 20:00 han aumentado 25% en las últimas 2 semanas. Hay potencial para expandir el menú nocturno.',
        data: { timeRange: '20:00-23:00', increase: 25, period: '2 weeks' },
        recommendations: [
          'Ampliar el menú de cenas con opciones premium',
          'Implementar happy hour de 20:00 a 21:00',
          'Contratar mesero adicional para turno nocturno'
        ],
        priority: 'high',
        confidence: 87,
        dateRange: { from: '2025-09-07', to: '2025-09-21' },
        status: 'new',
        createdAt: '2025-09-21T10:30:00Z'
      },
      {
        id: 'insight_002',
        restaurantId,
        type: 'customer_behavior',
        title: 'Patrón de cancelaciones los viernes',
        description: 'Se detecta un 40% más de cancelaciones los viernes entre 18:00-19:00. Posiblemente relacionado con tráfico vehicular.',
        data: { day: 'friday', timeRange: '18:00-19:00', increase: 40 },
        recommendations: [
          'Implementar recordatorio automático 2 horas antes',
          'Ofrecer flexibilidad de horario para reservas de viernes',
          'Crear política de confirmación para reservas de fin de semana'
        ],
        priority: 'medium',
        confidence: 92,
        dateRange: { from: '2025-09-01', to: '2025-09-21' },
        status: 'new',
        createdAt: '2025-09-21T09:15:00Z'
      },
      {
        id: 'insight_003',
        restaurantId,
        type: 'operational_efficiency',
        title: 'Optimización de tiempo de mesa',
        description: 'Las mesas de 4 personas permanecen ocupadas 15 minutos menos que el promedio. Oportunidad de rotación más rápida.',
        data: { tableSize: 4, timeDifference: -15, averageTime: 90 },
        recommendations: [
          'Implementar sistema de notificación a meseros',
          'Crear menú express para mesas de 4',
          'Optimizar proceso de pago para rotación rápida'
        ],
        priority: 'medium',
        confidence: 78,
        dateRange: { from: '2025-09-14', to: '2025-09-21' },
        status: 'reviewed',
        createdAt: '2025-09-20T16:45:00Z'
      }
    ];

    const mockReports: Report[] = [
      {
        id: 'report_001',
        restaurantId,
        type: 'weekly',
        period: { from: '2025-09-14', to: '2025-09-21' },
        metrics: {
          sales: {
            total: 47850,
            orders: 189,
            averageOrderValue: 253,
            topItems: [
              { name: 'Pizza Margherita', quantity: 45, revenue: 6750 },
              { name: 'Pasta Carbonara', quantity: 38, revenue: 5700 },
              { name: 'Ensalada César', quantity: 32, revenue: 2880 }
            ]
          },
          operations: {
            callsReceived: 156,
            callsAnswered: 148,
            reservations: 123,
            cancellations: 18,
            noShows: 7,
            tableOccupancy: 82
          },
          customers: {
            newClients: 34,
            returningClients: 89,
            averageRating: 4.6,
            complaints: 3,
            compliments: 28
          },
          staff: {
            hoursWorked: 456,
            attendance: 94,
            productivity: 87
          },
          inventory: {
            itemsLowStock: 8,
            itemsOutOfStock: 2,
            wasteAmount: 125,
            costOfGoods: 14355
          }
        },
        insights: [
          'Incremento del 12% en ventas vs semana anterior',
          'Excelente rating promedio de clientes (4.6/5)',
          'Necesidad de reabastecer 2 productos críticos'
        ],
        recommendations: [
          'Mantener el menú actual que está funcionando bien',
          'Implementar sistema de inventario automático',
          'Considerar programa de fidelización para clientes recurrentes'
        ],
        generatedAt: '2025-09-21T08:00:00Z',
        generatedBy: 'ai_agent',
        status: 'final'
      }
    ];

    const mockCalls: Call[] = [
      {
        id: 'call_001',
        restaurantId,
        retellCallId: 'retell_abc123',
        direction: 'inbound',
        fromNumber: '+52-555-1234',
        toNumber: '+52-555-5678',
        status: 'completed',
        duration: 180,
        startTime: '2025-09-21T14:30:00Z',
        endTime: '2025-09-21T14:33:00Z',
        purpose: 'reservation',
        outcome: 'successful',
        transcript: 'Cliente: Hola, quisiera hacer una reserva para esta noche...',
        summary: 'Reserva exitosa para 4 personas a las 20:00. Cliente solicitó mesa cerca de la ventana.',
        actionItems: ['Confirmar mesa cerca de ventana', 'Enviar recordatorio 2 horas antes'],
        clientId: 'client_001',
        reservationId: 'res_001',
        rating: 5,
        cost: 2.50,
        createdAt: '2025-09-21T14:30:00Z',
        tags: ['reserva', 'exitosa', 'mesa-ventana']
      },
      {
        id: 'call_002',
        restaurantId,
        retellCallId: 'retell_def456',
        direction: 'outbound',
        fromNumber: '+52-555-5678',
        toNumber: '+52-555-9876',
        status: 'completed',
        duration: 95,
        startTime: '2025-09-21T13:15:00Z',
        endTime: '2025-09-21T13:16:35Z',
        purpose: 'cancellation',
        outcome: 'successful',
        summary: 'Confirmación de cancelación de reserva. Cliente tuvo emergencia familiar.',
        actionItems: ['Liberar mesa M5 para las 19:00', 'Ofrecer reagendar para próxima semana'],
        reservationId: 'res_002',
        rating: 4,
        cost: 1.75,
        createdAt: '2025-09-21T13:15:00Z',
        tags: ['cancelacion', 'emergencia', 'reagendar']
      }
    ];

    const mockIncidents: Incident[] = [
      {
        id: 'incident_001',
        restaurantId,
        type: 'complaint',
        priority: 'medium',
        status: 'in_progress',
        title: 'Cliente insatisfecho con tiempo de espera',
        description: 'Mesa 7 esperó 45 minutos por su orden. Cliente expresó molestia por la demora.',
        reportedBy: 'ai_agent',
        assignedTo: 'emp_001',
        clientId: 'client_005',
        orderId: 'order_123',
        tableId: 'M7',
        createdAt: '2025-09-21T12:45:00Z',
        updatedAt: '2025-09-21T13:00:00Z',
        dueDate: '2025-09-21T18:00:00Z',
        tags: ['tiempo-espera', 'cliente-molesto', 'mesa-7'],
        attachments: []
      },
      {
        id: 'incident_002',
        restaurantId,
        type: 'inventory',
        priority: 'high',
        status: 'resolved',
        title: 'Agotamiento de ingrediente principal',
        description: 'Se agotó el queso mozzarella durante el turno de la tarde. Afectó 8 órdenes.',
        reportedBy: 'emp_003',
        assignedTo: 'emp_001',
        resolution: 'Compra de emergencia realizada. Proveedor entregó en 2 horas. Se implementó alerta automática.',
        createdAt: '2025-09-21T15:30:00Z',
        updatedAt: '2025-09-21T17:45:00Z',
        resolvedAt: '2025-09-21T17:45:00Z',
        tags: ['inventario', 'queso-mozzarella', 'compra-emergencia'],
        attachments: []
      }
    ];

    setInsights(mockInsights);
    setReports(mockReports);
    setRecentCalls(mockCalls);
    setIncidents(mockIncidents);
    setLoading(false);
  }, [restaurantId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'implemented': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dismissed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales_pattern': return '📈';
      case 'customer_behavior': return '👥';
      case 'operational_efficiency': return '⚙️';
      case 'staff_performance': return '👔';
      case 'inventory_optimization': return '📦';
      case 'marketing_opportunity': return '📢';
      case 'complaint': return '😟';
      case 'maintenance': return '🔧';
      case 'inventory': return '📦';
      case 'staff': return '👥';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  const handleGenerateReport = async () => {
    // Mock report generation
    alert('Generando reporte semanal... Se enviará por email cuando esté listo.');
  };

  const handleImplementInsight = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'implemented' as const, reviewedAt: new Date().toISOString() }
        : insight
    ));
  };

  const handleDismissInsight = (insightId: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === insightId 
        ? { ...insight, status: 'dismissed' as const, reviewedAt: new Date().toISOString() }
        : insight
    ));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🤖 IA Encargado Digital
          </h1>
          <p className="text-gray-600 mt-1">
            Asistente inteligente para {restaurantName}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateReport}
            className="bg-blue-600 hover:bg-blue-700"
          >
            📊 Generar Reporte
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                ⚙️ Configurar IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configuración del Asistente IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="reportFreq">Frecuencia de reportes</Label>
                  <select id="reportFreq" className="w-full p-2 border rounded-md">
                    <option value="daily">Diario</option>
                    <option value="weekly" selected>Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="insightThreshold">Umbral de confianza para insights</Label>
                  <Input id="insightThreshold" type="number" defaultValue="75" min="50" max="100" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="autoNotify" defaultChecked />
                  <Label htmlFor="autoNotify">Notificaciones automáticas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="autoReorder" defaultChecked />
                  <Label htmlFor="autoReorder">Reorden automático de inventario</Label>
                </div>
                <Button className="w-full">Guardar Configuración</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'insights', label: '🧠 Insights', count: insights.filter(i => i.status === 'new').length },
          { id: 'reports', label: '📊 Reportes', count: reports.length },
          { id: 'calls', label: '📞 Llamadas Hoy', count: recentCalls.length },
          { id: 'incidents', label: '🚨 Incidencias', count: incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} {tab.count > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido de pestañas */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              🧠 Insights Inteligentes ({insights.filter(i => i.status === 'new').length} nuevos)
            </h2>
          </div>
          
          <div className="space-y-4">
            {insights.map(insight => (
              <Card key={insight.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPriorityColor(insight.priority)}>
                          {insight.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(insight.status)}>
                          {insight.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Confianza: {insight.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {insight.status === 'new' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleImplementInsight(insight.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Implementar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDismissInsight(insight.id)}
                      >
                        ❌ Descartar
                      </Button>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4">{insight.description}</p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Recomendaciones:</h4>
                  <ul className="space-y-1">
                    {insight.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Generado el {new Date(insight.createdAt).toLocaleString()}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">📊 Reportes Automáticos</h2>
            <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700">
              ➕ Generar Nuevo Reporte
            </Button>
          </div>
          
          <div className="space-y-4">
            {reports.map(report => (
              <Card key={report.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Reporte {report.type === 'weekly' ? 'Semanal' : report.type === 'monthly' ? 'Mensual' : 'Diario'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(report.period.from).toLocaleDateString()} - {new Date(report.period.to).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {report.status === 'final' ? 'Finalizado' : 'Borrador'}
                  </Badge>
                </div>
                
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-700 text-sm font-medium">Ingresos</p>
                    <p className="text-2xl font-bold text-blue-900">
                      ${report.metrics.sales.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-700 text-sm font-medium">Órdenes</p>
                    <p className="text-2xl font-bold text-green-900">{report.metrics.sales.orders}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-700 text-sm font-medium">Ocupación</p>
                    <p className="text-2xl font-bold text-purple-900">{report.metrics.operations.tableOccupancy}%</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-orange-700 text-sm font-medium">Rating</p>
                    <p className="text-2xl font-bold text-orange-900">{report.metrics.customers.averageRating}</p>
                  </div>
                </div>
                
                {/* Insights del reporte */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Insights Clave:</h4>
                  {report.insights.map((insight, index) => (
                    <p key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 mt-1">•</span>
                      {insight}
                    </p>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Generado el {new Date(report.generatedAt).toLocaleString()}
                  </span>
                  <Button size="sm" variant="outline">
                    📧 Enviar por Email
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'calls' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">📞 Llamadas Recientes</h2>
          
          <div className="space-y-4">
            {recentCalls.map(call => (
              <Card key={call.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {call.direction === 'inbound' ? '📞' : '📤'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {call.direction === 'inbound' ? 'Llamada Entrante' : 'Llamada Saliente'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {call.direction === 'inbound' ? `De: ${call.fromNumber}` : `A: ${call.toNumber}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={call.outcome === 'successful' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {call.outcome === 'successful' ? 'Exitosa' : 'Falló'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-900">Propósito: </span>
                    <span className="capitalize">{call.purpose}</span>
                  </div>
                  
                  {call.summary && (
                    <div>
                      <span className="font-medium text-gray-900">Resumen: </span>
                      <span className="text-gray-700">{call.summary}</span>
                    </div>
                  )}
                  
                  {call.actionItems.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">Acciones pendientes:</span>
                      <ul className="mt-1 space-y-1">
                        {call.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-orange-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {call.rating && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Calificación: </span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < call.rating! ? 'text-yellow-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">({call.rating}/5)</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                  <span>Costo: ${call.cost.toFixed(2)}</span>
                  <span>{new Date(call.startTime).toLocaleString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            🚨 Incidencias ({incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length} activas)
          </h2>
          
          <div className="space-y-4">
            {incidents.map(incident => (
              <Card key={incident.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                      <p className="text-sm text-gray-500">
                        Reportado por: {incident.reportedBy === 'ai_agent' ? 'IA Asistente' : 'Empleado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(incident.priority)}>
                      {incident.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status === 'open' ? 'Abierto' : 
                       incident.status === 'in_progress' ? 'En Proceso' : 
                       incident.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{incident.description}</p>
                
                {incident.resolution && (
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-green-900 mb-2">Resolución:</h4>
                    <p className="text-green-800">{incident.resolution}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    Creado: {new Date(incident.createdAt).toLocaleString()}
                  </span>
                  {incident.dueDate && incident.status !== 'resolved' && (
                    <span className={new Date(incident.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                      Vence: {new Date(incident.dueDate).toLocaleString()}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
