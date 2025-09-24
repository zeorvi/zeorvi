'use client';

import { useState, useEffect } from 'react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugAuthPage() {
  const { user, loading, isAuthenticated, login, logout } = useClientAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    updateDebugInfo();
  }, [user, isAuthenticated]);

  const updateDebugInfo = () => {
    const info = {
      cookies: typeof document !== 'undefined' ? document.cookie : 'N/A',
      localStorage: typeof window !== 'undefined' ? localStorage.getItem('auth-token') : 'N/A',
      user: user,
      isAuthenticated: isAuthenticated,
      loading: loading,
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };
    setDebugInfo(info);
  };

  const handleLogin = async () => {
    try {
      const result = await login('admin@restauranteia.com', 'admin123');
      if (result.success) {
        alert('Login exitoso!');
        updateDebugInfo();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logout exitoso!');
      updateDebugInfo();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  const testRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setTestResults({
        status: response.status,
        success: response.ok,
        data: data
      });
    } catch (error) {
      setTestResults({
        status: 'error',
        success: false,
        error: error.message
      });
    }
  };

  const testRestaurantsWithAuth = async () => {
    try {
      // Obtener token
      const token = localStorage.getItem('auth-token') || 
                    document.cookie.match(/auth-token=([^;]+)/)?.[1];
      
      if (!token) {
        setTestResults({
          status: 'no-token',
          success: false,
          error: 'No se encontró token de autenticación'
        });
        return;
      }

      const response = await fetch('/api/restaurants', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setTestResults({
        status: response.status,
        success: response.ok,
        data: data,
        token: token.substring(0, 50) + '...'
      });
    } catch (error) {
      setTestResults({
        status: 'error',
        success: false,
        error: error.message
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">🔍 Debug de Autenticación</h1>
        
        {/* Estado actual */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Sí' : 'No'}</p>
              <p><strong>Autenticado:</strong> {isAuthenticated ? 'Sí' : 'No'}</p>
              <p><strong>Usuario:</strong> {user ? `${user.name} (${user.role})` : 'Ninguno'}</p>
              <p><strong>URL:</strong> {debugInfo?.url}</p>
            </div>
          </CardContent>
        </Card>

        {/* Información de debug */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Botones de prueba */}
        <Card>
          <CardHeader>
            <CardTitle>Pruebas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-x-4">
              <Button onClick={handleLogin} disabled={loading}>
                🔐 Login Admin
              </Button>
              <Button onClick={handleLogout} disabled={loading}>
                🚪 Logout
              </Button>
              <Button onClick={testRestaurants} disabled={loading}>
                🏪 Test Restaurants (Solo Cookies)
              </Button>
              <Button onClick={testRestaurantsWithAuth} disabled={loading}>
                🔑 Test Restaurants (Con Auth Header)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados de pruebas */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados de Pruebas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded ${testResults.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><strong>Status:</strong> {testResults.status}</p>
                <p><strong>Éxito:</strong> {testResults.success ? 'Sí' : 'No'}</p>
                {testResults.token && <p><strong>Token usado:</strong> {testResults.token}</p>}
                {testResults.error && <p><strong>Error:</strong> {testResults.error}</p>}
                {testResults.data && (
                  <div>
                    <p><strong>Datos:</strong></p>
                    <pre className="mt-2 text-sm overflow-auto">
                      {JSON.stringify(testResults.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

