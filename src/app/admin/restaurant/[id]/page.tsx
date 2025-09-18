'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RestaurantTable from '@/components/admin/RestaurantTable';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      setRestaurantId(params.id as string);
    }
  }, [params.id]);

  const handleBack = () => {
    router.push('/admin/restaurants');
  };

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantTable 
        restaurantId={restaurantId} 
        onBack={handleBack}
      />
    </div>
  );
}

