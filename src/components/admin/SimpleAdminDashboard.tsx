'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, Users, Plus, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SimpleAdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada exitosamente');
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-orange-600">
                Panel de Administración
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Restaurantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">2</div>
              <p className="text-sm text-gray-600">Restaurantes activos</p>
            </CardContent>
          </Card>

          {/* Crear Restaurante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Crear Restaurante
              </Button>
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </CardContent>
          </Card>

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Sistema funcionando correctamente</p>
                <p className="text-sm text-gray-600">Último acceso: Hoy</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Lista de Restaurantes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Lista de Restaurantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nombre</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Estado</th>
                    <th className="text-left py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">Restaurante El Buen Sabor</td>
                    <td className="py-3 px-4">admin@elbuensabor.com</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">La Parrilla del Chef</td>
                    <td className="py-3 px-4">chef@laparrilla.com</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        Ver
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
