import React from 'react';
import Link from 'next/link';

export default function AIAutomationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Automatización con IA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            La próxima generación de automatización empresarial impulsada por inteligencia artificial
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-3">Automatización Inteligente</h3>
            <p className="text-gray-600">
              Automatiza procesos complejos con IA que aprende y se adapta a tu negocio
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Análisis Predictivo</h3>
            <p className="text-gray-600">
              Predice tendencias y optimiza decisiones con análisis avanzado de datos
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-3">Integración Total</h3>
            <p className="text-gray-600">
              Conecta todos tus sistemas en una plataforma unificada
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">🚀 Próximamente</h2>
          <p className="text-lg mb-6">
            Estamos desarrollando la plataforma de automatización más avanzada del mercado
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Notificarme
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Ver Demo
            </button>
          </div>
        </div>

        {/* Back to Main */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Volver a la plataforma principal
          </Link>
        </div>
      </div>
    </div>
  );
}
