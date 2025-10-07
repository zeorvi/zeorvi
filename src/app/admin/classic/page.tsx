'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Restaurant {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  users: number;
  reservations: number;
}

export default function ClassicAdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants');
      const data = await response.json();
      
      if (data.success) {
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRestaurantStatus = async (restaurantId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`/api/restaurants/${restaurantId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRestaurants(prev => 
          prev.map(r => 
            r.id === restaurantId 
              ? { ...r, status: newStatus as 'active' | 'inactive' }
              : r
          )
        );
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando restaurantes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración Clásico</h1>
          <p className="text-gray-600 mt-2">Gestión simple de restaurantes</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurantes ({restaurants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {restaurants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay restaurantes registrados
                </div>
              ) : (
                <div className="grid gap-4">
                  {restaurants.map((restaurant) => (
                    <div 
                      key={restaurant.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{restaurant.name}</h3>
                          <p className="text-sm text-gray-500">ID: {restaurant.id}</p>
                        </div>
                        <Badge 
                          variant={restaurant.status === 'active' ? 'default' : 'secondary'}
                        >
                          {restaurant.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          <div>{restaurant.users} usuarios</div>
                          <div>{restaurant.reservations} reservas</div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.status)}
                        >
                          {restaurant.status === 'active' ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}