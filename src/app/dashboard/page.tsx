'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SimpleAdminDashboard from '@/components/admin/SimpleAdminDashboard';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir directamente al admin dashboard
    router.push('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleAdminDashboard />
    </div>
  );
}