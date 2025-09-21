'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardMetrics } from '@/lib/types/restaurant';

interface MetricsDashboardProps {
  restaurantId: string;
  restaurantName: string;
}

export default function MetricsDashboard({ restaurantId, restaurantName }: MetricsDashboardProps) {
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
            },
            {
              id: 'alert_3',
              type: 'system',
              priority: 'low',
              message: 'Backup automático completado exitosamente',
              timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
              acknowledged: true
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
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory': return '📦';
      case 'staff': return '👥';
      case 'system': return '⚙️';
      case 'customer': return '🍽️';
      case 'maintenance': return '🔧';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header Elegante */}
      <div className="mb-16">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">
              Dashboard en Tiempo Real
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xl text-slate-600 font-medium">
                  Última actualización: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-semibold shadow-lg text-lg"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas en Tiempo Real */}
      <div className="space-y-12">
        <div className="flex items-center space-x-4">
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            En Vivo - {restaurantName}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="p-8 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-blue-700 text-lg font-semibold">Mesas Ocupadas</p>
                <p className="text-4xl font-bold text-blue-900 mt-2">{metrics.realTime.currentOccupancy}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100 border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-emerald-700 text-lg font-semibold">Reservas Activas</p>
                <p className="text-4xl font-bold text-emerald-900 mt-2">{metrics.realTime.activeReservations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100 border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <div className="w-3 h-3 bg-violet-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-violet-700 text-lg font-semibold">Personal en Turno</p>
                <p className="text-4xl font-bold text-violet-900 mt-2">{metrics.realTime.staffOnDuty}</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 border-0 shadow-xl rounded-3xl hover:shadow-2xl transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-white rounded-lg"></div>
                </div>
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-orange-700 text-lg font-semibold">Órdenes Activas</p>
                <p className="text-4xl font-bold text-orange-900 mt-2">{metrics.realTime.currentOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm font-medium">Lista de Espera</p>
                <p className="text-3xl font-bold text-red-900">{metrics.realTime.waitingList}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-medium">Tiempo Promedio Espera</p>
                <p className="text-3xl font-bold text-yellow-900">{formatTime(metrics.realTime.averageWaitTime)}</p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-700 text-sm font-medium">Cocina - Pendientes</p>
                <p className="text-3xl font-bold text-indigo-900">{metrics.realTime.kitchenBacklog}</p>
              </div>
              <div className="text-3xl">👨‍🍳</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Métricas del Día */}
      <div className="space-y-12">
        <div className="flex items-center space-x-4">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Resumen del Día
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-emerald-900">{formatCurrency(metrics.today.revenue)}</p>
                <p className="text-emerald-600 text-xs">Ticket promedio: {formatCurrency(metrics.today.averageOrderValue)}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-700 text-sm font-medium">Órdenes Completadas</p>
                <p className="text-2xl font-bold text-cyan-900">{metrics.today.orders}</p>
                <p className="text-cyan-600 text-xs">Clientes atendidos: {metrics.today.customers}</p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-700 text-sm font-medium">Ocupación Promedio</p>
                <p className="text-2xl font-bold text-pink-900">{metrics.today.tableOccupancy}%</p>
                <p className="text-pink-600 text-xs">Reservas hoy: {metrics.today.reservations}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-700 text-sm font-medium">Llamadas IA</p>
                <p className="text-2xl font-bold text-teal-900">{metrics.today.callsAnswered}/{metrics.today.callsReceived}</p>
                <p className="text-teal-600 text-xs">Efectividad: {Math.round((metrics.today.callsAnswered/metrics.today.callsReceived)*100)}%</p>
              </div>
              <div className="text-3xl">📞</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Alertas y Notificaciones */}
      <div className="space-y-12">
        <div className="flex items-center space-x-4">
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Alertas y Notificaciones
          </h2>
        </div>
        
        <div className="space-y-6">
          {metrics.alerts.map((alert) => (
            <Card key={alert.id} className={`p-8 border-0 shadow-xl rounded-3xl ${
              alert.acknowledged ? 'bg-slate-50/60 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getPriorityColor(alert.priority)} text-white text-xs`}>
                        {alert.priority.toUpperCase()}
                      </Badge>
                      <span className={`font-medium ${alert.acknowledged ? 'text-gray-500' : 'text-gray-900'}`}>
                        {alert.message}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Marcar como leída
                      setMetrics(prev => prev ? {
                        ...prev,
                        alerts: prev.alerts.map(a => 
                          a.id === alert.id ? { ...a, acknowledged: true } : a
                        )
                      } : prev);
                    }}
                  >
                    ✓ Marcar como leída
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {metrics.alerts.filter(a => !a.acknowledged).length === 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-emerald-50 to-teal-50 border-0 shadow-xl rounded-3xl">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-800 mb-2">¡Todo en orden!</p>
                <p className="text-emerald-600 text-lg">No hay alertas pendientes en este momento.</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Acciones Rápidas */}
      <div className="space-y-12">
        <div className="flex items-center space-x-4">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Acciones Rápidas
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Button className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-lg font-semibold">Llamar Cliente</span>
          </Button>
          
          <Button className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-lg font-semibold">Nueva Reserva</span>
          </Button>
          
          <Button className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-lg font-semibold">Liberar Mesa</span>
          </Button>
          
          <Button className="h-24 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-white">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-lg font-semibold">Ver Reportes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
