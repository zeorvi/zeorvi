import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST - Simular llamada de Retell para testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, restaurantId } = body;

    // Simular procesamiento de lenguaje natural
    const processedRequest = parseReservationRequest(message);

    if (processedRequest) {
      // Crear reserva automáticamente
      const reservationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...processedRequest,
          restaurantId,
          source: 'retell-simulation'
        })
      });

      const result = await reservationResponse.json();

      return NextResponse.json({
        success: true,
        message: `Llamada procesada: &quot;${message}&quot;`,
        extractedData: processedRequest,
        reservationResult: result,
        agentResponse: generateAgentResponse(processedRequest)
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No se pudo procesar la solicitud de reserva',
      agentResponse: 'Lo siento, no entendí su solicitud. ¿Podría repetir cuántas personas y para qué hora?'
    });

  } catch (error) {
    logger.error('Error simulating Retell call', { error });
    return NextResponse.json({ 
      error: 'Error al simular llamada' 
    }, { status: 500 });
  }
}

// Función para procesar solicitudes de lenguaje natural
function parseReservationRequest(message: string) {
  const lowerMessage = message.toLowerCase();

  // Extraer número de personas
  const peopleMatch = lowerMessage.match(/(\d+)\s*(persona|personas|gente|comensales)/);
  const people = peopleMatch ? parseInt(peopleMatch[1]) : null;

  // Extraer hora
  const timeMatch = lowerMessage.match(/(\d{1,2}):?(\d{0,2})\s*(h|horas?|de la noche|de la tarde)?|a las (\d{1,2})/);
  let time = null;
  if (timeMatch) {
    const hour = timeMatch[1] || timeMatch[4];
    const minute = timeMatch[2] || '00';
    time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }

  // Extraer fecha (hoy, mañana, día específico)
  let date = new Date().toISOString().split('T')[0]; // Default: hoy
  if (lowerMessage.includes('mañana')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
  }

  // Extraer nombre (simplificado)
  const nameMatch = lowerMessage.match(/me llamo ([a-záéíóúñ\s]+)|soy ([a-záéíóúñ\s]+)|mi nombre es ([a-záéíóúñ\s]+)/);
  const clientName = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]).trim() : 'Cliente';

  // Extraer teléfono
  const phoneMatch = lowerMessage.match(/(\+34\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{9})/);
  const phone = phoneMatch ? phoneMatch[0].replace(/\s/g, '') : '+34 600 000 000';

  if (people && time) {
    return {
      clientName,
      phone,
      date,
      time,
      people,
      notes: `Reserva creada via Retell AI - Mensaje original: &quot;${message}&quot;`
    };
  }

  return null;
}

// Generar respuesta del agente
function generateAgentResponse(data: any) {
  return `Perfecto, ${data.clientName}. He creado su reserva para ${data.people} personas el ${data.date} a las ${data.time}. La mesa se ha asignado automáticamente y aparece ahora en nuestra agenda diaria, gestión de reservas y sistema de mesas. ¿Le gustaría que le envíe una confirmación por WhatsApp?`;
}

