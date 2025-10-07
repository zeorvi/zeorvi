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

      try {
        // Intentar obtener datos del servidor
        const restaurantData = await apiClient.getRestaurant(restaurantId);
        console.log('✅ Restaurant data loaded from server:', restaurantData.name);
        setRestaurant(restaurantData);
      } catch (serverError) {
        console.warn('⚠️ Server unavailable, using mock data for restaurant:', restaurantId);
        
        // Usar datos mock para rest_003 (La Gaviota)
        if (restaurantId === 'rest_003') {
          const mockRestaurantData = {
            id: 'rest_003',
            name: 'La Gaviota',
            slug: 'la-gaviota',
            owner_email: 'info@lagaviota.com',
            owner_name: 'María García',
            phone: '+34 912 345 678',
            address: 'Paseo Marítimo, 123',
            city: 'Valencia',
            country: 'España',
            config: {
              theme: 'maritime',
              features: ['reservations', 'tables', 'menu', 'ai_chat']
            },
            plan: 'premium' as const,
            status: 'active' as const,
            user_count: 1,
            retell_config: {
              agent_id: 'rest_003_agent',
              webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/retell/webhook/rest_003`,
              configured: true
            },
            twilio_config: {
              configured: false
            },
            google_sheets_config: {
              spreadsheet_id: '115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4',
              spreadsheet_url: 'https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit',
              connected: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('✅ Using mock data for La Gaviota');
          setRestaurant(mockRestaurantData);
        } else {
          throw new Error('Restaurante no encontrado');
        }
      }
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
