'use client';

import { useState } from 'react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Mapeo de usuarios para compatibilidad con el sistema anterior
const userEmailMap: { [key: string]: string } = {
  'admin': 'admin@restauranteia.com',
  'elbuensabor': 'admin@elbuensabor.com',
  'lagaviota': 'admin@lagaviota.com',
  // Usuarios adicionales del sistema SQLite
  'administrador': 'admin@restauranteia.com',
  'restaurante': 'admin@elbuensabor.com',
  'maria': 'admin@elbuensabor.com'
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, login, logout } = useClientAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔍 Attempting login with custom auth system...');
      
      // Determinar el email a usar
      let email = username;
      
      // Si es un username conocido, usar el mapeo
      if (userEmailMap[username.toLowerCase()]) {
        email = userEmailMap[username.toLowerCase()];
        console.log(`🔄 Username '${username}' mapeado a email: ${email}`);
      } else if (username.includes('@')) {
        // Si ya es un email, usarlo directamente
        email = username;
        console.log(`📧 Usando email directamente: ${email}`);
      } else {
        console.log(`❓ Username '${username}' no encontrado en el mapeo`);
      }
      
      // Intentar login con el hook
      const result = await login(email, password);
      
      if (!result.success) {
        toast.error(result.error || 'Credenciales inválidas');
        setIsLoading(false);
        return;
      }

      if (!result.user) {
        toast.error('Error al crear la sesión');
        setIsLoading(false);
        return;
      }
      
      toast.success(`¡Bienvenido${result.user.restaurantName ? ` a ${result.user.restaurantName}` : ''}!`);
      
      // Redirigir según el rol
      if (result.user.role === 'admin') {
        // Los usuarios admin van al dashboard principal
        window.location.href = '/admin';
      } else if (result.user.role === 'restaurant' && result.user.restaurantId) {
        // Los usuarios de restaurante van a su restaurante específico
        window.location.href = `/restaurant/${result.user.restaurantId}`;
      } else {
        // Para otros roles o casos especiales, ir al dashboard
        window.location.href = '/dashboard';
      }
      
    } catch (error: any) {
      console.error('Error de login:', error);
      toast.error('Error interno del servidor. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewRestaurant = (name: string) => {
    console.log('Ver restaurante clicked:', name);
    toast.success(`👁️ Ver detalles de ${name}`);
    toast.info('Próximamente podrás ver los detalles completos del restaurante');
  };

  // Si hay usuario logueado, redirigir directamente
  if (isAuthenticated && user) {
    // PANEL DE ADMINISTRADOR - Redirección directa
    if (user.role === 'admin') {
      window.location.href = '/admin';
      return null;
    }

    // PANEL DE RESTAURANTE - Redirección directa
    if (user.role === 'restaurant' && user.restaurantId) {
      window.location.href = `/restaurant/${user.restaurantId}`;
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
                  placeholder="Usuario o email"
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