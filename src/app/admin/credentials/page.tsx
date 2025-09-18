'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, Send } from 'lucide-react';
import { sendCredentialsEmail } from '@/lib/emailService';

export default function CredentialsPage() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const generatePassword = () => {
    const password = 'Temp' + Math.random().toString(36).substring(2, 8) + '!';
    setFormData(prev => ({ ...prev, password }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const copyAllCredentials = () => {
    const credentials = `Restaurante: ${formData.restaurantName}
Usuario: ${formData.username}
Contraseña: ${formData.password}

Accede a: ${window.location.origin}

Nota: El email (${formData.email}) es solo para identificación interna.`;
    
    copyToClipboard(credentials, 'Todas las credenciales');
  };

  const sendEmail = async () => {
    if (!formData.email || !formData.username || !formData.password) {
      toast.error('Completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await sendCredentialsEmail({
        restaurantName: formData.restaurantName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        loginUrl: window.location.origin
      });
      
      toast.success('Email enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar email:', error);
      toast.error('Error al enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCredentials = () => {
    const credentials = `CREDENCIALES DE ACCESO
====================

Restaurante: ${formData.restaurantName}
Usuario: ${formData.username}
Email (Interno): ${formData.email}
Contraseña: ${formData.password}

URL de acceso: ${window.location.origin}

IMPORTANTE:
- Esta es una contraseña temporal
- Debe cambiarse en el primer login
- Guarde estas credenciales en un lugar seguro

Fecha: ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([credentials], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credenciales-${formData.username}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Archivo descargado');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-xl font-bold text-orange-600">
                Generar Credenciales
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Restaurante</CardTitle>
              <CardDescription>
                Completa los datos para generar las credenciales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="email">Email (Automático)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Se genera automáticamente"
                  value={`${formData.username}@restauranteia.com`}
                  readOnly
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  Se genera automáticamente basado en el usuario
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="TempAbc123!"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    Generar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credenciales */}
          <Card>
            <CardHeader>
              <CardTitle>Credenciales Generadas</CardTitle>
            <CardDescription>
              Copia o envía estas credenciales al restaurante
              <br />
              <span className="text-sm text-gray-500">
                El email es solo para identificación interna, no se usa para login
              </span>
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Restaurante</Label>
                <div className="flex">
                  <Input
                    value={formData.restaurantName}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formData.restaurantName, 'Restaurante')}
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
                    value={formData.username}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formData.username, 'Usuario')}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email (Interno)</Label>
                <div className="flex">
                  <Input
                    value={formData.email}
                    readOnly
                    className="font-mono text-gray-500"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formData.email, 'Email')}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Solo para identificación interna
                </p>
              </div>

              <div className="space-y-2">
                <Label>Contraseña</Label>
                <div className="flex">
                  <Input
                    value={formData.password}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formData.password, 'Contraseña')}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 space-y-2">
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
                
                <Button
                  onClick={sendEmail}
                  disabled={isLoading || !formData.email}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Enviando...' : 'Enviar por Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
