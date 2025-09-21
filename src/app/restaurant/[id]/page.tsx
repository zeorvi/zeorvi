'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

// Importar el dashboard mejorado dinámicamente
const EnhancedRestaurantDashboard = dynamic(
  () => import('@/components/restaurant/EnhancedRestaurantDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="text-sm text-gray-500">Inicializando restaurante...</div>
        </div>
      </div>
    )
  }
);

interface RestaurantPageProps {
  params: Promise<{ id: string }>;
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const { id: restaurantId } = use(params);

  // En producción, estos datos vendrían del contexto de autenticación
  const currentUserId = 'user_001';
  const currentUserName = 'Usuario Demo';
  const currentUserRole = 'manager';

  // En producción, estos datos vendrían de Firebase/API
  const restaurantName = `Restaurante ${restaurantId}`;
  const restaurantType = 'restaurante';

  return (
    <EnhancedRestaurantDashboard
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      restaurantType={restaurantType}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserRole={currentUserRole}
    />
  );
}
