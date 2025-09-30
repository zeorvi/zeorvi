'use client';

import { useState } from 'react';
import PremiumRestaurantDashboard from './PremiumRestaurantDashboard';

interface RestaurantDashboardProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

export default function RestaurantDashboard({ 
  restaurantId, 
  restaurantName, 
  restaurantType 
}: RestaurantDashboardProps) {
  // Usar el nuevo dashboard premium
  return (
    <PremiumRestaurantDashboard
      restaurantId={restaurantId}
      restaurantName={restaurantName}
      restaurantType={restaurantType}
    />
  );
}