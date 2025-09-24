'use client';

import { MessageSquare, Zap, Database, BarChart3, Users } from 'lucide-react';

export default function VoiceAgentCapabilities() {
  const capabilities = [
    {
      icon: MessageSquare,
      title: "Habla como humano",
      description: "Multidioma, tono natural",
      features: ["Multiidioma", "Tono profesional", "Personalizado"],
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-400/30"
    },
    {
      icon: Zap,
      title: "Actúa automáticamente",
      description: "Confirma, agenda, transfiere",
      features: ["Reservas automáticas", "Confirmaciones SMS", "Registro de pedidos"],
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-400/30"
    },
    {
      icon: Database,
      title: "Se integra con todo",
      description: "CRM, reservas, historial",
      features: ["CRM integrado", "Sistema de reservas", "Historial completo"],
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-400/30"
    },
    {
      icon: BarChart3,
      title: "Métricas en tiempo real",
      description: "KPIs, rendimiento, optimización",
      features: ["Dashboard completo", "KPIs clave", "Optimización"],
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-400/30"
    }
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-2 rounded-full border border-cyan-400/40 mb-6">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-bold tracking-wide uppercase">
              Agente de Voz Inteligente
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nuestra IA no solo gestiona, también optimiza tu negocio
            </span>
          </h2>
          
          <p className="text-base text-gray-300 max-w-2xl mx-auto">
            Tu recepcionista automático que nunca duerme, nunca se equivoca y siempre sonríe.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {capabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <div 
                key={index}
                className={`${capability.bgColor} ${capability.borderColor} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 backdrop-blur-sm`}
              >
                <div className="text-center">
                  <div className={`bg-gradient-to-r ${capability.color} p-3 rounded-xl shadow-lg mx-auto mb-3 w-fit`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {capability.title}
                  </h3>
                  <p className="text-gray-300 mb-3 text-sm">
                    {capability.description}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {capability.features.map((feature, featureIndex) => (
                      <span key={featureIndex} className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
