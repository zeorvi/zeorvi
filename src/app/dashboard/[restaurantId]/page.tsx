'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PremiumRestaurantDashboard from '@/components/restaurant/PremiumRestaurantDashboard';

interface RestaurantData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  features: string[];
  tables: any[];
  schedules: any[];
  googleSheets: {
    spreadsheetId: string;
    spreadsheetUrl: string;
    created: boolean;
  };
  retellAI: {
    agentId: string;
    webhookUrl: string;
    configured: boolean;
    error?: string;
  };
  dashboard: {
    url: string;
    available: boolean;
  };
}

export default function RestaurantDashboardPage() {
  const params = useParams();
  const restaurantId = params?.restaurantId as string;
  
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      
      // En un sistema real, aquí harías una llamada a la API para obtener los datos del restaurante
      // Por ahora, simulamos los datos
      const mockData: RestaurantData = {
        id: restaurantId,
        name: `Restaurante ${restaurantId}`,
        address: 'Calle Ejemplo 123',
        phone: '555-0000',
        email: 'info@restaurante.com',
        capacity: 50,
        features: ['Terraza', 'WiFi', 'Parking'],
        tables: [
          { id: 'table_1', number: 'Mesa 1', capacity: 2, location: 'Salón Principal', type: 'indoor' },
          { id: 'table_2', number: 'Mesa 2', capacity: 4, location: 'Terraza', type: 'outdoor' },
          { id: 'table_3', number: 'Mesa 3', capacity: 6, location: 'Salón Privado', type: 'private' }
        ],
        schedules: [
          { day: 'Lunes', openTime: '12:00', closeTime: '23:00', isOpen: true },
          { day: 'Martes', openTime: '12:00', closeTime: '23:00', isOpen: true },
          { day: 'Miércoles', openTime: '12:00', closeTime: '23:00', isOpen: true },
          { day: 'Jueves', openTime: '12:00', closeTime: '23:00', isOpen: true },
          { day: 'Viernes', openTime: '12:00', closeTime: '24:00', isOpen: true },
          { day: 'Sábado', openTime: '12:00', closeTime: '24:00', isOpen: true },
          { day: 'Domingo', openTime: '12:00', closeTime: '22:00', isOpen: true }
        ],
        googleSheets: {
          spreadsheetId: `spreadsheet_${restaurantId}`,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/spreadsheet_${restaurantId}/edit`,
          created: true
        },
        retellAI: {
          agentId: `${restaurantId}_agent`,
          webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
          configured: true
        },
        dashboard: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/${restaurantId}`,
          available: true
        }
      };

      setRestaurantData(mockData);
      setError(null);
    } catch (error) {
      console.error('Error cargando datos del restaurante:', error);
      setError('Error cargando datos del restaurante');
      toast.error('Error cargando datos del restaurante');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Cargando dashboard del restaurante...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Error</h1>
            <p className="text-slate-600">{error || 'Restaurante no encontrado'}</p>
            <Button 
              onClick={loadRestaurantData}
              className="w-full"
            >
              🔄 Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Dashboard del Restaurante */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PremiumRestaurantDashboard
          restaurantId={restaurantData.id}
          restaurantName={restaurantData.name}
          restaurantType="restaurant"
        />
      </div>
    </div>
  );
}
