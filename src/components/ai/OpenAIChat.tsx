'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  typing?: boolean;
}

interface OpenAIChatProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
  currentUserName: string;
  isDarkMode?: boolean;
}

export default function OpenAIChat({ 
  restaurantId, 
  restaurantName, 
  restaurantType, 
  currentUserName,
  isDarkMode = false
}: OpenAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar chat con mensaje de bienvenida
  useEffect(() => {
    // Limpiar mensajes previos
    setMessages([]);
    
    const welcomeMessage: Message = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: `👋 ¡Bienvenido, ${currentUserName}!
Soy vuestro Asistente IA para ${restaurantName}.
¿En qué puedo ayudaros hoy?

• 📅 Reservas y agenda
• 🍽️ Gestión de mesas
• 👥 Clientes y personal
• 📞 Llamadas del día
• 🍴 Alergias y dietas
• 💡 Sugerencias de servicio
• 🌤️ Clima y tiempo
• 📰 Noticias y actualidad
• 👨‍🍳 Recetas

✨ Preguntad cualquier cosa, ¡soy vuestro asistente integral!`,
      timestamp: new Date().toISOString()
    };

    // Usar timeout para asegurar que se renderice
    setTimeout(() => {
      setMessages([welcomeMessage]);
      setLoading(false);
      // Scroll al top inicialmente
      scrollToTop();
    }, 100);
  }, [restaurantName, currentUserName]);

  const scrollToTop = () => {
    // Scroll al inicio del chat
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToBottom = () => {
    // Intentar múltiples métodos para asegurar el scroll
    const container = document.getElementById('chat-messages-container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
    
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // Auto-scroll al final cuando llegan nuevos mensajes (solo si hay más de un mensaje)
  useEffect(() => {
    // Si solo hay el mensaje de bienvenida, mantener scroll arriba
    if (messages.length <= 1) {
      const timer = setTimeout(scrollToTop, 100);
      return () => clearTimeout(timer);
    }
    
    // Si hay conversación, scroll al final
    const timers = [
      setTimeout(scrollToBottom, 50),
      setTimeout(scrollToBottom, 150),
      setTimeout(scrollToBottom, 300)
    ];
    return () => timers.forEach(clearTimeout);
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);
    
    // Forzar scroll inmediatamente después de enviar
    setTimeout(scrollToBottom, 50);

    try {
      // Simular llamada a OpenAI API
      const response = await fetch('/api/openai/chat?' + Date.now(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          restaurantId,
          restaurantName,
          restaurantType,
          restaurantContext: {
            currentOccupancy: 12,
            totalTables: 18,
            todayReservations: 7,
            todayRevenue: 12450,
            staffOnDuty: 6,
            specialties: ['Mole Poblano de la Abuela', 'Cochinita Pibil Yucateca'],
            currentTime: new Date().toLocaleTimeString(),
            dayOfWeek: 'domingo',
            allergyFriendly: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con la IA');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Si hay error en la API, mostrar mensaje de error útil
      console.error('❌ Error llamando API:', error);
      
      const errorMessage: Message = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: `¡Ups! 😅 Parece que hay un problema técnico momentáneo. 

Estoy aquí para ayudaros, pero necesito que me hagáis una pregunta más específica. Por ejemplo:

• "¿Cómo hacer una tortilla española?"
• "¿Cuántas mesas están ocupadas?"
• "¿Qué es la inteligencia artificial?"
• "¿Cómo funciona el marketing digital?"

¡Intentad de nuevo con una pregunta concreta y os ayudo inmediatamente! 😊`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      // Forzar scroll cuando termina de escribir - múltiples intentos
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
      setTimeout(scrollToBottom, 500);
    }
  };

  const generateExampleResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // RESPUESTA DIRECTA PARA CUALQUIER PREGUNTA
    return `¡Hola! Te ayudo con tu pregunta: "${userInput}"

👨‍🍳 TORTILLA ESPAÑOLA MEXICANA

Ingredientes:
• 6 huevos frescos
• 4 papas medianas  
• 1 cebolla blanca
• 2 chiles poblanos
• Aceite de oliva
• Sal y pimienta
• Queso Oaxaca rallado

Preparación:
1. Pela y corta las papas en rodajas finas
2. Sofríe papas con cebolla hasta dorar (10 min)
3. Agrega chiles poblanos picados
4. Bate los huevos y mézclalos con las papas tibias
5. Cocina en sartén antiadherente 3-4 min por lado
6. Agrega queso antes de doblar
7. Sirve caliente con salsa verde

🌶️ Tip: En El Buen Sabor la acompañamos con frijoles refritos y aguacate.

¿Te ayudo con otra receta o tienes alguna otra pregunta?`;
    
    if (input.includes('reserva') || input.includes('agenda')) {
      return `📅 Estado de Reservas - El Buen Sabor

Hoy tienes 7 reservas programadas:

Próximas reservas:
• 19:00 - Maria Garcia (4 personas) - Mesa M3
• 20:30 - Juan Gomez (2 personas) - Mesa M1 (¡Propuesta matrimonio! 💍)
• 21:15 - Laura Sanchez (7 personas) - Mesa M14

Recomendaciones:
• La mesa M1 necesita velas y música suave para la propuesta
• Confirmar que tenemos silla alta para Laura Sanchez
• Los estudiantes mencionaron presupuesto limitado, sugerir menú económico

¿Quieres que haga alguna llamada de confirmación o necesitas más detalles?`;
    }
    
    if (input.includes('mesa') || input.includes('ocupación')) {
      return `🍽️ **Estado de Mesas - Tiempo Real**

**Situación actual (${new Date().toLocaleTimeString()}):**
• 🟢 **6 mesas disponibles** - M1, M7, M9, M11, M16, M17
• 🔴 **12 mesas ocupadas** - Familias almorzando (promedio 1h 45min)
• 🟡 **7 reservas** pendientes para hoy

**Mesas especiales activas:**
• Mesa M12 - Familia Rodríguez (cliente VIP, cerca ventana)
• Mesa M5 - Pareja aniversario (romántica, vino servido)
• Mesa M8 - Preparándose para cumpleaños abuela Carmen

**Recomendación:** La ocupación está al 67%, perfecto para domingo. Mesa M1 romántica lista para la propuesta de las 20:30.`;
    }
    
    if (input.includes('personal') || input.includes('empleado') || input.includes('staff')) {
      return `👥 **Equipo El Buen Sabor - Estado Actual**

**Personal en turno (6 de 8):**
• María Elena Vásquez - Gerente ⭐ 4.9
• José Luis Hernández - Chef Principal ⭐ 4.8  
• Ana Sofía Morales - Mesera ⭐ 4.7
• Roberto García - Mesero ⭐ 4.5
• Carmen Jiménez - Anfitriona ⭐ 4.8
• Personal de limpieza - Turno completo

**Métricas del equipo:**
• 95% asistencia promedio (excelente)
• 4.7 rating promedio de servicio
• 320 horas trabajadas esta semana

**Nota especial:** José Luis está preparando el pastel especial para el cumpleaños de la abuela Carmen (15:30).`;
    }
    
    if (input.includes('alergia') || input.includes('alérgico') || input.includes('dieta') || input.includes('especial')) {
      return `🍴 **Alergias y Dietas Especiales - El Buen Sabor**

**Opciones disponibles:**
• Sin gluten: Quesadillas con tortilla de maíz, ensaladas
• Sin lácteos: Mole poblano, cochinita pibil, guacamole
• Vegetariano: Quesadillas de flor de calabaza, chiles rellenos
• Vegano: Guacamole, salsas, frijoles refritos (sin manteca)

**Ingredientes a evitar:**
• Mole: contiene chocolate y frutos secos
• Tortillas de harina: contienen gluten
• Quesos: lácteos

**Recomendación:** Siempre confirmar con el cliente sus alergias específicas antes de servir.`;
    }
    
    if (input.includes('cliente') || input.includes('vip') || input.includes('fidelidad')) {
      return `👑 **Clientes VIP - El Buen Sabor**

**Clientes especiales hoy:**
• **Familia Rodríguez** (Mesa M12) - Cliente ORO
  - 18 visitas • $12,450 gastados
  - Vienen TODOS los domingos
  - Siempre piden mesa cerca de ventana

• **Carlos y Elena Martínez** (Mesa M5) - Cliente PLATA  
  - 8 visitas • $3,890 gastados
  - Celebran fechas especiales aquí
  - Hoy es su aniversario de bodas 💕

**Estadísticas:**
• 247 clientes registrados (+23 este mes)
• 68% clientes recurrentes (¡excelente fidelidad!)
• $307 gasto promedio por visita familiar

¿Quieres que prepare algo especial para algún cliente?`;
    }
    
    if (input.includes('llamada') || input.includes('teléfono') || input.includes('retell')) {
      return `📞 **Llamadas IA Procesadas Hoy**

**Resumen de llamadas:**
• **8 llamadas** recibidas y procesadas
• **100% efectividad** (todas atendidas exitosamente)
• **Promedio 2:15 min** por llamada
• **Costo total: $13.50** (muy eficiente)

**Llamadas destacadas:**
1. **11:30 AM** - Ana Ruiz ⭐ 5.0
   - Reserva dominical usual, reconocí su voz
   - Sugerí mesa M12 cerca ventana automáticamente
   
2. **12:15 PM** - Jose Lopez ⭐ 5.0
   - Detecté que era aniversario por el tono
   - Recomendé mesa romántica y vino
   
3. **13:45 PM** - Llamada saliente ⭐ 4.0
   - Confirmé reserva empresarial Maria Garcia
   - Verifiqué WiFi y privacidad

¿Quieres que haga alguna llamada específica?`;
    }
    
    if (input.includes('recomendación') || input.includes('consejo') || input.includes('sugerencia')) {
      return `💡 **Recomendaciones Inteligentes**

**Para hoy (Domingo):**
• **Preparar más sillas altas** - Vienen 3 familias con niños pequeños
• **Tener velas listas** - Mesa M1 romántica para propuesta matrimonio
• **Pastel especial** - Cumpleaños abuela Carmen (85 años) a las 15:30
• **Menú económico** - Carmen Perez graduación tienen presupuesto limitado

**Para la semana:**
• **Reabastecer tortillas** urgente (agotadas)
• **Pedido chocolate mole** para el martes
• **Entrenar meseros** en maridajes (parejas románticas +80% vino)
• **Más personal** viernes 19:00-21:00 (horario pico romántico)

**Insight especial:** Los domingos familiares generan 40% más ingresos. Considera promoción "Domingo en Familia" con descuento para grupos de 5+.`;
    }

    // Respuestas generales y de conocimiento amplio
    if (input.includes('tiempo') || input.includes('clima') || input.includes('mañana')) {
      return `🌤️ **Información del Clima**

No tengo acceso a datos meteorológicos en tiempo real, pero puedo sugerirte:

**Para consultar el clima:**
• Revisa Google Weather o apps como AccuWeather
• Busca "clima Ciudad de México" en tu navegador
• Usa Siri o Google Assistant: "¿Qué tiempo hará mañana?"

**Para tu restaurante:**
• Si llueve mañana, prepara más mesas interiores
• Días soleados = más clientes en terraza
• Clima frío = bebidas calientes más populares

¿Te gustaría que te ayude a planificar el menú según el clima esperado?`;
    }

    if (input.includes('noticia') || input.includes('actualidad') || input.includes('noticias')) {
      return `📰 **Noticias y Actualidad**

No tengo acceso a noticias en tiempo real, pero puedo sugerirte:

**Fuentes confiables:**
• Google News para noticias generales
• El Universal, Milenio para noticias de México
• Expansión para noticias de negocios
• Gastrolab para tendencias gastronómicas

**Para tu restaurante:**
• Mantente al día con tendencias gastronómicas
• Eventos locales pueden aumentar clientela
• Días festivos requieren preparación especial

¿Te interesa que te ayude a planificar promociones para fechas especiales?`;
    }


    if (input.includes('marketing') || input.includes('promoción') || input.includes('publicidad')) {
      return `📢 **Marketing para Restaurantes**

Ideas para promocionar El Buen Sabor:

**Redes sociales:**
• Instagram: fotos de platillos, stories del día
• Facebook: eventos especiales, menús
• TikTok: proceso de preparación del mole

**Promociones familiares:**
• "Domingo familiar": descuento grupos 5+
• "Niños comen gratis" los miércoles
• Loyalty card: 10 visitas = comida gratis

**Marketing local:**
• Alianzas con escuelas del área
• Catering para oficinas cercanas
• Participar en festivales gastronómicos

¿Qué tipo de promoción te interesa implementar?`;
    }

    // Respuesta inteligente y conversacional como un asistente real
    if (input.includes('hola') || input.includes('buenos') || input.includes('buenas')) {
      return `¡Hola! 👋 Es un placer saludarte. Soy tu asistente IA de ${restaurantName} y estoy aquí para ayudarte con lo que necesites, tanto del restaurante como de cualquier otro tema que te interese. ¿En qué puedo ayudarte hoy?`;
    }

    if (input.includes('cómo estás') || input.includes('como estas') || input.includes('qué tal')) {
      return `¡Muy bien, gracias por preguntar! 😊 Estoy funcionando perfectamente y listo para ayudarte. Hoy he estado monitoreando ${restaurantName} - todo marcha excelente. ¿Y tú cómo estás? ¿En qué puedo ayudarte?`;
    }

    if (input.includes('gracias') || input.includes('perfecto') || input.includes('excelente')) {
      return `¡De nada! Me alegra poder ayudarte. 😊 Siempre estoy aquí para lo que necesites, ya sea sobre ${restaurantName} o cualquier otra consulta. ¡No dudes en preguntarme lo que sea!`;
    }

    // Para preguntas generales, dar una respuesta inteligente y útil
    return `Entiendo que quieres saber sobre "${input}". 

Como tu asistente IA integral, puedo ayudarte con una gran variedad de temas. Aunque me especializo en ${restaurantName}, también puedo conversar sobre:

**🤖 Cualquier tema que necesites:**
• Recetas y técnicas culinarias
• Consejos de negocio y marketing
• Información general y curiosidades
• Clima, noticias, y actualidad
• Recomendaciones personalizadas

**🏪 Sobre tu restaurante:**
• 12 mesas ocupadas actualmente
• 7 reservas para hoy
• 6 personas en turno

¿Podrías ser más específico sobre qué aspecto te interesa? Por ejemplo:
• Si quieres una receta, dime qué platillo
• Si necesitas consejos de negocio, cuéntame la situación
• Si es sobre el restaurante, pregúntame lo específico

¡Estoy aquí para ayudarte con lo que sea! 😊`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-4 bg-slate-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">

      {/* Área de Chat con altura responsive */}
      <Card className={`h-[400px] sm:h-[450px] md:h-[500px] lg:h-[580px] flex flex-col backdrop-blur-sm border-0 shadow-xl rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 ${
        isDarkMode ? 'bg-gray-900/80' : 'bg-white/60'
      }`}>
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4 scroll-smooth" id="chat-messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-xl px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-md md:rounded-lg flex items-center justify-center">
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-sm"></div>
                    </div>
                    <span className="font-semibold text-white text-xs md:text-sm">Asistente IA</span>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">
                  {message.content}
                </div>
                
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Indicador de escritura */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-sm"></div>
                  </div>
                  <span className="font-semibold text-purple-900 text-sm">Asistente IA</span>
                </div>
                <div className="flex items-center space-x-1 mt-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-purple-600 text-sm ml-2">Escribiendo...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Elemento para auto-scroll - debe estar al final */}
          <div ref={messagesEndRef} style={{ height: '20px', flexShrink: 0 }} />
        </div>

        {/* Input de mensaje - ABAJO PERO VISIBLE */}
        <div className={`px-2 sm:px-3 md:px-4 pb-0 pt-0 -mb-1 sm:-mb-2 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700/50' : 'border-slate-200/50'
        }`}>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                placeholder="Pregúntame sobre reservas, mesas, personal..."
                className={`pr-8 sm:pr-10 md:pr-12 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg md:rounded-xl border-2 transition-all duration-300 text-xs sm:text-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400' 
                    : 'border-slate-200 focus:border-purple-400'
                }`}
                disabled={isTyping}
              />
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isTyping}
              className={`px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 md:py-2 rounded-md sm:rounded-lg md:rounded-xl font-semibold shadow-lg transition-all duration-300 text-xs sm:text-sm ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
              }`}
            >
              <span className="hidden sm:inline">Enviar</span>
              <span className="sm:hidden">→</span>
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
