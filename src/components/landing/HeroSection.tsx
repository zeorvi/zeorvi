'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-3 sm:px-5 py-2 rounded-full border border-cyan-400/40 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
              <div className="relative">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-cyan-300 text-xs font-bold tracking-wide uppercase">
                #1 en Gestión Inteligente
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.9] tracking-tight">
              <span className="block font-light text-gray-100">Automatiza</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl font-black">
                tu restaurante
              </span>
            </h1>

            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 font-light leading-relaxed text-center lg:text-left">
                Más reservas. Menos trabajo. Cero llamadas perdidas.
              </p>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-cyan-300 font-light leading-relaxed max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                Tu asistente con IA avanzada coge todas las llamadas sin perderse ninguna. Gestiona reservas 24/7 y asigna la mejor mesa con calidez humana.
              </p>
              
              <div className="flex flex-nowrap justify-center lg:justify-start gap-1 sm:gap-2 text-xs">
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-400/30 font-semibold whitespace-nowrap">
                  ✓ +75% reservas
                </span>
                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-400/30 font-semibold whitespace-nowrap">
                  ✓ 0 errores humanos
                </span>
                <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full border border-pink-400/30 font-semibold whitespace-nowrap">
                  ✓ 24/7 operativo
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-start">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-0 py-2 text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 w-auto"
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
          <div className="relative md:w-3/4 md:mx-auto">
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
                  <div className="relative z-10 w-full h-full">
                    <iframe
                      src="https://drive.google.com/file/d/1zC8RVWUfbWKrLyTmoZqc4Z2vevJnuAJy/preview"
                      width="100%"
                      height="100%"
                      allow="autoplay"
                      className="rounded-lg"
                      title="Demo de Restaurante IA"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-3 -right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg border-2 border-white z-20">
              🔴 En Vivo
            </div>
            
            <div className="absolute -bottom-3 -left-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border-2 border-white z-20">
              ⚡ Instalación inmediata
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
