import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserByEmail, getUserByUsername, type UserMapping } from '@/lib/userMapping';

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userMapping, setUserMapping] = useState<UserMapping | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Buscar el mapeo de usuario por email
        const mapping = getUserByEmail(firebaseUser.email || '');
        setUserMapping(mapping || null);
      } else {
        setUserMapping(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithUsername = async (username: string, password: string) => {
    // Buscar el usuario por nombre de usuario
    const mapping = getUserByUsername(username);
    
    if (!mapping) {
      throw new Error('Usuario no encontrado');
    }

    // Hacer login con el email correspondiente
    const userCredential = await signInWithEmailAndPassword(auth, mapping.email, password);
    return userCredential;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  return {
    user,
    userMapping,
    loading,
    loginWithUsername,
    logout,
    isAuthenticated: !!user,
    isAdmin: userMapping?.role === 'admin',
    isRestaurant: userMapping?.role === 'restaurant',
  };
}

