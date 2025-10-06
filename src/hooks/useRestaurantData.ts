/**
 * Hook para manejar datos del restaurante
 * Incluye manejo automático de errores y recarga de datos
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

export interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  config: Record<string, any>;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  retell_config: Record<string, any>;
  twilio_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export function useRestaurantData(restaurantId: string) {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading restaurant data for dashboard:', restaurantId);
      setLoading(true);
      setError(null);

      const restaurantData = await apiClient.getRestaurant(restaurantId);
      
      console.log('✅ Restaurant data loaded:', restaurantData.name);
      setRestaurant(restaurantData);
    } catch (error) {
      console.error('❌ Error loading restaurant data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const updateRestaurant = useCallback(async (data: Partial<RestaurantData>) => {
    if (!restaurantId) return false;

    try {
      console.log('🔄 Updating restaurant data...');
      const updatedRestaurant = await apiClient.updateRestaurant(restaurantId, data);
      
      console.log('✅ Restaurant updated successfully');
      setRestaurant(updatedRestaurant);
      return true;
    } catch (error) {
      console.error('❌ Error updating restaurant:', error);
      setError(error instanceof Error ? error.message : 'Error actualizando restaurante');
      return false;
    }
  }, [restaurantId]);

  const refreshData = useCallback(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return {
    restaurant,
    loading,
    error,
    updateRestaurant,
    refreshData,
    refetch: fetchRestaurant
  };
}
