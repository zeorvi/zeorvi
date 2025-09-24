import React from 'react';
import Link from 'next/link';

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🚀 Plataforma Inteligente
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una suite completa de herramientas empresariales impulsadas por IA
          </p>
        </div>

        {/* Platform Sections */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          
          {/* Restaurants Section - PROTEGIDA */}
          <div className="bg-white rounded-xl shadow-xl p-8 border-l-4 border-green-500">
            <div className="flex items-center mb-6">
              <div className="text-4xl mr-4">🍽️</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Restaurantes</h2>
                <p className="text-green-600 font-semibold">✅ Disponible y Estable</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Sistema completo de gestión para restaurantes con IA integrada. 
              Reservas automáticas, gestión de mesas y análisis inteligente.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Gestión de reservas con IA
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Dashboard administrativo
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Integración Retell AI
              </div>
            </div>
            <div className="flex space-x-4">
              <a 
                href="/admin"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Acceder Ahora
              </a>
              <a 
                href="/business"
                className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors"
              >
                Ver Detalles
              </a>
            </div>
          </div>

          {/* AI Automation Section - EN DESARROLLO */}
          <div className="bg-white rounded-xl shadow-xl p-8 border-l-4 border-blue-500">
            <div className="flex items-center mb-6">
              <div className="text-4xl mr-4">🤖</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Automatización IA</h2>
                <p className="text-blue-600 font-semibold">🚧 En Desarrollo</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Plataforma de automatización empresarial con IA avanzada. 
              Automatiza procesos complejos y optimiza operaciones.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-300 rounded-full mr-3"></span>
                Automatización inteligente
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-300 rounded-full mr-3"></span>
                Análisis predictivo
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 bg-blue-300 rounded-full mr-3"></span>
                Integración total
              </div>
            </div>
            <div className="flex space-x-4">
              <a 
                href="/ai-automation"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Ver Progreso
              </a>
              <button className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors">
                Notificarme
              </button>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-3">Analytics</h3>
            <p className="text-gray-600 text-sm">
              Dashboards inteligentes y reportes automatizados
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold mb-3">Integraciones</h3>
            <p className="text-gray-600 text-sm">
              Conecta con tus herramientas favoritas
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-3">Seguridad</h3>
            <p className="text-gray-600 text-sm">
              Protección empresarial de nivel bancario
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">🎯 Estado Actual</h2>
          <p className="text-lg mb-6">
            <strong>Restaurantes:</strong> Listo para producción y venta<br/>
            <strong>IA Automation:</strong> En desarrollo activo
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="/admin"
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Comenzar con Restaurantes
            </a>
            <Link 
              href="/"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Ver Landing Principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
