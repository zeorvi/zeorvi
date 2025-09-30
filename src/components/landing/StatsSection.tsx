export default function StatsSection() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-cyan-400/30 mb-6 shadow-lg shadow-cyan-500/10">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-300 text-sm font-bold uppercase tracking-wide">Todo lo que necesitas</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Gestión 100% centralizada con IA</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Todo lo que necesitas para gestionar tu restaurante de forma inteligente en un solo lugar.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agente IA - Llamadas */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-400/30 p-4 shadow-2xl shadow-red-500/20">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                  <span className="text-white text-2xl">📞</span>
                </div>
                <h3 className="text-white font-bold text-xl ml-3">Agente IA - Llamadas</h3>
              </div>
              <p className="text-gray-300 mb-3">
                Atención 24/7, reservas, consultas
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-red-300">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Atiende llamadas 24/7
                </div>
                <div className="flex items-center text-sm text-red-300">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Gestiona reservas
                </div>
                <div className="flex items-center text-sm text-red-300">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Consultas de clientes
                </div>
              </div>
            </div>
          </div>

          {/* Agenda del Día */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-400/30 p-4 shadow-2xl shadow-cyan-500/20">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                  <span className="text-white text-2xl">📅</span>
                </div>
                <h3 className="text-white font-bold text-xl ml-3">Agenda del Día</h3>
              </div>
              <p className="text-gray-300 mb-3">
                Reservas confirmadas, notas, mesas
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-cyan-300">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                  Reservas confirmadas y pendientes
                </div>
                <div className="flex items-center text-sm text-cyan-300">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                  Notas especiales
                </div>
                <div className="flex items-center text-sm text-cyan-300">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                  Mesas asignadas
                </div>
              </div>
            </div>
          </div>

          {/* Gestión de Reservas */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-purple-400/30 p-4 shadow-2xl shadow-purple-500/20">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <span className="text-white text-2xl">🗓️</span>
                </div>
                <h3 className="text-white font-bold text-xl ml-3">Gestión de Reservas</h3>
              </div>
              <p className="text-gray-300 mb-3">
                Calendario visual, confirmar/cancelar
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-purple-300">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  Calendario visual
                </div>
                <div className="flex items-center text-sm text-purple-300">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  Confirmar/cancelar
                </div>
                <div className="flex items-center text-sm text-purple-300">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                  Eventos especiales
                </div>
              </div>
            </div>
          </div>
          
          {/* Control de Mesas */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-pink-400/30 p-4 shadow-2xl shadow-pink-500/20">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl">
                  <span className="text-white text-2xl">🪑</span>
                </div>
                <h3 className="text-white font-bold text-xl ml-3">Control de Mesas</h3>
              </div>
              <p className="text-gray-300 mb-3">
                Plano visual, estados en tiempo real
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-pink-300">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                  Plano de mesas
                </div>
                <div className="flex items-center text-sm text-pink-300">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                  Estados en tiempo real
                </div>
                <div className="flex items-center text-sm text-pink-300">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                  Asignación inteligente
                </div>
              </div>
            </div>
          </div>
          
          {/* Base de Clientes */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-green-400/30 p-4 shadow-2xl shadow-green-500/20">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <span className="text-white text-2xl">👥</span>
                </div>
                <h3 className="text-white font-bold text-xl ml-3">Base de Clientes</h3>
              </div>
              <p className="text-gray-300 mb-3">
                VIP, historial, preferencias
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-green-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Clientes VIP
                </div>
                <div className="flex items-center text-sm text-green-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Historial de visitas
                </div>
                <div className="flex items-center text-sm text-green-300">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Preferencias
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat con IA */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl border border-yellow-400/30 p-4 shadow-2xl shadow-yellow-500/20">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <span className="text-white text-2xl">🤖</span>
                </div>
                <h3 className="text-white font-bold text-xl ml-3">Chat con IA</h3>
              </div>
              <p className="text-gray-300 mb-3">
                Recetas, gestión, optimización
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-yellow-300">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Recetas y cocina
                </div>
                <div className="flex items-center text-sm text-yellow-300">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Consejos de gestión
                </div>
                <div className="flex items-center text-sm text-yellow-300">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Optimización
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl p-6 border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Listo para revolucionar tu restaurante?
            </h3>
            <p className="text-gray-300 mb-6">
              Únete a los restaurantes que ya aumentaron sus ingresos en un 75%
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-400/30 font-semibold">
                ✓ Instalación inmediata
              </span>
              <span className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full border border-purple-400/30 font-semibold">
                ✓ Soporte 24/7 incluido
              </span>
              <span className="bg-pink-500/20 text-pink-400 px-4 py-2 rounded-full border border-pink-400/30 font-semibold">
                ✓ Garantía de resultados
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
