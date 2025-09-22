'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, ArrowRight, Play, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
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

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tight">
              <span className="block font-light text-gray-100">Automatiza</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl font-black">
                tu restaurante
              </span>
            </h1>

            <div className="space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-light leading-relaxed">
                Más reservas. Menos trabajo. Cero llamadas perdidas.
              </p>
              <div className="text-base sm:text-lg text-cyan-300 font-light leading-relaxed max-w-2xl">
                <p>Tu asistente con IA avanzada coge todas las llamadas sin perderse ninguna.</p>
                <p>Gestiona reservas 24/7 y asigna la mejor mesa con calidez humana.</p>
              </div>
              
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
                      <p className="text-white text-lg">🤖 "Hola, soy tu asistente inteligente..."</p>
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
                          setTimeout(() => setIsPlaying(false), 5000);
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
              ⚡ Instalación inmediata
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
