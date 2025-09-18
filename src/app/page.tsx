'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bot, 
  Calendar, 
  ArrowRight,
  Play,
  CheckCircle,
  Zap,
  Building,
  ChevronRight,
  Send,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    restaurant: '',
    phone: ''
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo request:', demoForm);
    toast.success('¡Demo solicitada! Te contactaremos pronto 🚀');
    setDemoForm({ name: '', email: '', restaurant: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-cyan-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-xl">ZEORVI</span>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 text-sm font-normal">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Content */}
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-3 sm:px-5 py-2 rounded-full border border-cyan-400/40 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
                <div className="relative">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-cyan-300 text-xs font-bold tracking-wide uppercase">
                  #1 en Gestión Inteligente
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9]">
                Automatiza
                <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse drop-shadow-2xl">
                  tu restaurante
                </span>
              </h1>

              <div className="space-y-4 sm:space-y-6">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-semibold">
                  Más reservas. Menos trabajo. Cero llamadas perdidas.
                </p>
                <p className="text-base sm:text-lg text-cyan-300">
                  La IA atiende llamadas automáticamente mientras tu equipo se enfoca en cocinar y servir excepcional.
                </p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 text-sm">
                  <span className="bg-green-500/20 text-green-400 px-3 py-2 rounded-full border border-green-400/30 font-semibold">
                    ✓ +75% reservas
                  </span>
                  <span className="bg-purple-500/20 text-purple-400 px-3 py-2 rounded-full border border-purple-400/30 font-semibold">
                    ✓ 0 errores humanos
                  </span>
                  <span className="bg-pink-500/20 text-pink-400 px-3 py-2 rounded-full border border-pink-400/30 font-semibold">
                    ✓ 24/7 operativo
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
                  onClick={() => {
                    const formElement = document.querySelector('#demo-form');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Iniciar Ahora
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            {/* Right side - Demo Visual */}
            <div className="relative">
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl p-1 shadow-2xl shadow-cyan-500/25 border border-cyan-400/20">
                <div className="bg-black rounded-xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center relative">
                    <div className="absolute inset-0 opacity-10">
                      <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                        {[...Array(48)].map((_, i) => (
                          <div key={i} className="border border-cyan-400/20"></div>
                        ))}
                      </div>
                    </div>
                    {isPlaying ? (
                      <div className="text-center relative z-10">
                        <div className="animate-pulse mb-4">
                          <Bot className="h-16 w-16 text-cyan-400 mx-auto drop-shadow-lg" />
                        </div>
                        <p className="text-white text-lg">🤖 &quot;Hola, soy tu asistente inteligente...&quot;</p>
                        <p className="text-cyan-400 text-sm mt-2">Simulación de IA en tiempo real</p>
                        <div className="mt-4 flex justify-center space-x-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center relative z-10">
                        <button 
                          onClick={() => {
                            setIsPlaying(true);
                            setTimeout(() => setIsPlaying(false), 5000); // Detener después de 5 segundos
                          }}
                          className="bg-cyan-500/20 rounded-full p-6 mb-4 inline-block shadow-lg shadow-cyan-500/25 border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                        >
                          <Play className="h-12 w-12 text-cyan-400" />
                        </button>
                        <p className="text-cyan-300">Experimenta el futuro de la automatización</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                🔴 En Vivo
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold">
                ⚡ Instalación: 1 min
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview - SECCIÓN 2 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-full border border-green-400/30 mb-6 shadow-lg shadow-green-500/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-sm font-bold uppercase tracking-wide">Vista Exclusiva</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              El Dashboard Que <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">Cambió Todo</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Plano de Mesas como el real */}
            <Card className="bg-white border-gray-200 overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-white p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900 font-semibold text-lg">Plano de Mesas</h3>
                    <div className="flex space-x-3 items-center">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-xs text-gray-600">Libre</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                        <span className="text-xs text-gray-600">Reservada</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                        <span className="text-xs text-gray-600">Ocupada</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { id: 'M1', color: 'bg-green-500', status: 'libre' },
                      { id: 'M2', color: 'bg-yellow-500', status: 'reservada' },
                      { id: 'M3', color: 'bg-red-500', status: 'ocupada' },
                      { id: 'M4', color: 'bg-green-500', status: 'libre' },
                      { id: 'M5', color: 'bg-yellow-500', status: 'reservada' },
                      { id: 'M6', color: 'bg-red-500', status: 'ocupada' },
                      { id: 'M7', color: 'bg-green-500', status: 'libre' },
                      { id: 'M8', color: 'bg-yellow-500', status: 'reservada' },
                      { id: 'M9', color: 'bg-red-500', status: 'ocupada' },
                      { id: 'M10', color: 'bg-green-500', status: 'libre' },
                      { id: 'M11', color: 'bg-yellow-500', status: 'reservada' },
                      { id: 'M12', color: 'bg-red-500', status: 'ocupada' }
                    ].map((mesa, i) => (
                      <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold text-white ${mesa.color} shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer border-2 border-white/30 hover:border-white/50`}>
                        <span className="drop-shadow-sm">{mesa.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reservas como el real */}
            <Card className="bg-white border-gray-200 shadow-2xl">
              <CardContent className="p-4">
                <h3 className="text-gray-900 font-semibold mb-4 text-lg">Reservas de Hoy</h3>
                <div className="space-y-3">
                  {[
                    { time: '13:00', name: 'Ana Martín', people: 2, status: 'Confirmada' },
                    { time: '14:30', name: 'Carlos López', people: 4, status: 'Pendiente' },
                    { time: '20:00', name: 'María García', people: 6, status: 'Confirmada' }
                  ].map((reservation, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <div className="text-gray-900 font-semibold">{reservation.time}</div>
                        <div className="text-gray-600 text-sm">{reservation.name} • {reservation.people} personas</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reservation.status === 'Confirmada' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-500 text-black'
                      }`}>
                        {reservation.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Stats Section - SECCIÓN 5: RESULTADOS REALES */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4">
              Resultados <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Reales</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 sm:p-6 rounded-2xl border border-cyan-400/20 shadow-xl shadow-cyan-500/10 text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-cyan-400 mb-2 sm:mb-3 drop-shadow-2xl group-hover:animate-pulse">24/7</div>
              <div className="text-cyan-300 font-semibold text-sm sm:text-base lg:text-lg">Operativo</div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">Sin descanso</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 sm:p-6 rounded-2xl border border-purple-400/20 shadow-xl shadow-purple-500/10 text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-purple-400 mb-2 sm:mb-3 drop-shadow-2xl group-hover:animate-pulse">+75%</div>
              <div className="text-purple-300 font-semibold text-sm sm:text-base lg:text-lg">Más Reservas</div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">Incremento real</div>
            </div>
            
            <div className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 p-4 sm:p-6 rounded-2xl border border-pink-400/20 shadow-xl shadow-pink-500/10 text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-pink-400 mb-2 sm:mb-3 drop-shadow-2xl group-hover:animate-pulse">90%</div>
              <div className="text-pink-300 font-semibold text-sm sm:text-base lg:text-lg">Menos Trabajo</div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">Tiempo liberado</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 sm:p-6 rounded-2xl border border-green-400/20 shadow-xl shadow-green-500/10 text-center group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-green-400 mb-2 sm:mb-3 drop-shadow-2xl group-hover:animate-pulse">0</div>
              <div className="text-green-300 font-semibold text-sm sm:text-base lg:text-lg">Llamadas Perdidas</div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">Cero pérdidas</div>
            </div>
          </div>
        </div>
      </section>


      {/* How it Works for Restaurants - SECCIÓN 3 MEJORADA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-indigo-900/30 to-purple-900/30">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header - Título en una línea que resalta */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              El <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Dashboard Más Potente</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Control total de tu restaurante en una sola interfaz
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left side - Dashboard Preview */}
            <div className="relative">
              <Card className="bg-gradient-to-br from-black/80 to-gray-900/80 border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/20 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header como el dashboard real */}
                  <div className="bg-white shadow-sm border-b p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-semibold">Tu Restaurante</h3>
                          <p className="text-gray-500 text-sm">Panel en tiempo real</p>
                        </div>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">8</div>
                          <div className="text-gray-500 text-xs">Libres</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-pink-600">4</div>
                          <div className="text-gray-500 text-xs">Ocupadas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">6</div>
                          <div className="text-gray-500 text-xs">Reservadas</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex">
                    {/* Sidebar verde como el real */}
                    <div className="w-44 bg-green-600 text-white p-4">
                      <div className="mb-4 pb-3 border-b border-green-500">
                        <h2 className="text-sm font-bold text-white">Tu Restaurante</h2>
                      </div>
                      <nav className="space-y-1">
                        <div className="bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">Agenda</div>
                        <div className="text-green-100 hover:bg-green-700 px-3 py-2 rounded-lg text-sm">Comensales</div>
                        <div className="text-green-100 hover:bg-green-700 px-3 py-2 rounded-lg text-sm">Gestión</div>
                      </nav>
                    </div>

                    {/* Content area con fondo blanco como el real */}
                    <div className="flex-1 bg-gray-50 p-4">
                      {/* Título de sección */}
                      <div className="mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Agenda → Gestión de Reservas</h1>
                        <p className="text-gray-600 text-sm">Control total de reservas en tiempo real</p>
                      </div>

                      {/* Cards como el dashboard real */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <Card className="bg-white border border-gray-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-600">Total Hoy</p>
                                <p className="text-xl font-bold text-gray-900">18</p>
                              </div>
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-white border border-gray-200 shadow-sm">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-600">Confirmadas</p>
                                <p className="text-xl font-bold text-green-600">15</p>
                              </div>
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Lista de reservas como el real */}
                      <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardContent className="p-0">
                          <div className="p-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 text-sm">Próximas Reservas</h3>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {[
                              { time: '13:00', name: 'María García', people: 2, status: 'Confirmada' },
                              { time: '14:30', name: 'Juan López', people: 4, status: 'Pendiente' },
                              { time: '20:00', name: 'Ana Martín', people: 6, status: 'Confirmada' }
                            ].map((res, i) => (
                              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                <div className="flex items-center space-x-3">
                                  <div className="text-sm font-medium text-gray-900">{res.time}</div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{res.name}</div>
                                    <div className="text-xs text-gray-500">{res.people} personas</div>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  res.status === 'Confirmada' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {res.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badge animado */}
              <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse shadow-lg">
                🔴 En Vivo
              </div>
            </div>

            {/* Right side - Features del mismo tamaño que el dashboard */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-br from-black/60 to-gray-900/60 p-6 rounded-xl border border-cyan-400/30 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-xl shadow-lg shadow-cyan-500/50">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-black text-white">AGENDA INTELIGENTE</h3>
                        <div className="bg-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold">MÓDULO 1</div>
                      </div>
                      <p className="text-cyan-300 text-base font-semibold mb-2">
                        IA que predice y optimiza tu día completo
                      </p>
                      <p className="text-gray-300 text-sm">
                        Gestión automática de reservas, predicción de demanda y optimización de horarios en tiempo real.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-br from-black/60 to-gray-900/60 p-6 rounded-xl border border-purple-400/30 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-xl shadow-lg shadow-purple-500/50">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-black text-white">CONTROL DE MESAS</h3>
                        <div className="bg-purple-400/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold">MÓDULO 2</div>
                      </div>
                      <p className="text-purple-300 text-base font-semibold mb-2">
                        Vista panorámica de cada mesa y cliente
                      </p>
                      <p className="text-gray-300 text-sm">
                        Estados en tiempo real, historial de clientes y análisis predictivo de comportamiento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-br from-black/60 to-gray-900/60 p-6 rounded-xl border border-pink-400/30 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-pink-400 to-orange-500 p-3 rounded-xl shadow-lg shadow-pink-500/50">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-black text-white">GESTIÓN TOTAL</h3>
                        <div className="bg-pink-400/20 text-pink-300 px-3 py-1 rounded-full text-xs font-bold">MÓDULO 3</div>
                      </div>
                      <p className="text-pink-300 text-base font-semibold mb-2">
                        Automatización completa del negocio
                      </p>
                      <p className="text-gray-300 text-sm">
                        Base de datos inteligente, reportes automáticos y configuración adaptativa sin intervención humana.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom summary */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl p-12 border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 animate-pulse"></div>
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-full border border-green-400/30 mb-6">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                  <span className="text-green-300 text-sm font-bold uppercase">Resultado Final</span>
                </div>
                
                <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                  El Restaurante Más
                  <span className="block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Eficiente que Existe
                  </span>
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-black/40 p-6 rounded-xl border border-cyan-400/20">
                    <div className="text-3xl font-black text-cyan-400 mb-2">30seg</div>
                    <div className="text-gray-300">Actualización de datos</div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-xl border border-purple-400/20">
                    <div className="text-3xl font-black text-purple-400 mb-2">24/7</div>
                    <div className="text-gray-300">Disponibilidad total</div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-xl border border-pink-400/20">
                    <div className="text-3xl font-black text-pink-400 mb-2">∞</div>
                    <div className="text-gray-300">Dispositivos conectados</div>
                  </div>
                </div>
                
                <p className="text-xl text-gray-200 font-semibold max-w-4xl mx-auto">
                  Tu competencia sigue usando papel y teléfono. Tú tienes el sistema más avanzado del planeta.
                  <span className="block text-cyan-300 mt-2">La diferencia es brutal.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation & ROI Section - SECCIÓN 4 MEJORADA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated Background con efectos más dramáticos */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-cyan-900/40">
          <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-green-500/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-2xl animate-pulse delay-500"></div>
          
          {/* Partículas flotantes */}
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
                    <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-green-400 to-transparent"></div>
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
                    <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-green-400 to-transparent"></div>
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
                        <p className="text-green-400 font-semibold text-sm mb-1">
                          Tu asistente ya está atendiendo llamadas y gestionando reservas automáticamente.
                        </p>
                        <p className="text-yellow-400 text-xs font-medium">
                          → Tu tiempo invertido: 1 minuto
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
                    <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-yellow-400 to-transparent"></div>
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
                    <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-orange-400 to-transparent"></div>
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
                        <p className="text-red-400 font-semibold text-sm mb-1">
                          Cero reservas mal anotadas, doble-reservadas o información incorrecta.
                        </p>
                        <p className="text-green-400 text-xs font-medium">
                          → Recuperación de inversión: menos de 1 semana
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

      {/* Demo Request Form */}
      <section id="demo-form" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Solicita tu <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Demo</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-300">
              Ve ZEORVI en acción con tu restaurante
            </p>
          </div>

          <Card className="bg-gradient-to-br from-black/60 to-gray-900/60 border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-white text-center">Demo Personalizada</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleDemoSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Nombre Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre"
                      value={demoForm.name}
                      onChange={(e) => setDemoForm({...demoForm, name: e.target.value})}
                      required
                      className="bg-black/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={demoForm.email}
                      onChange={(e) => setDemoForm({...demoForm, email: e.target.value})}
                      required
                      className="bg-black/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant" className="text-gray-300">Nombre del Restaurante</Label>
                    <Input
                      id="restaurant"
                      type="text"
                      placeholder="Mi Restaurante"
                      value={demoForm.restaurant}
                      onChange={(e) => setDemoForm({...demoForm, restaurant: e.target.value})}
                      required
                      className="bg-black/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+34 600 000 000"
                      value={demoForm.phone}
                      onChange={(e) => setDemoForm({...demoForm, phone: e.target.value})}
                      required
                      className="bg-black/50 border-cyan-500/30 text-white placeholder-gray-400 focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 w-full sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Solicitar Demo Gratis
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl p-8 border border-cyan-400/20 shadow-2xl shadow-cyan-500/10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6">
              ¿Listo para el <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Futuro</span>?
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Únete a los restaurantes que ya automatizaron sus reservas
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300">
                Empezar Ahora
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">ZEORVI</span>
          </div>
          <p className="text-gray-400">
            © 2024 ZEORVI - Automatización inteligente para restaurantes
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}
