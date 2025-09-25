/**
 * Hook para autenticación en el cliente
 * Usa el sistema de autenticación del cliente
 */

import { useState, useEffect, useCallback } from 'react';
import clientAuthService, { type AuthUser } from '@/lib/clientAuth';

export function useClientAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener token de localStorage o cookies
      const token = getToken();
      
      if (token) {
        const currentUser = await clientAuthService.verifyToken(token);
        
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // Token inválido, limpiar
          clientAuthService.clearToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
      clientAuthService.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      const result = await clientAuthService.login({ email, password });
      
      if (result.user && result.token) {
        // Guardar token
        clientAuthService.saveToken(result.token);
        
        // Actualizar estado
        setUser(result.user);
        setIsAuthenticated(true);
        
        return { success: true, user: result.user };
      } else {
        return { success: false, error: 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error interno del servidor' };
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await clientAuthService.logout(user.id);
      }
      
      // Limpiar estado local
      clientAuthService.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Limpiar estado local aunque falle el servidor
      clientAuthService.clearToken();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'manager' | 'employee' | 'restaurant';
    restaurantId?: string;
  }) => {
    try {
      const result = await clientAuthService.register(data);
      
      if (result.user && result.token) {
        // Guardar token
        clientAuthService.saveToken(result.token);
        
        // Actualizar estado
        setUser(result.user);
        setIsAuthenticated(true);
        
        return { success: true, user: result.user };
      } else {
        return { success: false, error: 'Error en el registro' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error interno del servidor' };
    }
  };

  // Funciones auxiliares para manejo de tokens
  const getToken = (): string | null => {
    return clientAuthService.getToken();
  };

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isEmployee: user?.role === 'employee',
    isRestaurant: user?.role === 'restaurant',
    login,
    logout,
    register,
    checkAuth
  };
}