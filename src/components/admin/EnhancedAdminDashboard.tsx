'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Importar componentes existentes
import SimpleAdminDashboard from './SimpleAdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

// Importar herramientas específicas
import AutoTableGenerator from './AutoTableGenerator';
import RestaurantIdentifier from './RestaurantIdentifier';
import UserCredentials from './UserCredentials';

interface EnhancedAdminDashboardProps {
  adminId: string;
  adminName: string;
  adminRole: 'super_admin' | 'admin' | 'restaurant_admin';
}

export default function EnhancedAdminDashboard({ 
  adminId, 
  adminName, 
  adminRole 
}: EnhancedAdminDashboardProps) {
  const [activeView, setActiveView] = useState<
    'overview' | 'classic' | 'simple' | 'tools' | 'restaurants' | 'analytics'
  >('overview');
  const [selectedTool, setSelectedTool] = useState<
    'table_generator' | 'restaurant_identifier' | 'credentials' | null
  >(null);
  const router = useRouter();

  // Determinar qué vistas están disponibles según el rol
  const availableViews = {
    super_admin: [
      { id: 'overview', label: '🏢 Vista Ejecutiva', description: 'Dashboard completo de la plataforma' },
      { id: 'classic', label: '🏪 Gestión Clásica', description: 'Panel tradicional de administración' },
      { id: 'tools', label: '🛠️ Herramientas', description: 'Utilidades para configuración' },
    ],
    admin: [
      { id: 'classic', label: '🏪 Panel Principal', description: 'Gestión completa de restaurantes' },
      { id: 'simple', label: '📋 Vista Simplificada', description: 'Panel básico de administración' },
      { id: 'tools', label: '🛠️ Herramientas', description: 'Generadores y utilidades' }
    ],
    restaurant_admin: [
      { id: 'simple', label: '📋 Mi Panel', description: 'Gestión básica del restaurante' },
      { id: 'tools', label: '🛠️ Configuración', description: 'Herramientas de configuración' }
    ]
  };

  const currentViews = availableViews[adminRole] || availableViews.admin;

  const tools = [
    {
      id: 'table_generator',
      name: 'Generador de Mesas',
      description: 'Crear automáticamente la configuración de mesas',
      icon: '🪑',
      component: AutoTableGenerator
    },
    {
      id: 'restaurant_identifier',
      name: 'Identificador de Restaurantes',
      description: 'Gestión avanzada de identificación',
      icon: '🏪',
      component: RestaurantIdentifier
    },
    {
      id: 'credentials',
      name: 'Generador de Credenciales',
      description: 'Crear usuarios y contraseñas automáticamente',
      icon: '🔐',
      component: UserCredentials
    }
  ];

  const renderContent = () => {
    // Si hay una herramienta seleccionada, mostrarla
    if (selectedTool) {
      const tool = tools.find(t => t.id === selectedTool);
      if (tool) {
        const ToolComponent = tool.component;
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  {tool.icon} {tool.name}
                </h2>
                <p className="text-gray-600">{tool.description}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedTool(null)}
              >
                ← Volver
              </Button>
            </div>
            <ToolComponent 
              username=""
              email=""
              password=""
              restaurantName=""
              onClose={() => setSelectedTool(null)}
            />
          </div>
        );
      }
    }

    // Mostrar vista según selección
    switch (activeView) {
      case 'overview':
        return (
          <SuperAdminDashboard 
            adminId={adminId} 
            adminName={adminName} 
          />
        );
      
      case 'classic':
        return <SimpleAdminDashboard />;
      
      case 'simple':
        return <SimpleAdminDashboard />;
      
      case 'tools':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                🛠️ Herramientas de Administración
              </h2>
              <p className="text-gray-300">
                Utilidades para configurar y gestionar restaurantes
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map(tool => (
                <div 
                  key={tool.id}
                  className="relative group cursor-pointer"
                  onClick={() => setSelectedTool(tool.id as any)}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-6 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300">
                    <div className="space-y-4">
                      <div className="text-4xl text-center">{tool.icon}</div>
                      <div className="text-center">
                        <h3 className="font-semibold text-white mb-2">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-gray-300">
                          {tool.description}
                        </p>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold shadow-lg">
                        Abrir Herramienta
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Accesos rápidos a páginas existentes */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-6">
                📱 Accesos Rápidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-1 bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
                  onClick={() => router.push('/admin/restaurants')}
                >
                  <span className="text-xl">🏪</span>
                  <span className="text-sm">Restaurantes</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-1 bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400"
                  onClick={() => router.push('/admin/reports')}
                >
                  <span className="text-xl">📊</span>
                  <span className="text-sm">Reportes</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-1 bg-transparent border-pink-400/50 text-pink-300 hover:bg-pink-400/20 hover:border-pink-400"
                  onClick={() => router.push('/admin/flow')}
                >
                  <span className="text-xl">🔄</span>
                  <span className="text-sm">Flujo</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center gap-1 bg-transparent border-green-400/50 text-green-300 hover:bg-green-400/20 hover:border-green-400"
                  onClick={() => router.push('/admin/credentials-simple')}
                >
                  <span className="text-xl">🔐</span>
                  <span className="text-sm">Credenciales</span>
                </Button>
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                📊 Analíticas Avanzadas
              </h2>
              <p className="text-gray-300">
                Métricas detalladas y reportes de toda la plataforma
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-6 shadow-2xl shadow-cyan-500/20">
                  <h3 className="font-semibold text-white mb-4 text-lg">
                    📈 Crecimiento de la Plataforma
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Restaurantes nuevos (mes)</span>
                      <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-sm font-semibold shadow-lg">
                        +12
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Usuarios activos</span>
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white text-sm font-semibold shadow-lg">
                        156
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Llamadas IA procesadas</span>
                      <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-semibold shadow-lg">
                        12,847
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-6 shadow-2xl shadow-purple-500/20">
                  <h3 className="font-semibold text-white mb-4 text-lg">
                    💰 Ingresos y Facturación
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Ingresos mensuales</span>
                      <span className="font-bold text-green-400 text-lg">$284,765</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Crecimiento vs mes anterior</span>
                      <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-sm font-semibold shadow-lg">
                        +24.7%
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Tasa de retención</span>
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white text-sm font-semibold shadow-lg">
                        94.2%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold shadow-lg py-3"
              onClick={() => router.push('/admin/reports')}
            >
              📊 Ver Reportes Detallados
            </Button>
          </div>
        );
      
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Header unificado */}
      <div className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-cyan-400/30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-300">
                  Bienvenido, {adminName} ({adminRole.replace('_', ' ')})
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-sm font-semibold shadow-lg">
                🟢 Sistema Activo
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/settings')}
                className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
              >
                ⚙️ Configuración
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas mejorada */}
      <div className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-cyan-400/20">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3">
            {currentViews.map(view => (
              <button
                key={view.id}
                onClick={() => {
                  setActiveView(view.id as any);
                  setSelectedTool(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeView === view.id && !selectedTool
                    ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-white border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/50 hover:border-slate-600/50'
                }`}
                title={view.description}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 p-8">
        {renderContent()}
      </div>
    </div>
  );
}
