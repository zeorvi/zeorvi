export default function InstallationROISection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background con efectos mas dramaticos */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-cyan-900/40">
        <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-green-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-2xl animate-pulse delay-500"></div>
        
        {/* Particulas flotantes */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-green-400/60 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-emerald-400/60 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce delay-1000"></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header elegante y minimalista */}
        <div className="text-center mb-20">
          <div className="relative inline-block mb-10">
            <div className="absolute -inset-6 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-cyan-400/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="inline-flex items-center space-x-3 bg-black/60 backdrop-blur-xl px-8 py-4 rounded-full border border-green-400/20 shadow-2xl">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-medium tracking-wide">Transformación Inmediata</span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-[0.9]">
            <span className="block text-gray-100">1 Minuto Para</span>
            <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Cambiar Tu Vida
            </span>
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <p className="text-2xl text-green-300 font-semibold">
              Sin técnicos • Sin instalaciones • Sin complicaciones
            </p>
            <p className="text-xl text-gray-300 leading-relaxed">
              Una página web. Un minuto. El sistema más avanzado del planeta funcionando.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Proceso elegante */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-400/5 to-emerald-400/5 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-green-400/20 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-green-400/10 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/20 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-sm font-medium">Servicio White-Glove</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">
                  Instalación Profesional
                </h3>
                <p className="text-green-300 text-lg font-semibold">
                  Cero trabajo para ti
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-6 top-16 h-20 w-px bg-gradient-to-b from-green-400 to-green-400/30"></div>
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 bg-gradient-to-r from-green-400 to-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                      <span className="text-black font-black text-lg">1</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="text-white font-bold text-lg mb-2">Configuración Completa</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Nuestro equipo técnico configura la IA, personaliza el sistema y lo integra completamente para tu restaurante.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-6 top-16 h-20 w-px bg-gradient-to-b from-green-400 to-green-400/30"></div>
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 bg-gradient-to-r from-green-400 to-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                      <span className="text-black font-black text-lg">2</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="text-white font-bold text-lg mb-2">Entrega Lista para Usar</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Recibes todo funcionando: página web, IA entrenada, dashboard configurado. Solo necesitas tu usuario y contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 bg-gradient-to-r from-green-400 to-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 ring-2 ring-green-400/30">
                      <span className="text-black font-black text-lg">3</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="text-white font-bold text-lg mb-2">IA Funcionando</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Tu asistente de IA ya está atendiendo llamadas, gestionando reservas y optimizando tu operación 24/7.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Beneficios con mismo estilo que la izquierda */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/5 to-orange-400/5 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-black/40 to-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-yellow-400/20 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-yellow-400/10 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/20 mb-4">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-300 text-sm font-medium">ROI Inmediato</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">
                  Rentabilidad Desde El Día 1
                </h3>
                <p className="text-yellow-300 text-lg font-semibold">
                  Ganancias inmediatas garantizadas
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-6 top-16 h-20 w-px bg-gradient-to-b from-yellow-400 to-yellow-400/30"></div>
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 bg-gradient-to-r from-yellow-400 to-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                      <span className="text-black font-black text-lg">75%</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="text-white font-bold text-lg mb-2">Reservas Recuperadas</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Cada llamada perdida era dinero perdido. Ahora capturas el 100% de las oportunidades de reserva.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-6 top-16 h-20 w-px bg-gradient-to-b from-orange-400 to-orange-400/30"></div>
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 bg-gradient-to-r from-orange-400 to-red-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                      <span className="text-black font-black text-lg">90%</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="text-white font-bold text-lg mb-2">Tiempo Liberado</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Tu equipo se enfoca en brindar servicio excepcional, no en atender teléfonos constantemente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-start space-x-4">
                    <div className="relative z-10 bg-gradient-to-r from-red-400 to-pink-500 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25 ring-2 ring-red-400/30">
                      <span className="text-black font-black text-lg">100%</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="text-white font-bold text-lg mb-2">Errores Eliminados</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        Cero reservas mal anotadas, doble-reservadas o información incorrecta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
