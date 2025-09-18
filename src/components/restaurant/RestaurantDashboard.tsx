'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Building, 
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  RefreshCw,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Phone,
  MessageSquare
} from 'lucide-react';
import TablePlan from './TablePlan';
import ReservationCalendar from './ReservationCalendar';
import DailyAgenda from './DailyAgenda';
import ReservationManagement from './ReservationManagement';
import FreeTablesManagement from './FreeTablesManagement';
import OccupiedTablesManagement from './OccupiedTablesManagement';
import ReservedTablesManagement from './ReservedTablesManagement';
import RealTimeNotifications from './RealTimeNotifications';
import { useOccupiedTables } from '@/lib/services/occupiedTablesService';
import ClientManagement from './ClientManagement';
import ReportsManagement from './ReportsManagement';
import ConfigurationManagement from './ConfigurationManagement';
import { getRestaurantMetrics } from '@/lib/restaurantData';
import { autoTableCleanup } from '@/lib/services/autoTableCleanup';
import { toast } from 'sonner';

interface RestaurantDashboardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType?: string;
}

export default function RestaurantDashboard({ 
  restaurantId, 
  restaurantName, 
  restaurantType 
}: RestaurantDashboardProps) {
  const [activeView, setActiveView] = useState<'agenda' | 'salon' | 'gestion'>('salon');
  const [activeSubView, setActiveSubView] = useState<string>('plano-mesas');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Hook para mesas ocupadas
  const { getStats } = useOccupiedTables();
  const [metrics, setMetrics] = useState(getRestaurantMetrics());
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'reservation',
      message: 'Nueva reserva confirmada para Mesa M6',
      time: '2 min',
      unread: true
    },
    {
      id: 2,
      type: 'call',
      message: 'Llamada recibida - Cliente interesado en reserva',
      time: '5 min',
      unread: true
    }
  ]);

  // Actualizar métricas cada 30 segundos e iniciar limpieza automática
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getRestaurantMetrics());
    }, 30000);
    
    // Iniciar servicio de limpieza automática
    autoTableCleanup.start();
    
    // Escuchar eventos de limpieza automática
    const handleAutoCleanup = (event: any) => {
      toast.success(`🧹 ${event.detail.count} mesa(s) liberada(s) automáticamente después de 2.5 horas`);
      toast.info('Las mesas están ahora disponibles para nuevas reservas');
      setMetrics(getRestaurantMetrics()); // Actualizar métricas inmediatamente
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('auto-table-cleanup', handleAutoCleanup);
    }
    
    return () => {
      clearInterval(interval);
      autoTableCleanup.stop();
      if (typeof window !== 'undefined') {
        window.removeEventListener('auto-table-cleanup', handleAutoCleanup);
      }
    };
  }, []);

  const navigationItems = [
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Globe,
      subItems: [
        { id: 'gestion-reservas', label: 'Gestión de Reservas' },
        { id: 'agenda-diaria', label: 'Agenda diaria' }
      ]
    },
    {
      id: 'salon',
      label: 'Comensales',
      icon: Building,
      subItems: [
        { id: 'plano-mesas', label: 'Plano de mesas' },
        { id: 'mesas-libres', label: 'Mesas libres' },
        { id: 'mesas-ocupadas', label: 'Mesas ocupadas' },
        { id: 'mesas-reservadas', label: 'Mesas reservadas' }
      ]
    },
    {
      id: 'gestion',
      label: 'Gestión',
      icon: Settings,
      subItems: [
        { id: 'clientes', label: 'Clientes' },
        { id: 'configuracion', label: 'Configuración' }
      ]
    }
  ];

  const handleViewChange = (viewId: string, subViewId?: string) => {
    setActiveView(viewId as any);
    if (subViewId) {
      setActiveSubView(subViewId);
    }
  };

  const renderContent = () => {
    switch (activeSubView) {
      case 'plano-mesas':
        return <TablePlan restaurantId={restaurantId} />;
      case 'gestion-reservas':
        return <ReservationManagement restaurantId={restaurantId} />;
      case 'agenda-diaria':
        return <DailyAgenda restaurantId={restaurantId} />;
      case 'mesas-libres':
        return <FreeTablesManagement restaurantId={restaurantId} />;
      case 'mesas-ocupadas':
        return <OccupiedTablesManagement restaurantId={restaurantId} />;
      case 'mesas-reservadas':
        return <ReservedTablesManagement restaurantId={restaurantId} />;
      case 'clientes':
        return <ClientManagement restaurantId={restaurantId} />;
      case 'configuracion':
        return <ConfigurationManagement 
          restaurantId={restaurantId} 
          restaurantName={restaurantName}
          restaurantType={restaurantType}
        />;
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Vista en desarrollo</h3>
            <p className="text-gray-600">
              Esta funcionalidad estará disponible próximamente
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {restaurantName}
                </h1>
                {restaurantType && (
                  <p className="text-sm text-gray-500">{restaurantType}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notificaciones en tiempo real */}
            <RealTimeNotifications restaurantId={restaurantId} />

            {/* Métricas rápidas */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{metrics.freeTables}</div>
                <div className="text-xs text-gray-500">Libres</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-pink-600">{metrics.occupiedTables}</div>
                <div className="text-xs text-gray-500">Ocupadas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{metrics.reservedTables}</div>
                <div className="text-xs text-gray-500">Reservadas</div>
              </div>
            </div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0">
        {/* Sidebar */}
        <div className="w-56 md:w-64 lg:w-72 bg-green-600 text-white flex-shrink-0 sticky top-0 z-10 block h-screen">
          <div className="p-4">
            {/* Nombre del Restaurante */}
            <div className="mb-6 pb-4 border-b border-green-500">
              <h2 className="text-lg font-bold text-white">{restaurantName}</h2>
            </div>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 md:py-3 rounded-lg text-left transition-colors text-sm md:text-base ${
                      activeView === item.id
                        ? 'bg-green-700 text-white'
                        : 'text-green-100 hover:bg-green-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                  
                  {activeView === item.id && item.subItems && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleViewChange(item.id, subItem.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            activeSubView === subItem.id
                              ? 'bg-green-800 text-white'
                              : 'text-green-200 hover:bg-green-700'
                          }`}
                        >
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

        </div>

        {/* Contenido principal */}
        <div className="flex-1 bg-gray-50 p-6 lg:p-8 min-w-0 overflow-hidden min-h-screen">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
