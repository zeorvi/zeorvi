'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, Send, CheckCircle } from 'lucide-react';

export default function CredentialsSimplePage() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    username: '',
    password: '',
  });
  const [credentials, setCredentials] = useState<{
    restaurantName: string;
    username: string;
    password: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const generateCredentials = () => {
    if (!formData.restaurantName || !formData.username || !formData.password) {
      toast.error('Completa todos los campos');
      return;
    }
    
    setCredentials({
      restaurantName: formData.restaurantName,
      username: formData.username,
      password: formData.password
    });
    
    toast.success('Credenciales generadas');
  };

  const copyAllCredentials = () => {
    if (!credentials) return;
    
    const credentialsText = `CREDENCIALES DE ACCESO
====================

Restaurante: ${credentials.restaurantName}
Usuario: ${credentials.username}
Contraseña: ${credentials.password}

Accede a: ${window.location.origin}

IMPORTANTE:
- Esta es una contraseña temporal
- Debe cambiarse en el primer login
- Guarde estas credenciales en un lugar seguro

Generado el ${new Date().toLocaleDateString('es-ES')}`;
    
    copyToClipboard(credentialsText, 'Todas las credenciales');
  };

  const downloadCredentials = () => {
    if (!credentials) return;
    
    const content = `CREDENCIALES DE ACCESO
====================

Restaurante: ${credentials.restaurantName}
Usuario: ${credentials.username}
Contraseña: ${credentials.password}

URL de acceso: ${window.location.origin}

IMPORTANTE:
- Esta es una contraseña temporal
- Debe cambiarse en el primer login
- Guarde estas credenciales en un lugar seguro

Generado el ${new Date().toLocaleDateString('es-ES')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credenciales-${credentials.username}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Archivo descargado');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Generar Credenciales</h1>
          <p className="text-gray-600 mt-2">
            Crea credenciales simples para restaurantes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Restaurante</CardTitle>
              <CardDescription>
                Completa los datos para generar las credenciales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Nombre del Restaurante</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  placeholder="Mi Restaurante"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="elbuensabor"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const randomPassword = 'Temp' + Math.random().toString(36).substring(2, 8) + '!';
                      setFormData(prev => ({ ...prev, password: randomPassword }));
                    }}
                  >
                    Generar
                  </Button>
                </div>
              </div>

              <Button
                onClick={generateCredentials}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Generar Credenciales
              </Button>
            </CardContent>
          </Card>

          {/* Credenciales */}
          <Card>
            <CardHeader>
              <CardTitle>Credenciales Generadas</CardTitle>
              <CardDescription>
                Copia o descarga estas credenciales para el restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentials ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Restaurante</Label>
                      <div className="flex">
                        <Input
                          value={credentials.restaurantName}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(credentials.restaurantName, 'Restaurante')}
                          className="ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Usuario</Label>
                      <div className="flex">
                        <Input
                          value={credentials.username}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(credentials.username, 'Usuario')}
                          className="ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Contraseña</Label>
                      <div className="flex">
                        <Input
                          value={credentials.password}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(credentials.password, 'Contraseña')}
                          className="ml-2"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      onClick={copyAllCredentials}
                      className="w-full"
                      variant="outline"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Todo
                    </Button>
                    
                    <Button
                      onClick={downloadCredentials}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Archivo
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Genera las credenciales para verlas aquí</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

