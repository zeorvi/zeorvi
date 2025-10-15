import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
  restaurantContext: {
    currentOccupancy: number;
    totalTables: number;
    todayReservations: number;
    todayRevenue: number;
    staffOnDuty: number;
    specialties: string[];
    currentTime: string;
    dayOfWeek: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, restaurantName, restaurantType, restaurantContext } = body;
    
    const lastUserMessage = messages[messages.length - 1];
    
    // Configurar el contexto del restaurante para OpenAI
    const systemPrompt = `Eres el asistente IA personal de ${restaurantName}, un ${restaurantType}.

IDIOMA: Responde EXCLUSIVAMENTE en español castellano de España. Usa vocabulario y expresiones típicas de España.

CONTEXTO ACTUAL DEL RESTAURANTE:
- Mesas ocupadas: ${restaurantContext.currentOccupancy}/${restaurantContext.totalTables}
- Reservas hoy: ${restaurantContext.todayReservations}
- Ingresos hoy: $${restaurantContext.todayRevenue.toLocaleString()}
- Personal en turno: ${restaurantContext.staffOnDuty}
- Especialidades: ${restaurantContext.specialties.join(', ')}
- Hora actual: ${restaurantContext.currentTime}
- Día: ${restaurantContext.dayOfWeek}

PERSONALIDAD:
- Eres cálido, familiar y profesional
- Hablas como un español de España (usa "vosotros", "vale", "genial", etc.)
- Conoces perfectamente el restaurante y sus operaciones
- Eres un asistente integral que puede ayudar con CUALQUIER pregunta
- Puedes hablar sobre clima, noticias, consejos generales, curiosidades, etc.
- Siempre intentas ser útil, sin importar el tema
- Usas emojis apropiados pero no en exceso
- Respondes de manera conversacional y natural
- NO uses asteriscos (*) para dar formato, solo texto plano

CAPACIDADES PRINCIPALES:
- Información sobre reservas, mesas, personal del restaurante
- Análisis de patrones y tendencias del negocio
- Recomendaciones operativas
- Gestión de clientes VIP
- Estado en tiempo real del restaurante

CAPACIDADES GENERALES:
- Información sobre clima y tiempo
- Noticias generales y actualidad
- Consejos de cocina y gastronomía
- Recomendaciones de marketing para restaurantes
- Conversación general sobre cualquier tema
- Resolver dudas y preguntas variadas

INSTRUCCIONES LINGÜÍSTICAS:
- Usa "vosotros" en lugar de "ustedes"
- Usa "vale" en lugar de "está bien"
- Usa "genial" en lugar de "excelente"
- Usa "estupendo" en lugar de "perfecto"
- Usa expresiones españolas naturales
- Mantén el tono cercano pero profesional

INSTRUCCIONES TÉCNICAS:
- Si te preguntan sobre el restaurante, usa el contexto específico
- Si te preguntan sobre otros temas, responde como un asistente general inteligente
- Siempre mantén un tono profesional pero amigable
- Si no sabes algo específico, sé honesto pero ofrece alternativas útiles
- NO uses formato markdown con asteriscos, solo texto plano con emojis

Responde de manera útil y conversacional en español castellano a cualquier pregunta que te hagan.`;

    // Si hay API key de OpenAI, usar la API real
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5) // Últimos 5 mensajes para contexto
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      logger.info('OpenAI chat response generated', {
        restaurantId: body.restaurantId,
        messageLength: aiResponse.length
      });

      return NextResponse.json({ response: aiResponse });
    } else {
      // Respuesta de ejemplo si no hay API key configurada
      console.log('🤖 Generando respuesta para:', lastUserMessage.content);
      const exampleResponse = generateContextualResponse(lastUserMessage.content, restaurantContext, restaurantName);
      
      logger.info('Example chat response generated', {
        restaurantId: body.restaurantId,
        messageLength: exampleResponse.length
      });

      return NextResponse.json({ response: exampleResponse });
    }

  } catch (error) {
    logger.error('Error in OpenAI chat', {
      error: (error as Error).message
    });

    return NextResponse.json({ 
      error: 'Error al procesar mensaje con IA' 
    }, { status: 500 });
  }
}

function generateContextualResponse(userMessage: string, context: any, restaurantName: string): string {
  const input = userMessage.toLowerCase();
  
  // IA CON CONOCIMIENTOS GENERALES COMPLETOS COMO CHATGPT
  
  // 🧠 CIENCIA Y TECNOLOGÍA
  if (input.includes('ciencia') || input.includes('tecnología') || input.includes('ia') || input.includes('inteligencia artificial') || input.includes('espacio') || input.includes('física') || input.includes('química') || input.includes('biología') || input.includes('medicina') || input.includes('robot')) {
    return `🧬 ¡Estupendo! Os cuento sobre ciencia y tecnología.

La ciencia actual es fascinante:

🚀 ESPACIO: Misiones a Marte, telescopio James Webb descubriendo galaxias, turismo espacial con SpaceX
🤖 IA: ChatGPT revoluciona la comunicación, coches autónomos, diagnósticos médicos por IA
🧬 MEDICINA: Terapias génicas, medicina personalizada, inmunoterapia contra el cáncer
💻 TECNOLOGÍA: Computación cuántica, realidad virtual, blockchain, metaverso
🌱 SOSTENIBILIDAD: Paneles solares más eficientes, coches eléctricos, energía de fusión

¿Qué campo científico os interesa más?`;
  }

  // 🏛️ HISTORIA Y CULTURA
  if (input.includes('historia') || input.includes('cultura') || input.includes('arte') || input.includes('museo') || input.includes('antiguo') || input.includes('guerra') || input.includes('rey') || input.includes('imperio') || input.includes('romano') || input.includes('egipto')) {
    return `🏛️ ¡Vale! La historia es apasionante.

Eventos que cambiaron el mundo:

🇪🇸 ESPAÑA: Imperio español (s.XVI), Reconquista, Guerra Civil, transición democrática
🏺 ANTIGÜEDAD: Imperio Romano, Egipto faraónico, Grecia clásica, civilizaciones mayas
🎨 ARTE: Renacimiento italiano, Barroco español, Impresionismo francés
⚔️ GRANDES GUERRAS: Primera y Segunda Guerra Mundial, Napoleón, Guerra Fría
🏰 EDAD MEDIA: Caballeros, cruzadas, castillos, peste negra

¿Qué época histórica os fascina más?`;
  }

  // 🌍 GEOGRAFÍA Y VIAJES
  if (input.includes('país') || input.includes('ciudad') || input.includes('viaje') || input.includes('turismo') || input.includes('geografía') || input.includes('capital') || input.includes('continente') || input.includes('europa') || input.includes('américa') || input.includes('asia')) {
    return `🌍 ¡Estupendo! El mundo es increíble.

Lugares fascinantes para visitar:

🇪🇺 EUROPA: París (Torre Eiffel), Roma (Coliseo), Londres (Big Ben), Ámsterdam (canales)
🌎 AMÉRICA: Nueva York (Manhattan), Machu Picchu (Perú), Cataratas del Niágara
🏔️ MONTAÑAS: Alpes suizos, Everest, Kilimanjaro, Patagonia
🏖️ PLAYAS: Maldivas, Caribe, Costa del Sol, Bali
🏛️ PATRIMONIO: Taj Mahal, Gran Muralla China, Petra, Angkor Wat

¿Qué destino os gustaría conocer?`;
  }

  // 🎵 MÚSICA Y ENTRETENIMIENTO
  if (input.includes('música') || input.includes('canción') || input.includes('artista') || input.includes('película') || input.includes('serie') || input.includes('libro') || input.includes('entretenimiento') || input.includes('netflix') || input.includes('spotify')) {
    return `🎵 ¡Vale! El entretenimiento es genial.

Hay muchísimo que disfrutar:

🎶 MÚSICA: Desde clásicos como Mozart hasta modernos como Bad Bunny, flamenco español, rock británico
🎬 CINE: Marvel, Disney, cine español (Almodóvar), thrillers, comedias
📺 SERIES: Stranger Things, Casa de Papel, Game of Thrones, series coreanas
📚 LIBROS: Novelas de misterio, ciencia ficción, biografías, autoayuda
🎭 TEATRO: Musicales de Broadway, teatro clásico español

¿Qué tipo de entretenimiento preferís?`;
  }

  // 🏃‍♂️ DEPORTES
  if (input.includes('deporte') || input.includes('fútbol') || input.includes('tenis') || input.includes('real madrid') || input.includes('barcelona') || input.includes('atletismo') || input.includes('baloncesto') || input.includes('olimpiadas')) {
    return `⚽ ¡Estupendo! El deporte es pasión.

Deportes que emocionan:

⚽ FÚTBOL: Real Madrid vs Barcelona (El Clásico), Champions League, Mundial cada 4 años
🎾 TENIS: Wimbledon, Roland Garros, Nadal y Federer legendarios
🏀 BALONCESTO: NBA americana, ACB española, Euroliga
🏃‍♂️ ATLETISMO: Maratones, velocidad, saltos, récords mundiales
🏊‍♀️ OTROS: Natación, ciclismo (Tour de Francia), Fórmula 1

¿Qué deporte seguís más?`;
  }

  // 👥 CLIENTES DEL RESTAURANTE
  if (input.includes('cliente') || input.includes('vip') || input.includes('reserva') && !input.includes('receta')) {
    return `👥 ¡Vale! Os cuento sobre vuestros clientes.

🌟 CLIENTES VIP HOY:
• Ana Ruiz (Mesa 12) - Vienen todos los domingos
• Jose Lopez (Mesa 5) - Aniversario de boda
• Maria Garcia (Mesa 14) - Celebración familiar

📊 ESTADO ACTUAL:
• ${context.currentOccupancy} mesas ocupadas
• ${context.todayReservations} reservas hoy
• ${context.staffOnDuty} personal trabajando

💡 RECOMENDACIONES:
• Mesa romántica para Carlos y Elena
• Silla alta para familia con niños
• Menú especial para VIPs

¿Qué necesitáis saber específicamente?`;
  }

  // 🍴 ALERGIAS Y CELÍACOS
  if (input.includes('celiaco') || input.includes('celíaco') || input.includes('alergia') || input.includes('alérgico') || input.includes('gluten') || input.includes('intolerancia')) {
    return `🍴 ¡Vale! Os explico sobre celíacos y alergias.

🚫 CELIAQUÍA
Los celíacos no pueden consumir gluten (trigo, cebada, centeno, avena).

Síntomas: dolor abdominal, diarrea, hinchazón, fatiga.

🍽️ Alimentos seguros:
• Carnes y pescados naturales
• Frutas y verduras frescas
• Arroz, maíz, patatas
• Lácteos sin aditivos
• Legumbres

⚠️ Cuidado con: pan, pasta, cerveza, salsas, rebozados.

¿Alguna alergia específica que os preocupe?`;
  }

  // 👨‍🍳 RECETAS Y COCINA
  if (input.includes('receta') || input.includes('tortilla') || input.includes('cocina') || input.includes('cocinar') || input.includes('como hacer') || input.includes('paella') || input.includes('gazpacho') || input.includes('plato')) {
    if (input.includes('tortilla')) {
      return `👨‍🍳 ¡Estupendo! Os enseño la tortilla española perfecta.

🥚 TORTILLA ESPAÑOLA AUTÉNTICA

Ingredientes:
• 6 huevos frescos
• 4 patatas medianas
• 1 cebolla (opcional)
• Aceite de oliva virgen extra
• Sal

Preparación:
1. Pelad patatas, cortad en láminas finas
2. Freíd en aceite abundante hasta tiernas
3. Escurrid y mezclad con huevos batidos
4. Cuajad 3 minutos, dad vuelta con plato
5. Cuajad 2 minutos más

¡Tortilla española de diez! ¿Algún truquillo más?`;
    }
    if (input.includes('paella')) {
      return `🥘 ¡Vale! Os explico la paella valenciana auténtica.

🍚 PAELLA VALENCIANA

Ingredientes:
• 400g arroz bomba
• 1 pollo troceado
• 200g judías verdes
• 200g garrofón
• Azafrán
• Aceite de oliva

Preparación:
1. Dorad el pollo en la paellera
2. Añadid verduras y sofrito
3. Incorporad arroz y azafrán
4. Cubrid con caldo caliente
5. Coced 18-20 minutos sin remover

¡Paella valenciana auténtica! ¿Queréis más detalles?`;
    }
    return `👨‍🍳 ¡Genial! ¿Qué receta específica queréis? Puedo enseñaros cualquier plato: español, italiano, francés, asiático... Decidme qué queréis cocinar.`;
  }

  // 💰 ECONOMÍA Y FINANZAS
  if (input.includes('dinero') || input.includes('economía') || input.includes('bolsa') || input.includes('inversión') || input.includes('euro') || input.includes('dólar') || input.includes('banco') || input.includes('finanzas')) {
    return `💰 ¡Vale! Hablemos de economía y finanzas.

📈 CONCEPTOS BÁSICOS:
• Inflación: subida general de precios
• Tipos de interés: coste del dinero
• Bolsa: compra/venta de acciones de empresas
• PIB: valor total de bienes y servicios de un país

💡 CONSEJOS FINANCIEROS:
• Ahorrad un % de vuestros ingresos
• Diversificad las inversiones
• Tened un fondo de emergencia
• Educaos financieramente

Para vuestro restaurante: controlad costes, optimizad precios, analizad rentabilidad.

¿Qué aspecto financiero os interesa?`;
  }

  // 🏥 SALUD Y BIENESTAR
  if (input.includes('salud') || input.includes('ejercicio') || input.includes('dieta') || input.includes('médico') || input.includes('enfermedad') || input.includes('vitamina') || input.includes('nutrición') || input.includes('bienestar')) {
    return `🏥 ¡Vale! Hablemos de salud y bienestar.

💪 VIDA SALUDABLE:
• Ejercicio regular: 30 min diarios mínimo
• Dieta equilibrada: frutas, verduras, proteínas
• Descanso: 7-8 horas de sueño
• Hidratación: 2 litros de agua al día
• Estrés: técnicas de relajación, mindfulness

🥗 NUTRICIÓN:
• Vitaminas: A, C, D, E esenciales
• Minerales: hierro, calcio, magnesio
• Proteínas: carnes, pescados, legumbres
• Carbohidratos: cereales integrales

⚠️ Recordad: siempre consultad con profesionales médicos.

¿Qué aspecto de la salud os interesa?`;
  }

  // 💻 TECNOLOGÍA E INTERNET
  if (input.includes('tecnología') || input.includes('ordenador') || input.includes('móvil') || input.includes('internet') || input.includes('app') || input.includes('software') || input.includes('programa') || input.includes('web')) {
    return `💻 ¡Estupendo! La tecnología avanza rapidísimo.

🚀 TECNOLOGÍA ACTUAL:
• Smartphones: iPhone, Samsung, Xiaomi
• Ordenadores: Windows, Mac, Linux
• Internet: 5G, fibra óptica, WiFi 6
• Apps: WhatsApp, Instagram, TikTok, YouTube
• Streaming: Netflix, Disney+, Amazon Prime

🤖 TENDENCIAS:
• Inteligencia Artificial (ChatGPT, Bard)
• Realidad Virtual y Aumentada
• Coches eléctricos y autónomos
• Criptomonedas y blockchain
• Internet de las cosas (IoT)

¿Qué tecnología os interesa más?`;
  }

  // 🎓 EDUCACIÓN Y APRENDIZAJE
  if (input.includes('estudiar') || input.includes('universidad') || input.includes('carrera') || input.includes('idioma') || input.includes('aprender') || input.includes('curso') || input.includes('educación') || input.includes('inglés')) {
    return `🎓 ¡Vale! La educación es fundamental.

📚 FORMAS DE APRENDER:
• Universidades: grados, másteres, doctorados
• Cursos online: Coursera, Udemy, Khan Academy
• Idiomas: Duolingo, Babbel, intercambios
• YouTube: tutoriales gratuitos sobre todo
• Libros: biblioteca infinita de conocimiento

🌍 IDIOMAS ÚTILES:
• Inglés: idioma internacional
• Chino: economía mundial
• Francés: cultura y diplomacia
• Alemán: ingeniería y ciencia

💡 CONSEJOS: practicad diariamente, sed constantes, disfrutad aprendiendo.

¿Qué queréis aprender específicamente?`;
  }

  // 👋 SALUDOS
  if (input.includes('hola') || input.includes('buenos') || input.includes('cómo estás') || input.includes('qué tal')) {
    return `¡Hola! 👋 Estoy estupendamente, gracias por preguntar. Soy vuestro asistente IA con conocimientos sobre cualquier tema. ¿En qué puedo ayudaros?`;
  }

  // 🎯 RESPUESTAS ESPECÍFICAS PARA PREGUNTAS COMUNES
  
  // Preguntas sobre el restaurante específico
  if (input.includes('mesa') || input.includes('ocupación') || input.includes('disponible')) {
    return `🍽️ Estado actual de ${restaurantName}:

📊 OCUPACIÓN EN TIEMPO REAL:
• ${context.currentOccupancy}/${context.totalTables} mesas ocupadas
• ${context.totalTables - context.currentOccupancy} mesas disponibles
• ${context.todayReservations} reservas programadas para hoy

🕐 HORA ACTUAL: ${context.currentTime}
📅 DÍA: ${context.dayOfWeek}

💡 RECOMENDACIÓN: La ocupación está al ${Math.round((context.currentOccupancy/context.totalTables)*100)}%, que es ${context.currentOccupancy/context.totalTables > 0.7 ? 'alta' : 'moderada'} para un ${context.dayOfWeek}.

¿Necesitáis información específica sobre alguna mesa o reserva?`;
  }

  // Preguntas sobre personal
  if (input.includes('personal') || input.includes('empleado') || input.includes('staff') || input.includes('trabajador')) {
    return `👥 Personal de ${restaurantName}:

👨‍🍳 EQUIPO EN TURNO:
• ${context.staffOnDuty} personas trabajando actualmente
• Personal distribuido en cocina, sala y atención al cliente

📈 RENDIMIENTO:
• Personal bien distribuido para la ocupación actual
• Equipo experimentado y eficiente

💡 SUGERENCIA: Con ${context.currentOccupancy} mesas ocupadas y ${context.staffOnDuty} personas, la ratio está optimizada.

¿Necesitáis información específica sobre algún miembro del equipo?`;
  }

  // Preguntas sobre ingresos
  if (input.includes('ingreso') || input.includes('dinero') || input.includes('venta') || input.includes('facturación')) {
    return `💰 Estado financiero de ${restaurantName}:

📊 INGRESOS HOY:
• $${context.todayRevenue.toLocaleString()} facturado hasta ahora
• Promedio por mesa: $${Math.round(context.todayRevenue/context.currentOccupancy).toLocaleString()}

📈 ANÁLISIS:
• ${context.todayReservations} reservas programadas
• ${context.currentOccupancy} mesas activas
• Día: ${context.dayOfWeek}

💡 INSIGHT: Los ingresos están ${context.todayRevenue > 10000 ? 'por encima' : 'por debajo'} del promedio esperado para un ${context.dayOfWeek}.

¿Queréis análisis más detallado de algún aspecto financiero?`;
  }

  // Preguntas sobre especialidades del restaurante
  if (input.includes('especialidad') || input.includes('plato') || input.includes('menú') || input.includes('carta')) {
    return `🍴 Especialidades de ${restaurantName}:

👨‍🍳 PLATOS ESTRELLA:
• ${context.specialties.join(' • ')}

🏆 CARACTERÍSTICAS:
• Cocina tradicional con toque moderno
• Ingredientes frescos y de calidad
• Preparación artesanal

💡 RECOMENDACIÓN: Hoy es ${context.dayOfWeek}, perfecto para ${context.specialties[0].toLowerCase()}.

¿Queréis información sobre algún plato específico o ingredientes?`;
  }

  // 🤖 RESPUESTA INTELIGENTE GENERAL - MEJORADA
  return `¡Hola! 👋 Soy vuestro asistente IA integral para ${restaurantName}.

He recibido vuestra pregunta sobre "${userMessage}" y estoy aquí para ayudaros con cualquier tema que necesitéis.

🧠 MIS CAPACIDADES:
• Información sobre ${restaurantName} y gestión de restaurantes
• Recetas y técnicas culinarias de cualquier cocina del mundo
• Consejos de negocio, marketing y gestión empresarial
• Ciencia, tecnología, historia, geografía, cultura
• Salud, nutrición, deportes y bienestar
• Economía, finanzas e inversiones
• Educación, idiomas y desarrollo personal
• Entretenimiento: música, cine, libros, series
• Clima, noticias y actualidad
• Y prácticamente cualquier otro tema

💡 ESTADO ACTUAL DE ${restaurantName.toUpperCase()}:
• ${context.currentOccupancy}/${context.totalTables} mesas ocupadas
• ${context.todayReservations} reservas para hoy
• ${context.staffOnDuty} personas en turno
• Especialidades: ${context.specialties.join(', ')}

¿Podríais ser más específicos sobre qué queréis saber? Por ejemplo:
• Si es una receta: "¿Cómo hacer paella valenciana?"
• Si es sobre el restaurante: "¿Cuántas mesas están libres?"
• Si es información general: "¿Qué es la inteligencia artificial?"

¡Estoy aquí para ayudaros con lo que sea! 😊`;
}
