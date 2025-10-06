'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Save, RefreshCw } from 'lucide-react';

interface UpdateCredentialsProps {
  userId: string;
  currentEmail: string;
  currentUsername: string;
  onSuccess?: () => void;
}

export default function UpdateCredentials({ 
  userId, 
  currentEmail, 
  currentUsername, 
  onSuccess 
}: UpdateCredentialsProps) {
  const [formData, setFormData] = useState({
    newEmail: currentEmail,
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generatePassword = () => {
    const password = 'Temp' + Math.random().toString(36).substring(2, 8) + '!';
    setFormData(prev => ({ 
      ...prev, 
      newPassword: password,
      confirmPassword: password
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newEmail || !formData.newPassword) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: currentEmail,
          newEmail: formData.newEmail,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ Credenciales actualizadas correctamente');
        setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(data.error || 'Error actualizando las credenciales');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast.error('Error interno del servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5" />
          <span>Actualizar Credenciales</span>
        </CardTitle>
        <CardDescription>
          Actualiza las credenciales de acceso para {currentUsername}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">Nuevo Email</Label>
            <Input
              id="newEmail"
              name="newEmail"
              type="email"
              value={formData.newEmail}
              onChange={handleInputChange}
              placeholder="nuevo@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="flex space-x-2">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
              >
                Generar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="flex space-x-2">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> Al actualizar las credenciales, el usuario deberá usar las nuevas credenciales para hacer login.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Actualizar Credenciales
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
