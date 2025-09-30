'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Importar el diseño premium consistente
import PremiumRestaurantDashboard from './PremiumRestaurantDashboard';

interface EnhancedRestaurantDashboardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}

export default function EnhancedRestaurantDashboard({ 
  restaurantId, 
  restaurantName, 
  restaurantType,
  currentUserId,
  currentUserName,
  currentUserRole
}: EnhancedRestaurantDashboardProps) {
  // Usar el diseño premium consistente
  return (
    <PremiumRestaurantDashboard
      key={`premium-${restaurantId}-${restaurantName}`} // Forzar re-render
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      restaurantType={restaurantType}
    />
  );
}