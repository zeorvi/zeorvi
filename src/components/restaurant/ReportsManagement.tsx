'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ReportData {
  period: string;
  totalReservations: number;
  totalRevenue: number;
  averagePartySize: number;
  occupancyRate: number;
  topClients: Array<{
    name: string;
    reservations: number;
    revenue: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    reservations: number;
  }>;
  weeklyTrend: Array<{
    day: string;
    reservations: number;
    revenue: number;
  }>;
}

export default function ReportsManagement({ restaurantId }: { restaurantId: string }) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const loadReportData = () => {
      setIsLoading(true);
      
      // Simular carga de datos
      setTimeout(() => {
        const mockData: ReportData = {
          period: selectedPeriod,
          totalReservations: 156,
          totalRevenue: 12450,
          averagePartySize: 3.2,
          occupancyRate: 78.5,
          topClients: [
            { name: 'María González', reservations: 12, revenue: 980 },
            { name: 'Carlos Rodríguez', reservations: 8, revenue: 650 },
            { name: 'Ana Martín', reservations: 15, revenue: 1200 },
            { name: 'Luis Fernández', reservations: 6, revenue: 480 }
          ],
          hourlyDistribution: [
            { hour: '12:00', reservations: 8 },
            { hour: '13:00', reservations: 15 },
            { hour: '14:00', reservations: 12 },
            { hour: '19:00', reservations: 18 },
            { hour: '20:00', reservations: 22 },
            { hour: '21:00', reservations: 16 },
            { hour: '22:00', reservations: 8 }
          ],
          weeklyTrend: [
            { day: 'Lun', reservations: 18, revenue: 1440 },
            { day: 'Mar', reservations: 22, revenue: 1760 },
            { day: 'Mié', reservations: 25, revenue: 2000 },
            { day: 'Jue', reservations: 28, revenue: 2240 },
            { day: 'Vie', reservations: 32, revenue: 2560 },
            { day: 'Sáb', reservations: 35, revenue: 2800 },
            { day: 'Dom', reservations: 20, revenue: 1600 }
          ]
        };
        
        setReportData(mockData);
        setIsLoading(false);
      }, 1000);
    };

    loadReportData();
  }, [selectedPeriod, restaurantId]);

  const handleExportReport = () => {
    // Simular exportación
    console.log('Exportando reporte...');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      today: 'Hoy',
      week: 'Esta Semana',
      month: 'Este Mes',
      quarter: 'Este Trimestre'
    };
    return labels[period as keyof typeof labels] || period;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión &gt; Reportes</h1>
          <p className="text-gray-600 mt-1">
            Analiza el rendimiento y las tendencias del restaurante
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setSelectedPeriod(selectedPeriod)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Período:</span>
            <div className="flex space-x-2">
              {[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Esta Semana' },
                { value: 'month', label: 'Este Mes' },
                { value: 'quarter', label: 'Este Trimestre' }
              ].map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value as any)}
                  className={selectedPeriod === period.value ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Cargando reporte...</p>
        </div>
      ) : reportData ? (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reservas</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totalReservations}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% vs anterior
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% vs anterior
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Promedio/Reserva</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.averagePartySize}</p>
                    <p className="text-xs text-gray-500">personas</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ocupación</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.occupancyRate}%</p>
                    <p className="text-xs text-orange-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -2% vs anterior
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución Horaria */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Horas</CardTitle>
                <CardDescription>
                  Reservas por franja horaria en {getPeriodLabel(selectedPeriod).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.hourlyDistribution.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 text-sm text-gray-600">{item.hour}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(item.reservations / Math.max(...reportData.hourlyDistribution.map(h => h.reservations))) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm font-medium text-gray-900">{item.reservations}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tendencia Semanal */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Semanal</CardTitle>
                <CardDescription>
                  Reservas e ingresos por día de la semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.weeklyTrend.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 text-sm font-medium text-gray-600">{item.day}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(item.reservations / Math.max(...reportData.weeklyTrend.map(d => d.reservations))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{item.reservations}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(item.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes</CardTitle>
              <CardDescription>
                Clientes con más reservas en {getPeriodLabel(selectedPeriod).toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.reservations} reservas</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(client.revenue)}</div>
                      <div className="text-sm text-gray-500">ingresos</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-600">
              Selecciona un período diferente o verifica la configuración
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

