'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {

  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[0.9] tracking-tight">
              <span className="block font-light text-gray-100">Automatiza</span>
              <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl font-black">
                tu restaurante
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 font-light text-center md:text-center lg:text-left max-w-sm md:max-w-2xl lg:max-w-xl leading-relaxed mx-auto md:mx-auto lg:mx-0">
              Nunca más una llamada perdida. Atiende clientes mientras duermes y genera ingresos en tus días de descanso.
            </p>

            <div className="flex justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-8 py-4 text-lg font-semibold shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 rounded-full"
                onClick={() => {
                  const formElement = document.querySelector('#demo-form');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Iniciar Ahora
                <ArrowRight className="ml-3 h-5 w-5" />
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
                      style={{border: 'none'}}
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