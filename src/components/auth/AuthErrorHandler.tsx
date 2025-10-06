/**
 * Componente para manejar errores de autenticación
 * Muestra mensajes apropiados y opciones de acción
 */

import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface AuthErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onLogin?: () => void;
  showLoginButton?: boolean;
}

export default function AuthErrorHandler({ 
  error, 
  onRetry, 
  onLogin, 
  showLoginButton = true 
}: AuthErrorHandlerProps) {
  if (!error) return null;

  const isAuthError = error.includes('401') || 
                     error.includes('Unauthorized') || 
                     error.includes('Token') ||
                     error.includes('No autorizado');

  const isNetworkError = error.includes('Failed to fetch') || 
                        error.includes('Network Error');

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isAuthError ? 'Error de Autenticación' : 
             isNetworkError ? 'Error de Conexión' : 
             'Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              {isAuthError ? 
                'Tu sesión ha expirado o el token de autenticación es inválido. Por favor, inicia sesión nuevamente.' :
                isNetworkError ?
                'No se pudo conectar con el servidor. Verifica tu conexión a internet.' :
                error
              }
            </p>
          </div>
          
          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </button>
            )}
            
            {showLoginButton && onLogin && (
              <button
                onClick={onLogin}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
