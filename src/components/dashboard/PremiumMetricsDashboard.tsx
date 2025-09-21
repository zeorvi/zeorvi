'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardMetrics } from '@/lib/types/restaurant';

interface PremiumMetricsDashboardProps {
  restaurantId: string;
  restaurantName: string;
}

export default function PremiumMetricsDashboard({ restaurantId, restaurantName }: PremiumMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simular datos en tiempo real
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Mock data - en producción vendría de la API
        const mockMetrics: DashboardMetrics = {
          realTime: {
            currentOccupancy: Math.floor(Math.random() * 20) + 5,
            activeReservations: Math.floor(Math.random() * 15) + 3,
            waitingList: Math.floor(Math.random() * 8),
            averageWaitTime: Math.floor(Math.random() * 30) + 10,
            staffOnDuty: Math.floor(Math.random() * 8) + 4,
            currentOrders: Math.floor(Math.random() * 12) + 2,
            kitchenBacklog: Math.floor(Math.random() * 6)
          },
          today: {
            revenue: Math.floor(Math.random() * 5000) + 2000,
            orders: Math.floor(Math.random() * 50) + 20,
            customers: Math.floor(Math.random() * 80) + 30,
            averageOrderValue: Math.floor(Math.random() * 50) + 75,
            tableOccupancy: Math.floor(Math.random() * 30) + 60,
            callsReceived: Math.floor(Math.random() * 30) + 15,
            callsAnswered: Math.floor(Math.random() * 25) + 20,
            reservations: Math.floor(Math.random() * 20) + 10
          },
          alerts: [
            {
              id: 'alert_1',
              type: 'inventory',
              priority: 'high',
              message: 'Stock bajo: Tomate fresco (2 kg restantes)',
              timestamp: new Date().toISOString(),
              acknowledged: false
            },
            {
              id: 'alert_2',
              type: 'customer',
              priority: 'medium',
              message: 'Mesa 5 esperando 25 minutos - verificar estado',
              timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
              acknowledged: false
            }
          ]
        };
        
        setMetrics(mockMetrics);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-blue-500 to-blue-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
        <div className="animate-pulse space-y-12">
          <div className="h-16 bg-slate-200 rounded-3xl w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header Compacto */}
      <div className="mb-8">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Métricas en Tiempo Real
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              {restaurantName} • Control en Tiempo Real
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 font-medium">
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <div className="w-1 h-4 bg-slate-300 rounded-full"></div>
            <Button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg text-sm"
            >
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas Principales - Compactas */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Mesas Ocupadas */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mx-auto shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-700 mb-1">{metrics.realTime.currentOccupancy}</div>
                <div className="text-blue-600 font-semibold text-sm tracking-wide">Mesas Ocupadas</div>
                <div className="w-full h-1 bg-blue-200 rounded-full mt-2">
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reservas Activas */}
          <Card className="p-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl mx-auto shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-700 mb-1">{metrics.realTime.activeReservations}</div>
                <div className="text-emerald-600 font-semibold text-sm tracking-wide">Reservas Activas</div>
                <div className="w-full h-1 bg-emerald-200 rounded-full mt-2">
                  <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Personal en Turno */}
          <Card className="p-6 bg-gradient-to-br from-violet-50 via-white to-violet-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-600 rounded-xl mx-auto shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
              </div>
              <div>
                <div className="text-3xl font-bold text-violet-700 mb-1">{metrics.realTime.staffOnDuty}</div>
                <div className="text-violet-600 font-semibold text-sm tracking-wide">Personal en Turno</div>
                <div className="w-full h-1 bg-violet-200 rounded-full mt-2">
                  <div className="h-1 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full" style={{width: '85%'}}></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Órdenes Activas */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl mx-auto shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-700 mb-1">{metrics.realTime.currentOrders}</div>
                <div className="text-orange-600 font-semibold text-sm tracking-wide">Órdenes Activas</div>
                <div className="w-full h-1 bg-orange-200 rounded-full mt-2">
                  <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{width: '40%'}}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Métricas Secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 bg-gradient-to-br from-rose-50 via-white to-rose-100 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-rose-600 rounded-lg mx-auto shadow-md flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-md shadow-inner"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-700 mb-1">{metrics.realTime.waitingList}</div>
                <div className="text-rose-600 font-semibold text-sm tracking-wide">Lista de Espera</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-teal-50 via-white to-teal-100 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg mx-auto shadow-md flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-md shadow-inner"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-700 mb-1">{formatTime(metrics.realTime.averageWaitTime)}</div>
                <div className="text-teal-600 font-semibold text-sm tracking-wide">Tiempo Promedio</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-indigo-50 via-white to-indigo-100 border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg mx-auto shadow-md flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-md shadow-inner"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-700 mb-1">{metrics.realTime.kitchenBacklog}</div>
                <div className="text-indigo-600 font-semibold text-sm tracking-wide">Cocina Pendiente</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resumen del Día */}
      <div className="space-y-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Resumen del Día
            </h2>
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ingresos */}
          <Card className="p-6 bg-gradient-to-br from-green-50 via-white to-green-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-green-700 text-sm font-bold tracking-wide">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(metrics.today.revenue)}</p>
                <p className="text-green-600 text-xs font-semibold mt-1">
                  Promedio: {formatCurrency(metrics.today.averageOrderValue)}
                </p>
              </div>
            </div>
          </Card>

          {/* Órdenes */}
          <Card className="p-6 bg-gradient-to-br from-cyan-50 via-white to-cyan-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl shadow-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
                </div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-cyan-700 text-sm font-bold tracking-wide">Órdenes Completadas</p>
                <p className="text-2xl font-bold text-cyan-900 mt-1">{metrics.today.orders}</p>
                <p className="text-cyan-600 text-xs font-semibold mt-1">
                  Clientes: {metrics.today.customers}
                </p>
              </div>
            </div>
          </Card>

          {/* Ocupación */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 via-white to-purple-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
                </div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-purple-700 text-sm font-bold tracking-wide">Ocupación Promedio</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{metrics.today.tableOccupancy}%</p>
                <p className="text-purple-600 text-xs font-semibold mt-1">
                  Reservas: {metrics.today.reservations}
                </p>
              </div>
            </div>
          </Card>

          {/* Llamadas IA */}
          <Card className="p-6 bg-gradient-to-br from-teal-50 via-white to-teal-100 border-0 shadow-xl rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
                </div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-teal-700 text-sm font-bold tracking-wide">Llamadas IA</p>
                <p className="text-2xl font-bold text-teal-900 mt-1">{metrics.today.callsAnswered}/{metrics.today.callsReceived}</p>
                <p className="text-teal-600 text-xs font-semibold mt-1">
                  Efectividad: {Math.round((metrics.today.callsAnswered/metrics.today.callsReceived)*100)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Alertas Compactas */}
      <div className="space-y-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-3">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Centro de Alertas
            </h2>
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {metrics.alerts.map((alert) => (
            <Card key={alert.id} className={`p-6 border-0 shadow-xl rounded-2xl transition-all duration-300 ${
              alert.acknowledged ? 'bg-slate-50/60 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm hover:shadow-2xl'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getPriorityColor(alert.priority)} rounded-xl shadow-lg flex items-center justify-center`}>
                    <div className="w-6 h-6 bg-white rounded-lg shadow-inner"></div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <Badge className={`px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r ${getPriorityColor(alert.priority)} text-white`}>
                        {alert.priority.toUpperCase()}
                      </Badge>
                      <span className={`font-semibold text-lg ${alert.acknowledged ? 'text-slate-500' : 'text-slate-900'}`}>
                        {alert.message}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <Button 
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg text-sm"
                    onClick={() => {
                      setMetrics(prev => prev ? {
                        ...prev,
                        alerts: prev.alerts.map(a => 
                          a.id === alert.id ? { ...a, acknowledged: true } : a
                        )
                      } : prev);
                    }}
                  >
                    Atender
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {metrics.alerts.filter(a => !a.acknowledged).length === 0 && (
          <Card className="p-8 text-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-0 shadow-xl rounded-2xl">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mx-auto shadow-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-xl shadow-inner flex items-center justify-center">
                  <div className="w-4 h-4 bg-emerald-500 rounded-lg"></div>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-800 mb-2">¡Todo en Perfecto Orden!</p>
                <p className="text-emerald-600 text-lg font-medium">No hay alertas pendientes.</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Acciones Rápidas Compactas */}
      <div className="space-y-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Acciones Rápidas
            </h2>
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Button className="h-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-md"></div>
            </div>
            <span className="text-sm font-bold tracking-wide">Contactar Cliente</span>
          </Button>
          
          <Button className="h-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-md"></div>
            </div>
            <span className="text-sm font-bold tracking-wide">Nueva Reserva</span>
          </Button>
          
          <Button className="h-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-md"></div>
            </div>
            <span className="text-sm font-bold tracking-wide">Gestionar Mesa</span>
          </Button>
          
          <Button className="h-20 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-md"></div>
            </div>
            <span className="text-sm font-bold tracking-wide">Ver Reportes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
