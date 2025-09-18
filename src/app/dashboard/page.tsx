'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/userMapping';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, RefreshCw, Phone, MessageSquare } from 'lucide-react';
import RestaurantDashboard from '@/components/restaurant/RestaurantDashboard';
import SimpleAdminDashboard from '@/components/admin/SimpleAdminDashboard';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userMapping, setUserMapping] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  console.log('DashboardPage renderizado');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        
        // Buscar el mapeo del usuario para obtener su configuración específica
        const mapping = getUserByEmail(user.email || '');
        console.log('Usuario autenticado en dashboard:', { email: user.email, mapping });
        setUserMapping(mapping);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  console.log('Estados actuales:', { isLoading, user: !!user, userMapping });

  if (isLoading) {
    console.log('Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Mostrar diferente interfaz según el role del usuario
  console.log('Decidiendo qué mostrar:', { userMapping, role: userMapping?.role });
  
  if (userMapping?.role === 'admin') {
    console.log('Mostrando SimpleAdminDashboard');
    return <SimpleAdminDashboard />;
  }
  
  console.log('Mostrando mensaje por defecto');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-orange-600 mb-4">Dashboard</h1>
        <p className="text-gray-600">Usuario: {user?.email}</p>
        <p className="text-gray-600">Role: {userMapping?.role || 'No definido'}</p>
      </div>
    </div>
  );
}
