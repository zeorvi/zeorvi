'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface UserCredentialsProps {
  username: string;
  email: string;
  password: string;
  restaurantName: string;
  restaurantType?: string;
  onClose: () => void;
}

export default function UserCredentials({ 
  username, 
  email, 
  password, 
  restaurantName,
  restaurantType,
  onClose 
}: UserCredentialsProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const copyAllCredentials = () => {
    const credentials = `Restaurante: ${restaurantName}${restaurantType ? ` (${restaurantType})` : ''}
Usuario: ${username}
Email: ${email}
Contraseña: ${password}

Accede a: ${window.location.origin}`;
    
    copyToClipboard(credentials, 'Todas las credenciales');
  };

  const printCredentials = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ea580c; text-align: center; margin-bottom: 30px;">
          Restaurante IA Plataforma
        </h1>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-bottom: 15px;">Credenciales de Acceso</h2>
          <p style="margin: 10px 0;"><strong>Restaurante:</strong> ${restaurantName}${restaurantType ? ` (${restaurantType})` : ''}</p>
          <p style="margin: 10px 0;"><strong>Usuario:</strong> ${username}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Contraseña:</strong> ${password}</p>
        </div>
        
        <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #1e40af;"><strong>URL de acceso:</strong> ${window.location.origin}</p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Instrucciones:</strong><br/>
            • Usa estas credenciales para hacer login<br/>
            • Cambia la contraseña en tu primer acceso<br/>
            • Guarda estas credenciales en un lugar seguro
          </p>
        </div>
        
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
          Generado el ${new Date().toLocaleDateString('es-ES')}
        </p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printContent);
    printWindow?.document.close();
    printWindow?.print();
    
    toast.success('Vista previa de impresión abierta');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-600">✅ Restaurante Creado Exitosamente</CardTitle>
          <CardDescription>
            Entrega estas credenciales directamente a {restaurantName}
            {restaurantType && ` (${restaurantType})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <div className="flex">
              <Input value={username} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(username, 'Usuario')}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex">
              <Input value={email} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(email, 'Email')}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contraseña Temporal</Label>
            <div className="flex">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(password, 'Contraseña')}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>📋 Entrega Directa:</strong> Copia o imprime estas credenciales para entregárselas 
              directamente al restaurante. Pueden hacer login inmediatamente.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button
              variant="outline"
              onClick={copyAllCredentials}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Todo
            </Button>
            <Button
              variant="outline"
              onClick={printCredentials}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
