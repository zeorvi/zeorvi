'use client';

import SimpleAdminDashboard from '@/components/admin/SimpleAdminDashboard';

export default function ClassicAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              🏪 Panel de Administración Clásico
            </h1>
            <p className="text-sm text-gray-600">
              Interfaz tradicional para gestión de restaurantes
            </p>
          </div>
          <div className="flex gap-2">
            <a 
              href="/admin" 
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
            >
              ← Volver al Panel Principal
            </a>
          </div>
        </div>
      </div>
      
      <SimpleAdminDashboard />
    </div>
  );
}
