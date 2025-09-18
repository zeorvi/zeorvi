'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Mail, User, Key, Globe, ArrowRight } from 'lucide-react';

export default function FlowPage() {
  const router = useRouter();

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
                Flujo Recomendado
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Flujo Recomendado para Crear Restaurantes
          </h1>
          <p className="text-xl text-gray-600">
            Proceso automático y sin complicaciones
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Paso 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <User className="h-5 w-5 mr-2" />
                Paso 1: Crear Restaurante
              </CardTitle>
              <CardDescription>
                Llena el formulario en el panel de administración
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Nombre del restaurante
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Email de contacto
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Teléfono y dirección
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Número de Twilio
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Paso 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <Key className="h-5 w-5 mr-2" />
                Paso 2: Generación Automática
              </CardTitle>
              <CardDescription>
                El sistema crea todo automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Usuario en Firebase Auth
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Nombre de usuario único
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Contraseña temporal
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Registro en la base de datos
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Paso 3 */}
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center text-orange-600">
            <Mail className="h-5 w-5 mr-2" />
            Paso 3: Entrega Directa
          </CardTitle>
          <CardDescription>
            Se muestran las credenciales para entrega directa
          </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Email con credenciales
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Instrucciones de acceso
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  URL de la plataforma
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Información de seguridad
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Paso 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <Globe className="h-5 w-5 mr-2" />
                Paso 4: Login Inmediato
              </CardTitle>
              <CardDescription>
                El restaurante puede acceder inmediatamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Acceso al dashboard
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Cambio de contraseña
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Configuración inicial
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Listo para usar
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Flujo visual */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Flujo Visual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-4 overflow-x-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">1. Crear</p>
                </div>
                
                <ArrowRight className="h-6 w-6 text-gray-400" />
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Key className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">2. Generar</p>
                </div>
                
                <ArrowRight className="h-6 w-6 text-gray-400" />
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Mail className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">3. Enviar</p>
                </div>
                
                <ArrowRight className="h-6 w-6 text-gray-400" />
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Globe className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">4. Acceder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón de acción */}
        <div className="text-center mt-8">
          <Button
            onClick={() => router.push('/admin')}
            className="bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            🚀 Crear Restaurante Ahora
          </Button>
        </div>
      </main>
    </div>
  );
}
