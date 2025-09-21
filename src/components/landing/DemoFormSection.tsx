'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function DemoFormSection() {
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
    <section id="demo-form" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Agendemos una <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Reunión</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300">
            Ve ZEORVI en acción con tu restaurante
          </p>
        </div>

        <Card className="bg-gradient-to-br from-black/60 to-gray-900/60 border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
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
                  Enviar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
