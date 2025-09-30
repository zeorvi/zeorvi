'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  RefreshCw,
  Clock,
  Calendar,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface UserCredentialsCardProps {
  restaurantId: string;
  restaurantName: string;
}

interface UserInfo {
  email: string;
  name: string;
  role: string;
  created_at: string;
  last_login?: string;
  status: string;
}

export default function UserCredentialsCard({ 
  restaurantId, 
  restaurantName 
}: UserCredentialsCardProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('admin123'); // Contraseña por defecto

  useEffect(() => {
    loadUserInfo();
  }, [restaurantId]);

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${restaurantId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserInfo(data.user);
          console.log('✅ User info loaded for credentials card:', data.user);
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const copyAllCredentials = () => {
    if (!userInfo) return;
    
    const credentials = `Restaurante: ${restaurantName}
Usuario: ${userInfo.email}
Contraseña: ${currentPassword}

Accede a: ${window.location.origin}`;
    
    copyToClipboard(credentials, 'Todas las credenciales');
  };

  const refreshCredentials = () => {
    loadUserInfo();
    toast.success('Credenciales actualizadas');
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Key className="h-5 w-5 mr-2" />
            Credenciales de Acceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="h-4 bg-blue-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userInfo) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <Key className="h-5 w-5 mr-2" />
            Credenciales de Acceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">No se pudieron cargar las credenciales</p>
          <Button 
            onClick={refreshCredentials}
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-blue-700">
            <Key className="h-5 w-5 mr-2" />
            Credenciales de Acceso
          </CardTitle>
          <Button 
            onClick={refreshCredentials}
            variant="outline" 
            size="sm"
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-600">
          Información de acceso al sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usuario */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-blue-700 flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Usuario
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-gray-800 font-mono text-sm">
              {userInfo.email}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(userInfo.email, 'Usuario')}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-blue-700 flex items-center">
            <Key className="h-4 w-4 mr-2" />
            Contraseña
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-gray-800 font-mono text-sm">
              {showPassword ? currentPassword : '••••••••••'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(currentPassword, 'Contraseña')}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="pt-3 border-t border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Nombre:</span>
              <span className="text-sm font-medium text-blue-800">{userInfo.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Usuario desde:</span>
              <span className="text-sm font-medium text-blue-800">
                {new Date(userInfo.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-600">Último acceso:</span>
              <span className="text-sm font-medium text-blue-800">
                {userInfo.last_login 
                  ? new Date(userInfo.last_login).toLocaleString('es-ES')
                  : 'Nunca'
                }
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                className={`${
                  userInfo.status === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {userInfo.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Botón para copiar todas las credenciales */}
        <div className="pt-3">
          <Button
            onClick={copyAllCredentials}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Todas las Credenciales
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
