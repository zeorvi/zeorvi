'use client';

import { useClientAuth } from '@/hooks/useClientAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="text-sm text-gray-500">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleGoToRestaurant = () => {
    if (user.restaurantId) {
      router.push(`/restaurant/${user.restaurantId}`);
    } else {
      toast.error('No tienes un restaurante asignado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
              <CardDescription>Datos de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Usuario:</strong> {user.email}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {user.role}</p>
              {user.restaurantId && (
                <>
                  <p><strong>Restaurante ID:</strong> {user.restaurantId}</p>
                  <p><strong>Restaurante:</strong> {user.restaurantName}</p>
                </>
              )}
            </CardContent>
          </Card>

          {user.restaurantId && (
            <Card>
              <CardHeader>
                <CardTitle>Acceso al Restaurante</CardTitle>
                <CardDescription>Gestiona tu restaurante</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGoToRestaurant}
                  className="w-full"
                >
                  Ir al Dashboard del Restaurante
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
