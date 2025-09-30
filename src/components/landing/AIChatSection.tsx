import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Settings, CheckCircle, Send } from 'lucide-react';

export default function AIChatSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-orange-900/40">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-full border border-purple-400/30 mb-6 shadow-lg shadow-purple-500/10">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-purple-300 text-sm font-bold uppercase tracking-wide">Asistente IA Especializado</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Tu <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Asistente IA</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Chatea con tu IA personalizada. Pregúntale sobre cualquier tema: recetas, consejos, información general o lo que necesites
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Chat Preview */}
          <div className="relative">
            <Card className="bg-gradient-to-br from-black/80 to-gray-900/80 border-purple-500/30 backdrop-blur-sm shadow-2xl shadow-purple-500/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Asistente IA Especializado</h3>
                    <p className="text-purple-300 text-sm">En línea • Experto en múltiples temas</p>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="bg-gray-700 rounded-lg p-3 max-w-xs">
                      <p className="text-gray-300 text-sm">¿Cómo hago un risotto perfecto?</p>
                    </div>
                    <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 max-w-sm">
                      <p className="text-white text-sm">
                        Para un risotto perfecto: 1) Usa arroz arborio, 2) Caldo caliente constante, 3) Mueve constantemente, 4) Agrega queso al final. ¿Quieres la receta completa con ingredientes?
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 justify-end">
                    <div className="bg-gray-700 rounded-lg p-3 max-w-xs">
                      <p className="text-gray-300 text-sm">Sí, dame la receta completa</p>
                    </div>
                    <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">T</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 max-w-sm">
                      <p className="text-white text-sm">
                        Risotto de hongos: 320g arroz arborio, 1L caldo de verduras, 200g hongos, 1 cebolla, vino blanco, mantequilla, queso parmesano. ¿Quieres que te explique el paso a paso?
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-2 bg-gray-800 rounded-lg p-3">
                  <Input 
                    placeholder="Pregunta sobre cualquier tema..." 
                    className="bg-transparent border-none text-white placeholder-gray-400 focus:ring-0"
                  />
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-pulse shadow-lg">
              🟢 Activo
            </div>
          </div>

          {/* Right side - Features */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Información General</h3>
                  <p className="text-gray-300">
                    Respuestas sobre cualquier tema, desde recetas y cocina hasta consejos prácticos y información útil para tu día a día.
                  </p>
                </div>
              </div>
            
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-3 rounded-xl shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Consejos Especializados</h3>
                  <p className="text-gray-300">
                    Información sobre dietas especiales, alergias alimentarias, sustitutos de ingredientes y recomendaciones personalizadas.
                  </p>
                </div>
              </div>
            
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-2">Asistencia Completa</h3>
                  <p className="text-gray-300">
                    Ayuda con conservación de alimentos, presentación de platos, recomendaciones y tips útiles para cualquier situación.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
              <h4 className="text-white font-bold text-lg mb-3">Ejemplos de Preguntas:</h4>
              <div className="space-y-2 text-sm">
                <p className="text-purple-300">• "Los celíacos, ¿qué alimentos no pueden tomar?"</p>
                <p className="text-pink-300">• "Dinos una receta de pasta carbonara"</p>
                <p className="text-orange-300">• "¿Cómo conservar mejor las verduras frescas?"</p>
                <p className="text-red-300">• "¿Qué vino combina con pescado?"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
