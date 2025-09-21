'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/userMapping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, Users, Settings, BarChart3, Phone } from 'lucide-react';
import RestaurantDashboard from '@/components/restaurant/RestaurantDashboard';

// Mapeo de usuarios a emails para Firebase Auth
const userEmailMap: { [key: string]: string } = {
  'admin': 'admin@restauranteia.com',
  'elbuensabor': 'admin@elbuensabor.com'
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMapping, setUserMapping] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-restaurant' | 'configuration' | 'users' | 'reports' | 'view-restaurant'>('dashboard');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convertir username a email
      const email = userEmailMap[username.toLowerCase()];
      if (!email) {
        toast.error('Usuario no válido. Usuarios: admin, elbuensabor');
        setIsLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const mapping = getUserByEmail(email);
      
      setUser(userCredential.user);
      setUserMapping(mapping);
      
      toast.success('¡Bienvenido!');
    } catch (error: any) {
      console.error('Error de login:', error);
      let errorMessage = 'Error al iniciar sesión';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserMapping(null);
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Error logout:', error);
    }
  };

  const createRestaurant = () => {
    console.log('Crear restaurante clicked');
    toast.success('🎉 Funcionalidad de crear restaurante - En desarrollo');
    toast.info('Próximamente podrás crear nuevos restaurantes aquí');
  };

  const openConfiguration = () => {
    console.log('Configuración clicked');
    toast.success('⚙️ Funcionalidad de configuración - En desarrollo');
    toast.info('Próximamente podrás configurar el sistema aquí');
  };

  const viewRestaurant = (name: string) => {
    console.log('Ver restaurante clicked:', name);
    toast.success(`👁️ Ver detalles de ${name}`);
    toast.info('Próximamente podrás ver los detalles completos del restaurante');
  };

  // Si hay usuario logueado, mostrar dashboard
  if (user && userMapping) {
    // PANEL DE ADMINISTRADOR
    if (userMapping.role === 'admin') {
      return (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16 md:h-20">
                <div className="flex items-center space-x-4">
                  {currentView !== 'dashboard' && (
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      ← Volver
                    </button>
                  )}
                  <h1 className="text-2xl font-light text-gray-900 tracking-wide">
                    {currentView === 'dashboard' && '⚡ Panel de Administración'}
                    {currentView === 'create-restaurant' && '🏪 Crear Nuevo Restaurante'}
                    {currentView === 'configuration' && '⚙️ Configuración del Sistema'}
                    {currentView === 'users' && '👥 Gestionar Usuarios'}
                    {currentView === 'reports' && '📊 Reportes y Estadísticas'}
                    {currentView === 'view-restaurant' && `🏪 ${selectedRestaurant}`}
                  </h1>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="font-light tracking-wide">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </header>

          <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg font-light tracking-wide">
                    <Users className="h-6 w-6 mr-3 text-orange-500" />
                    Restaurantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-light text-orange-600 mb-1">2</div>
                  <p className="text-sm text-gray-600 font-light">Restaurantes activos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Reservas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">45</div>
                  <p className="text-sm text-gray-600">Reservas hoy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Acciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-2">
                    <button 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      onClick={() => {
                        setCurrentView('create-restaurant');
                        toast.success('🎉 Abriendo Crear Restaurante');
                      }}
                    >
                      ➕ Crear Restaurante
                    </button>
                    
                    <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      onClick={() => {
                        setCurrentView('users');
                        toast.success('👥 Abriendo Gestionar Usuarios');
                      }}
                    >
                      👥 Gestionar Usuarios
                    </button>
                    
                    <button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      onClick={() => {
                        setCurrentView('reports');
                        toast.success('📊 Abriendo Ver Reportes');
                      }}
                    >
                      📊 Ver Reportes
                    </button>
                    
                    <button 
                      className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                      onClick={() => {
                        setCurrentView('configuration');
                        toast.success('⚙️ Abriendo Configuración');
                      }}
                    >
                      ⚙️ Configuración
                    </button>
                    
                    <button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      onClick={async () => {
                        toast.info('🤖 Simulando llamada de Retell...');
                        try {
                          const response = await fetch('/api/retell/simulate-call', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              message: 'Hola, me llamo Ana Martín y quiero una mesa para 2 personas a las 8 de la noche',
                              restaurantId: 'rest_001'
                            })
                          });
                          const result = await response.json();
                          if (result.success) {
                            toast.success('🎉 Reserva creada por Retell AI');
                            toast.info('Dashboard actualizado automáticamente');
                          }
                        } catch (error) {
                          toast.error('Error en simulación');
                        }
                      }}
                    >
                      🤖 Simular Llamada Retell
                    </button>
                  </div>
                </CardContent>
              </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Restaurantes</CardTitle>
                </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Nombre</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Teléfono</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">Restaurante El Buen Sabor</div>
                            <div className="text-sm text-gray-500">Familiar</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">admin@elbuensabor.com</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <span>+34 912 345 678</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Activo
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                            onClick={() => {
                              console.log('VER EL BUEN SABOR CLICKED!');
                              toast.success('👁️ Ver Restaurante El Buen Sabor');
                              toast.info('Accediendo a los detalles del restaurante...');
                            }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">La Parrilla del Chef</div>
                            <div className="text-sm text-gray-500">Gourmet</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">chef@laparrilla.com</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-500 mr-2" />
                            <span>+34 913 456 789</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Activo
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button 
                            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                            onClick={() => {
                              console.log('VER LA PARRILLA DEL CHEF CLICKED!');
                              toast.success('👁️ Ver Restaurante La Parrilla del Chef');
                              toast.info('Accediendo a los detalles del restaurante...');
                            }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
              </Card>
            </div>
            )}

            {/* PANTALLA CREAR RESTAURANTE */}
            {currentView === 'create-restaurant' && (
              <Card>
                <CardHeader>
                  <CardTitle>Crear Nuevo Restaurante</CardTitle>
                  <CardDescription>
                    Completa la información para crear una nueva cuenta de restaurante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre del Restaurante</Label>
                        <Input placeholder="Ej: Mi Restaurante" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" placeholder="admin@restaurante.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Teléfono</Label>
                        <Input placeholder="+34 912 345 678" />
                      </div>
                      <div>
                        <Label>Tipo de Restaurante</Label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                          <option>Seleccionar...</option>
                          <option>Familiar</option>
                          <option>Gourmet</option>
                          <option>Casual</option>
                          <option>Fast Food</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Input placeholder="Calle Principal 123, Ciudad" />
                    </div>
                    <div className="flex space-x-4">
                      <button 
                        type="button"
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
                        onClick={() => toast.success('Restaurante creado exitosamente')}
                      >
                        Crear Restaurante
                      </button>
                      <button 
                        type="button"
                        className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-md font-medium"
                        onClick={() => setCurrentView('dashboard')}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* PANTALLA CONFIGURACIÓN */}
            {currentView === 'configuration' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nombre de la Plataforma</Label>
                      <Input defaultValue="Restaurante IA Plataforma" />
                    </div>
                    <div>
                      <Label>Email de Administrador</Label>
                      <Input defaultValue="admin@restauranteia.com" />
                    </div>
                    <div>
                      <Label>Zona Horaria</Label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option>Europe/Madrid</option>
                        <option>America/New_York</option>
                        <option>America/Los_Angeles</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Notificaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="email-notif" defaultChecked />
                      <label htmlFor="email-notif">Notificaciones por email</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="sms-notif" />
                      <label htmlFor="sms-notif">Notificaciones por SMS</label>
                    </div>
                    <button 
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
                      onClick={() => toast.success('Configuración guardada')}
                    >
                      Guardar Cambios
                    </button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PANTALLA USUARIOS */}
            {currentView === 'users' && (
              <Card>
                <CardHeader>
                  <CardTitle>Gestionar Usuarios</CardTitle>
                  <CardDescription>
                    Lista de todos los usuarios del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Usuario</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Rol</th>
                          <th className="text-left py-3 px-4">Estado</th>
                          <th className="text-left py-3 px-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">admin</td>
                          <td className="py-3 px-4">admin@restauranteia.com</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                              Administrador
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Activo
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button 
                              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-sm font-medium"
                              onClick={() => toast.info('Editar usuario admin')}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">elbuensabor</td>
                          <td className="py-3 px-4">admin@elbuensabor.com</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              Restaurante
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              Activo
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button 
                              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded text-sm font-medium"
                              onClick={() => toast.info('Editar usuario elbuensabor')}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PANTALLA REPORTES */}
            {currentView === 'reports' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-orange-600">156</div>
                      <p className="text-sm text-gray-600">Reservas Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <p className="text-sm text-gray-600">Ocupación Promedio</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Reservas por Restaurante</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>El Buen Sabor</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-600 h-2 rounded-full" style={{width: '75%'}}></div>
                          </div>
                          <span className="text-sm font-medium">89 reservas</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>La Parrilla del Chef</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-600 h-2 rounded-full" style={{width: '60%'}}></div>
                          </div>
                          <span className="text-sm font-medium">67 reservas</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      );
    }

    // DASHBOARD DE RESTAURANTE - Componente original completo
    return (
      <RestaurantDashboard
        restaurantId={user?.uid || ''}
        restaurantName={userMapping.restaurantName || 'Restaurante'}
        restaurantType={userMapping.restaurantType || 'Familiar'}
      />
    );
  }

  // FORMULARIO DE LOGIN
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-cyan-900 to-purple-900 relative overflow-hidden p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md md:max-w-lg lg:max-w-xl">
        <Card className="bg-black/40 backdrop-blur-xl border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-light bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-wider">
              ZEORVI
            </CardTitle>
            <CardDescription className="text-gray-300 font-light text-lg mt-2">
              Inicia sesión para acceder a tu dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="username" className="text-base font-light text-gray-200 tracking-wide">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin o elbuensabor"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-14 text-base bg-black/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 rounded-xl font-light"
                />
              </div>
              <div className="space-y-4">
                <Label htmlFor="password" className="text-base font-light text-gray-200 tracking-wide">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 text-base bg-black/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 rounded-xl font-light"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 h-14 text-lg font-light tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}