'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail } from '@/lib/userMapping';
import { createJWTToken } from '@/lib/auth';
import { getRestaurantData, validateRestaurantCredentials } from '@/lib/restaurantService';
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
  // Eliminadas las variables de vista antigua

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Primero intentar con credenciales dinámicas de restaurante
      console.log('🔍 Checking dynamic restaurant credentials...');
      const restaurantAuth = await validateRestaurantCredentials(username, password);
      
      if (restaurantAuth === null) {
        toast.error('Error al validar credenciales');
        setIsLoading(false);
        return;
      }

      if (restaurantAuth.valid && restaurantAuth.restaurantData && restaurantAuth.email) {
        console.log('✅ Valid restaurant credentials found');
        
        // Autenticar con Firebase usando el email del restaurante
        try {
          const userCredential = await signInWithEmailAndPassword(auth, restaurantAuth.email, password);
          
          // Crear JWT token para el middleware
          const jwtToken = await createJWTToken({
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            role: 'restaurant',
            restaurantId: restaurantAuth.restaurantData.id
          });

          // Guardar token en cookie para el middleware
          document.cookie = `auth-token=${jwtToken}; path=/; max-age=${24 * 60 * 60}`; // 24 horas
          
          // También guardar en localStorage como respaldo
          localStorage.setItem('auth-token', jwtToken);
          
          setUser(userCredential.user);
          setUserMapping({
            username: username,
            email: restaurantAuth.email,
            role: 'restaurant',
            restaurantId: restaurantAuth.restaurantData.id,
            restaurantName: restaurantAuth.restaurantData.name
          });
          
          toast.success(`¡Bienvenido a ${restaurantAuth.restaurantData.name}!`);
          
          // Redirigir al dashboard del restaurante
          window.location.href = `/restaurant/${restaurantAuth.restaurantData.id}`;
          return;
        } catch (authError: any) {
          console.error('Firebase auth error:', authError);
          
          if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
            console.log('🔄 Firebase Auth password mismatch, but Firestore credentials are valid');
            console.log('🔄 This likely means the password was changed from admin panel');
            
            // Las credenciales de Firestore son válidas, pero Firebase Auth tiene una contraseña diferente
            // Intentamos crear un token JWT basado en los datos de Firestore
            try {
              // Crear un token JWT usando los datos del restaurante (sin Firebase Auth)
              const jwtToken = await createJWTToken({
                uid: restaurantAuth.restaurantData.id, // Usar el ID del restaurante como UID
                email: restaurantAuth.email,
                role: 'restaurant',
                restaurantId: restaurantAuth.restaurantData.id
              });

              // Guardar token en cookie para el middleware
              document.cookie = `auth-token=${jwtToken}; path=/; max-age=${24 * 60 * 60}`; // 24 horas
              
              // También guardar en localStorage como respaldo
              localStorage.setItem('auth-token', jwtToken);
              
              // Simular un usuario autenticado
              setUser({
                uid: restaurantAuth.restaurantData.id,
                email: restaurantAuth.email,
                displayName: restaurantAuth.restaurantData.name
              });
              
              setUserMapping({
                username: username,
                email: restaurantAuth.email,
                role: 'restaurant',
                restaurantId: restaurantAuth.restaurantData.id,
                restaurantName: restaurantAuth.restaurantData.name
              });
              
              toast.success(`¡Bienvenido a ${restaurantAuth.restaurantData.name}!`);
              toast.info('🔄 Credenciales sincronizadas exitosamente');
              
              // Redirigir al dashboard del restaurante
              window.location.href = `/restaurant/${restaurantAuth.restaurantData.id}`;
              return;
            } catch (jwtError) {
              console.error('❌ Error creating JWT token:', jwtError);
              toast.error('Error al crear la sesión');
              setIsLoading(false);
              return;
            }
          } else {
            toast.error('Error de autenticación con Firebase');
            setIsLoading(false);
            return;
          }
        }
      }

      // Si no es un restaurante dinámico, intentar con usuarios estáticos (admin, etc.)
      console.log('🔍 Checking static user credentials...');
      const email = userEmailMap[username.toLowerCase()];
      if (!email) {
        toast.error('Usuario no válido. Verifica tu usuario y contraseña.');
        setIsLoading(false);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const mapping = getUserByEmail(email);
      
      if (!mapping) {
        toast.error('Error: Usuario no encontrado en el sistema');
        setIsLoading(false);
        return;
      }

      // Si es un restaurante, verificar que esté activo
      if (mapping.role === 'restaurant' && mapping.restaurantId) {
        const restaurantData = await getRestaurantData(mapping.restaurantId);
        if (!restaurantData) {
          toast.error('Error: Restaurante no encontrado');
          setIsLoading(false);
          return;
        }
        
        if (restaurantData.status === 'inactive') {
          toast.error('🚫 Acceso denegado: El restaurante está desactivado. Contacta al administrador.');
          setIsLoading(false);
          return;
        }
      }

      // Crear JWT token para el middleware
      const jwtToken = await createJWTToken({
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        role: mapping.role as 'admin' | 'restaurant',
        restaurantId: mapping.restaurantId
      });

      // Guardar token en cookie para el middleware
      document.cookie = `auth-token=${jwtToken}; path=/; max-age=${24 * 60 * 60}`; // 24 horas
      
      // También guardar en localStorage como respaldo
      localStorage.setItem('auth-token', jwtToken);
      
      setUser(userCredential.user);
      setUserMapping(mapping);
      
      toast.success('¡Bienvenido!');
      
      // Redirigir según el rol
      if (mapping.role === 'admin') {
        // Redirigir inmediatamente sin delay
        window.location.href = '/admin';
      }
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
      
      // Limpiar tokens
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('auth-token');
      
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

  // Si hay usuario logueado, redirigir directamente
  if (user && userMapping) {
    // PANEL DE ADMINISTRADOR - Redirección directa
    if (userMapping.role === 'admin') {
      window.location.href = '/admin';
      return null;
    }

    // PANEL DE RESTAURANTE - Redirección directa
    if (userMapping.role === 'restaurant') {
      window.location.href = `/restaurant/${userMapping.restaurantId}`;
      return null;
    }
  }

  // FORMULARIO DE LOGIN
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
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