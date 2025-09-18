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
  Download,
  RefreshCw,
  ArrowLeft,
  Building
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReportData {
  restaurantId: string;
  restaurantName: string;
  period: string;
  totalReservations: number;
  averagePartySize: number;
  occupancyRate: number;
  topClients: Array<{
    name: string;
    reservations: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    reservations: number;
  }>;
  weeklyTrend: Array<{
    day: string;
    reservations: number;
  }>;
}

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const loadReportData = () => {
      setIsLoading(true);
      
      setTimeout(() => {
        const mockData: ReportData[] = [
          {
            restaurantId: 'rest_001',
            restaurantName: 'El Buen Sabor',
            period: selectedPeriod,
            totalReservations: 156,
            averagePartySize: 3.2,
            occupancyRate: 78.5,
            topClients: [
              { name: 'María González', reservations: 12 },
              { name: 'Carlos Rodríguez', reservations: 8 },
              { name: 'Ana Martín', reservations: 15 }
            ],
            hourlyDistribution: [
              { hour: '12:00', reservations: 8 },
              { hour: '13:00', reservations: 15 },
              { hour: '14:00', reservations: 12 },
              { hour: '19:00', reservations: 18 },
              { hour: '20:00', reservations: 22 },
              { hour: '21:00', reservations: 16 }
            ],
            weeklyTrend: [
              { day: 'Lun', reservations: 18 },
              { day: 'Mar', reservations: 22 },
              { day: 'Mié', reservations: 25 },
              { day: 'Jue', reservations: 28 },
              { day: 'Vie', reservations: 32 },
              { day: 'Sáb', reservations: 35 },
              { day: 'Dom', reservations: 20 }
            ]
          },
          {
            restaurantId: 'rest_002',
            restaurantName: 'La Parrilla del Chef',
            period: selectedPeriod,
            totalReservations: 89,
            averagePartySize: 2.8,
            occupancyRate: 65.2,
            topClients: [
              { name: 'Luis Fernández', reservations: 6 },
              { name: 'Elena García', reservations: 4 }
            ],
            hourlyDistribution: [
              { hour: '12:00', reservations: 5 },
              { hour: '13:00', reservations: 12 },
              { hour: '19:00', reservations: 15 },
              { hour: '20:00', reservations: 18 }
            ],
            weeklyTrend: [
              { day: 'Lun', reservations: 10 },
              { day: 'Mar', reservations: 12 },
              { day: 'Mié', reservations: 15 },
              { day: 'Jue', reservations: 18 },
              { day: 'Vie', reservations: 22 },
              { day: 'Sáb', reservations: 25 },
              { day: 'Dom', reservations: 14 }
            ]
          }
        ];
        
        setReportData(mockData);
        setIsLoading(false);
      }, 1000);
    };

    loadReportData();
  }, [selectedPeriod, selectedRestaurant]);


  const getPeriodLabel = (period: string) => {
    const labels = {
      today: 'Hoy',
      week: 'Esta Semana',
      month: 'Este Mes',
      quarter: 'Este Trimestre'
    };
    return labels[period as keyof typeof labels] || period;
  };

  const getTotalMetrics = () => {
    return reportData.reduce((totals, restaurant) => ({
      totalReservations: totals.totalReservations + restaurant.totalReservations,
      averagePartySize: (totals.averagePartySize + restaurant.averagePartySize) / reportData.length,
      occupancyRate: (totals.occupancyRate + restaurant.occupancyRate) / reportData.length
    }), { totalReservations: 0, averagePartySize: 0, occupancyRate: 0 });
  };

  const totals = getTotalMetrics();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Reportes de Restaurantes
                </h1>
                <p className="text-sm text-gray-500">
                  Análisis completo de todos los restaurantes
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
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
              
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Restaurante:</span>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Todos los restaurantes</option>
                  {reportData.map(restaurant => (
                    <option key={restaurant.restaurantId} value={restaurant.restaurantId}>
                      {restaurant.restaurantName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        ) : (
          <>
            {/* Métricas Totales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                      <p className="text-2xl font-bold text-gray-900">{totals.totalReservations}</p>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +15% vs anterior
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
                      <p className="text-sm font-medium text-gray-600">Promedio/Reserva</p>
                      <p className="text-2xl font-bold text-gray-900">{totals.averagePartySize.toFixed(1)}</p>
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
                      <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">{totals.occupancyRate.toFixed(1)}%</p>
                      <p className="text-xs text-orange-600 flex items-center">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -3% vs anterior
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reportes por Restaurante */}
            <div className="space-y-6">
              {reportData.map((restaurant) => (
                <Card key={restaurant.restaurantId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Building className="h-6 w-6 text-orange-600" />
                        <div>
                          <CardTitle>{restaurant.restaurantName}</CardTitle>
                          <CardDescription>
                            Reporte de {getPeriodLabel(selectedPeriod).toLowerCase()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        {restaurant.totalReservations} reservas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Métricas del Restaurante */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Métricas</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Reservas:</span>
                            <span className="text-sm font-medium">{restaurant.totalReservations}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Promedio/Reserva:</span>
                            <span className="text-sm font-medium">{restaurant.averagePartySize} personas</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ocupación:</span>
                            <span className="text-sm font-medium">{restaurant.occupancyRate}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Clientes */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Top Clientes</h4>
                        <div className="space-y-2">
                          {restaurant.topClients.map((client, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{client.name}</span>
                              <div className="text-right">
                                <div className="text-sm font-medium">{client.reservations} reservas</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Distribución Horaria */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Picos Horarios</h4>
                        <div className="space-y-2">
                          {restaurant.hourlyDistribution.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{item.hour}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{ width: `${(item.reservations / Math.max(...restaurant.hourlyDistribution.map(h => h.reservations))) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-6">{item.reservations}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
