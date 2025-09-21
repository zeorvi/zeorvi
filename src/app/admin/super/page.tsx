'use client';

import dynamic from 'next/dynamic';

// Importar el componente de super admin dinámicamente
const SuperAdminDashboard = dynamic(() => import('@/components/admin/SuperAdminDashboard'), {
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

export default function SuperAdminPage() {
  // En producción, estos datos vendrían del contexto de autenticación
  const adminId = 'super_admin_001';
  const adminName = 'Super Administrador';

  return (
    <SuperAdminDashboard 
      adminId={adminId}
      adminName={adminName}
    />
  );
}
