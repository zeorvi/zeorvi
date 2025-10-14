'use client';

import { useEffect } from 'react';
import { useDashboardProtection } from '@/lib/dashboardProtection';
import PremiumRestaurantDashboard from './PremiumRestaurantDashboard';

interface ProtectedDashboardProps {
  restaurantId: string;
  restaurantName?: string;
  restaurantType?: string;
}

/**
 * Componente de Dashboard Protegido
 * Asegura que todos los restaurantes usen la configuración estándar optimizada
 */
export default function ProtectedDashboard({ 
  restaurantId, 
  restaurantName, 
  restaurantType 
}: ProtectedDashboardProps) {
  
  // Aplicar protección del dashboard
  const dashboardConfig = useDashboardProtection(restaurantId);
  
  useEffect(() => {
    console.log(`🔒 [ProtectedDashboard] Aplicando configuración estándar para ${restaurantId}`);
    console.log(`📱 [ProtectedDashboard] Configuración responsive:`, dashboardConfig.responsiveConfig);
  }, [restaurantId, dashboardConfig]);
  
  return (
    <div className="protected-dashboard">
      {/* Indicador de protección (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 right-0 z-50 bg-green-500 text-white px-3 py-1 text-xs font-bold">
          🔒 Dashboard Protegido
        </div>
      )}
      
      {/* Dashboard estándar optimizado */}
      <PremiumRestaurantDashboard
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        restaurantType={restaurantType}
      />
    </div>
  );
}
