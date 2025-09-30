'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientAuth } from '@/hooks/useClientAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, loading: authLoading, isAuthenticated } = useClientAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
    } else if (!requireAuth && isAuthenticated) {
      // Si no requiere auth pero el usuario está logueado, redirigir al dashboard
      router.push('/dashboard');
    }
  }, [requireAuth, redirectTo, router, isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // El middleware ya redirigió
  }

  if (!requireAuth && isAuthenticated) {
    return null; // El middleware ya redirigió
  }

  return <>{children}</>;
}

