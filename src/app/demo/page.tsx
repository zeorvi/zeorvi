'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building, 
  Phone, 
  MessageSquare, 
  Calendar,
  Users,
  Settings,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🍽️ Restaurante IA Plataforma
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema de gestión de reservas con inteligencia artificial
          </p>
          <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2 text-lg">
            <CheckCircle className="h-5 w-5 mr-2" />
            Usuarios de demostración configurados
          </Badge>
        </div>

        {/* Credenciales de acceso */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Admin */}
          <Card className="border-2 border-orange-200">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center text-orange-700">
                <Settings className="h-6 w-6 mr-3" />
                Panel de Administración
              </CardTitle>
              <CardDescription className="text-orange-600">
                Gestiona restaurantes, usuarios y configuraciones
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Usuario:</span>
                      <p className="font-mono text-lg">admin</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Contraseña:</span>
                      <p className="font-mono text-lg">admin123</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Funcionalidades:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Crear nuevos restaurantes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Configurar tipos de restaurante
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Asignar configuraciones de IA
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Gestionar usuarios y permisos
                    </li>
                  </ul>
                </div>

                <Link href="/">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Acceder como Administrador
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Restaurante */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-green-700">
                <Building className="h-6 w-6 mr-3" />
                Dashboard del Restaurante
              </CardTitle>
              <CardDescription className="text-green-600">
                Gestiona mesas, reservas y clientes en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Usuario:</span>
                      <p className="font-mono text-lg">elbuensabor</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Contraseña:</span>
                      <p className="font-mono text-lg">restaurante123</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Funcionalidades:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Plano de mesas en tiempo real
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Agenda y calendario de reservas
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Notificaciones automáticas
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Integración con Retell AI
                    </li>
                  </ul>
                </div>

                <Link href="/">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Building className="h-4 w-4 mr-2" />
                    Acceder como Restaurante
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Características del sistema */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Star className="h-6 w-6 mr-3 text-yellow-500" />
              Características del Sistema
            </CardTitle>
            <CardDescription>
              Funcionalidades avanzadas implementadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Integración Retell AI</h3>
                <p className="text-sm text-gray-600">
                  Llamadas automáticas que crean reservas directamente en el sistema
                </p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp Integration</h3>
                <p className="text-sm text-gray-600">
                  Mensajes automáticos y gestión de reservas por WhatsApp
                </p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gestión de Mesas</h3>
                <p className="text-sm text-gray-600">
                  Plano visual de mesas con estados en tiempo real
                </p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gestión de Clientes</h3>
                <p className="text-sm text-gray-600">
                  Historial completo de clientes y sus preferencias
                </p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Configuración Flexible</h3>
                <p className="text-sm text-gray-600">
                  Diferentes tipos de restaurante con configuraciones específicas
                </p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tiempo Real</h3>
                <p className="text-sm text-gray-600">
                  Actualizaciones automáticas y notificaciones instantáneas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones de prueba */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Instrucciones de Prueba</CardTitle>
            <CardDescription>
              Cómo probar todas las funcionalidades del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">1. Probar como Administrador</h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Ve a <code className="bg-gray-100 px-2 py-1 rounded">/</code></li>
                  <li>2. Usa las credenciales: <code className="bg-gray-100 px-2 py-1 rounded">admin / admin123</code></li>
                  <li>3. Crea un nuevo restaurante</li>
                  <li>4. Configura el tipo de restaurante</li>
                  <li>5. Asigna configuraciones de IA</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">2. Probar como Restaurante</h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li>1. Ve a <code className="bg-gray-100 px-2 py-1 rounded">/</code></li>
                  <li>2. Usa las credenciales: <code className="bg-gray-100 px-2 py-1 rounded">elbuensabor / restaurante123</code></li>
                  <li>3. Explora el plano de mesas</li>
                  <li>4. Ve la agenda de reservas</li>
                  <li>5. Observa las notificaciones en tiempo real</li>
                </ol>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">3. Simular Llamadas de Retell AI</h4>
              <p className="text-sm text-gray-600 mb-3">
                Puedes simular llamadas enviando una petición POST a:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <code className="text-sm">
                  POST /api/retell/webhook
                </code>
                <pre className="text-xs mt-2 text-gray-600">
{`{
  "customer_name": "Juan Pérez",
  "phone_number": "+34123456789",
  "party_size": 4,
  "preferred_date": "2024-01-20",
  "preferred_time": "20:00",
  "notes": "Mesa cerca de la ventana"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
