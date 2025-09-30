'use client';

import { use, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getRestaurantById } from '@/lib/restaurantServicePostgres';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, loading: authLoading } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    const loadRestaurantData = async () => {
      if (!restaurantId) return;
      
      // Esperar a que la autenticación se complete
      if (authLoading) return;
      
      // Verificar autenticación
      if (!isAuthenticated || !user) {
        console.log('❌ User not authenticated, redirecting to login');
        toast.error('Debes iniciar sesión para acceder al restaurante');
        router.push('/login');
        return;
      }
      
      // Verificar permisos de acceso al restaurante
      if (user.role === 'restaurant' && user.restaurantId !== restaurantId) {
        console.log('❌ User does not have access to this restaurant');
        toast.error('No tienes acceso a este restaurante');
        router.push('/login');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('🔍 Loading restaurant data for dashboard:', restaurantId);
        const data = await getRestaurantById(restaurantId);
        
        if (!data) {
          toast.error('Restaurante no encontrado');
          return;
        }
        
        if (data.status === 'inactive') {
          toast.error('Este restaurante está desactivado');
          return;
        }
        
        console.log('✅ Restaurant data loaded:', data);
        setRestaurantData(data);
      } catch (error) {
        console.error('❌ Error loading restaurant data:', error);
        
        // Manejar errores de autenticación específicamente
        if (error instanceof Error && error.message.includes('401')) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          router.push('/login');
          return;
        }
        
        toast.error('Error al cargar los datos del restaurante');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantData();
  }, [restaurantId, isAuthenticated, user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="text-sm text-gray-500">
            {authLoading ? 'Verificando autenticación...' : 'Cargando datos del restaurante...'}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurantData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl font-bold mb-4">❌ Error</div>
          <div className="text-gray-600">No se pudo cargar el restaurante</div>
          <div className="text-sm text-gray-400 mt-2">ID: {restaurantId}</div>
        </div>
      </div>
    );
  }

  // Datos dinámicos del restaurante
  const currentUserId = restaurantData.id;
  const currentUserName = restaurantData.name;
  const currentUserRole = 'manager';

  return (
    <EnhancedRestaurantDashboard
      key={`${restaurantId}-${restaurantData.name}`} // Forzar re-render con datos nuevos
      restaurantId={restaurantId}
      restaurantName={restaurantData.name}
      restaurantType={restaurantData.type || 'restaurante'}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserRole={currentUserRole}
    />
  );
}
