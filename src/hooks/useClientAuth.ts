/**
 * Hook para autenticación en el cliente
 * Usa el sistema de autenticación del cliente
 */

import { useState, useEffect } from 'react';
import { clientAuth, type AuthUser } from '@/lib/auth/clientAuth';

export function useClientAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await clientAuth.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await clientAuth.login({ email, password });
      
      if (result.success && result.user && result.token) {
        // Guardar token
        clientAuth.saveToken(result.token);
        
        // Actualizar estado
        setUser(result.user);
        setIsAuthenticated(true);
        
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  };

  const logout = async () => {
    try {
      await clientAuth.logout();
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name?: string;
    role: 'admin' | 'restaurant';
    restaurantId?: string;
    restaurantName?: string;
  }) => {
    try {
      const result = await clientAuth.register(data);
      
      if (result.success && result.user && result.token) {
        // Guardar token
        clientAuth.saveToken(result.token);
        
        // Actualizar estado
        setUser(result.user);
        setIsAuthenticated(true);
        
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isRestaurant: user?.role === 'restaurant',
    login,
    logout,
    register,
    checkAuth
  };
}

