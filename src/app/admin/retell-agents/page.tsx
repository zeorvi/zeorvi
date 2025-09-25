'use client';

import RetellAgentManager from '@/components/admin/RetellAgentManager';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RetellAgentsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400 flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al Panel Admin</span>
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Agentes Retell AI
              </h1>
              <p className="text-gray-300 mt-2">Gestión completa de agentes de IA para llamadas telefónicas</p>
            </div>
          </div>

          {/* Agent Manager Component */}
          <RetellAgentManager />
        </div>
      </div>
    </div>
  );
}
