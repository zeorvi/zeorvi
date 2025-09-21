'use client';

import dynamic from 'next/dynamic';

// Importar el nuevo componente unificado dinámicamente para evitar problemas de SSR
const EnhancedAdminDashboard = dynamic(() => import('@/components/admin/EnhancedAdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
  )
});

export default function AdminPage() {
  // En producción, estos datos vendrían del contexto de autenticación
  const adminRole = 'admin'; // 'super_admin' | 'admin' | 'restaurant_admin'
  const adminId = 'admin_001';
  const adminName = 'Administrador Principal';

  return (
    <EnhancedAdminDashboard 
      adminId={adminId}
      adminName={adminName}
              adminRole={adminRole as 'super_admin' | 'admin' | 'restaurant_admin'}
    />
  );
}