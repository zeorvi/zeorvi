'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFirebaseConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateEnvFile = () => {
    const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseConfig.apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseConfig.appId}

# Airtable Configuration (opcional por ahora)
AIRTABLE_API_KEY=tu_airtable_api_key
AIRTABLE_BASE_ID=tu_airtable_base_id

# Twilio Configuration (opcional por ahora)
TWILIO_ACCOUNT_SID=tu_twilio_account_sid
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Retell AI Configuration (opcional por ahora)
RETELL_API_KEY=tu_retell_api_key

# Email Configuration (opcional por ahora)
GMAIL_CLIENT_ID=tu_gmail_client_id
GMAIL_CLIENT_SECRET=tu_gmail_client_secret
GMAIL_REFRESH_TOKEN=tu_gmail_refresh_token`;

    navigator.clipboard.writeText(envContent);
    alert('Contenido copiado al portapapeles. Pega esto en tu archivo .env.local');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-600 mb-4">
            Restaurante IA Plataforma
          </h1>
          <p className="text-xl text-gray-600">
            Configuración inicial de Firebase
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pasos */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pasos de Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-center space-x-3 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                    {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-sm">Crear proyecto Firebase</span>
                </div>
                <div className={`flex items-center space-x-3 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                    {step > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                  </div>
                  <span className="text-sm">Obtener credenciales</span>
                </div>
                <div className={`flex items-center space-x-3 ${step >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                    {step > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
                  </div>
                  <span className="text-sm">Configurar variables</span>
                </div>
                <div className={`flex items-center space-x-3 ${step >= 4 ? 'text-orange-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                    {step > 4 ? <CheckCircle className="w-4 h-4" /> : '4'}
                  </div>
                  <span className="text-sm">Habilitar Auth</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>1. Crear Proyecto Firebase</CardTitle>
                  <CardDescription>
                    Necesitas crear un proyecto en Firebase Console
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Si ya tienes un proyecto Firebase, puedes saltar este paso.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      1. Ve a <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline inline-flex items-center">
                        Firebase Console <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </p>
                    <p className="text-sm text-gray-600">
                      2. Haz clic en "Crear un proyecto"
                    </p>
                    <p className="text-sm text-gray-600">
                      3. Nombra tu proyecto (ej: "restaurante-ai-platform")
                    </p>
                    <p className="text-sm text-gray-600">
                      4. Habilita Google Analytics (opcional)
                    </p>
                    <p className="text-sm text-gray-600">
                      5. Selecciona tu región
                    </p>
                  </div>

                  <Button onClick={() => setStep(2)} className="w-full">
                    Siguiente: Obtener Credenciales
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Obtener Credenciales de Firebase</CardTitle>
                  <CardDescription>
                    Configura una aplicación web en tu proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      1. En tu proyecto Firebase, haz clic en el ícono de configuración ⚙️
                    </p>
                    <p className="text-sm text-gray-600">
                      2. Selecciona "Configuración del proyecto"
                    </p>
                    <p className="text-sm text-gray-600">
                      3. Desplázate hacia abajo hasta "Tus aplicaciones"
                    </p>
                    <p className="text-sm text-gray-600">
                      4. Haz clic en el ícono de web 🌐
                    </p>
                    <p className="text-sm text-gray-600">
                      5. Registra tu app con el nombre "Restaurante IA Plataforma"
                    </p>
                    <p className="text-sm text-gray-600">
                      6. Copia la configuración que aparece
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      La configuración se ve así: <code className="bg-gray-100 px-1 rounded">const firebaseConfig = {`{ ... }`}</code>
                    </AlertDescription>
                  </Alert>

                  <Button onClick={() => setStep(3)} className="w-full">
                    Siguiente: Configurar Variables
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>3. Configurar Variables de Entorno</CardTitle>
                  <CardDescription>
                    Ingresa las credenciales de Firebase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        placeholder="AIzaSy..."
                        value={firebaseConfig.apiKey}
                        onChange={(e) => handleInputChange('apiKey', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authDomain">Auth Domain</Label>
                      <Input
                        id="authDomain"
                        placeholder="tu-proyecto.firebaseapp.com"
                        value={firebaseConfig.authDomain}
                        onChange={(e) => handleInputChange('authDomain', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectId">Project ID</Label>
                      <Input
                        id="projectId"
                        placeholder="tu-proyecto-id"
                        value={firebaseConfig.projectId}
                        onChange={(e) => handleInputChange('projectId', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storageBucket">Storage Bucket</Label>
                      <Input
                        id="storageBucket"
                        placeholder="tu-proyecto.appspot.com"
                        value={firebaseConfig.storageBucket}
                        onChange={(e) => handleInputChange('storageBucket', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                      <Input
                        id="messagingSenderId"
                        placeholder="123456789"
                        value={firebaseConfig.messagingSenderId}
                        onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appId">App ID</Label>
                      <Input
                        id="appId"
                        placeholder="1:123456789:web:..."
                        value={firebaseConfig.appId}
                        onChange={(e) => handleInputChange('appId', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                      Anterior
                    </Button>
                    <Button 
                      onClick={generateEnvFile} 
                      className="flex-1"
                      disabled={!firebaseConfig.apiKey || !firebaseConfig.projectId}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Generar .env.local
                    </Button>
                    <Button 
                      onClick={() => setStep(4)} 
                      className="flex-1"
                      disabled={!firebaseConfig.apiKey || !firebaseConfig.projectId}
                    >
                      Siguiente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>4. Habilitar Authentication</CardTitle>
                  <CardDescription>
                    Configura la autenticación por email/contraseña
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      1. En Firebase Console, ve a "Authentication"
                    </p>
                    <p className="text-sm text-gray-600">
                      2. Haz clic en "Comenzar"
                    </p>
                    <p className="text-sm text-gray-600">
                      3. Ve a la pestaña "Sign-in method"
                    </p>
                    <p className="text-sm text-gray-600">
                      4. Habilita "Email/Password"
                    </p>
                    <p className="text-sm text-gray-600">
                      5. Guarda los cambios
                    </p>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      ¡Perfecto! Ahora tu plataforma está lista para usar. Reinicia el servidor de desarrollo.
                    </AlertDescription>
                  </Alert>

                  <div className="flex space-x-2">
                    <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                      Anterior
                    </Button>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => window.location.href = '/'} 
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        Login Restaurantes
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/admin-login'} 
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Login Admin
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
