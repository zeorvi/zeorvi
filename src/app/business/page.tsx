import React from 'react';
import Link from 'next/link';

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💼 Soluciones Empresariales
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Herramientas profesionales para hacer crecer tu negocio
          </p>
        </div>

        {/* Business Solutions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Analytics Avanzado</h3>
            <p className="text-gray-600">
              Dashboards inteligentes y reportes automatizados para tu negocio
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-3">Gestión de Equipos</h3>
            <p className="text-gray-600">
              Coordina equipos, proyectos y recursos de manera eficiente
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-3">Finanzas Inteligentes</h3>
            <p className="text-gray-600">
              Control financiero automatizado con IA predictiva
            </p>
          </div>
        </div>

        {/* Current Solutions */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🍽️ Solución Actual: Restaurantes
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-600">
                ✅ Disponible Ahora
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Gestión completa de restaurantes</li>
                <li>• Reservas automatizadas con IA</li>
                <li>• Integración con Retell AI</li>
                <li>• Dashboard administrativo</li>
                <li>• Sistema de mesas inteligente</li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <a 
                href="/admin"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
              >
                Acceder a Restaurantes
              </a>
            </div>
          </div>
        </div>

        {/* Back to Main */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-green-600 hover:text-green-800 font-semibold"
          >
            ← Volver a la plataforma principal
          </Link>
        </div>
      </div>
    </div>
  );
}
