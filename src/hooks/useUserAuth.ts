import { useState, useEffect } from 'react';
import { getUserByEmail, getUserByUsername, type UserMapping } from '@/lib/userMapping';

export function useUserAuth() {
  const [user, setUser] = useState<UserMapping | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithUsername = async (username: string, password: string) => {
    // Buscar el usuario por nombre de usuario
    const mapping = getUserByUsername(username);
    
    if (!mapping) {
      throw new Error('Usuario no encontrado');
    }

    // Hacer login con el email correspondiente
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: mapping.email, password }),
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.user);
      return data.user;
    } else {
      throw new Error(data.error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setUser(null); // Logout local aunque falle el servidor
    }
  };

  return {
    user,
    loading,
    loginWithUsername,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isRestaurant: user?.role === 'restaurant',
  };
}

