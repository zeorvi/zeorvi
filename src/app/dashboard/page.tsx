'use client';
// Dashboard optimizado para Vercel deployment

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir directamente al admin dashboard sin mostrar contenido
    router.push('/admin');
  }, [router]);

  // No renderizar nada mientras redirige
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
  );
}