import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { twilioWebhookSchema, validateData } from '@/lib/validations';
import { errorHandler, NotFoundError } from '@/lib/errorHandler';
import { logger, logAPI } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimiter';
import { webhookValidators } from '@/lib/webhookValidator';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Webhook de Twilio con rate limiting y validación
export const POST = errorHandler(
  async (request: NextRequest) => {
    const startTime = Date.now();
    
    // Aplicar rate limiting específico para webhooks
    await rateLimiters.webhook.middleware()(request);
    
    // Obtener datos del formulario
    const formData = await request.formData();
    const webhookData = {
      From: formData.get('From') ?? '',
      To: formData.get('To') ?? '',
      Body: formData.get('Body') ?? '',
      MessageType: formData.get('MessageType') ?? 'text'
    };

    // Validar firma de Twilio
    const twilioSignature = request.headers.get('x-twilio-signature');
    if (twilioSignature) {
      const params: { [key: string]: string } = {};
      
      for (const [key, value] of formData.entries()) {
        params[key] = value.toString();
      }
      
      const validationResult = webhookValidators.twilio.validate(
        twilioSignature,
        request.url,
        params
      );
      
      if (!validationResult.valid) {
        throw new Error(validationResult.error || 'Invalid Twilio signature');
      }
    }

    // Validar datos del webhook
    const validatedData = validateData(twilioWebhookSchema, webhookData);
    const { From: from, To: to, Body: bodyText, MessageType: messageType } = validatedData;

    logger.info('Twilio webhook received', { 
      from, 
      to, 
      messageLength: bodyText?.length || 0, 
      messageType 
    });

    // Determinar el restaurante basado en el número de Twilio
    const restaurantId = await getRestaurantByTwilioNumber(to);
    
    if (!restaurantId) {
      throw new NotFoundError(`Restaurante no encontrado para el número: ${to}`);
    }

    // Procesar el mensaje con Retell AI
    const response = await processWithRetellAI({
      message: bodyText,
      from,
      to,
      restaurantId,
      messageType: messageType ?? 'text', // Valor por defecto si es undefined
    });

    // Si Retell AI creó una reserva, responder con confirmación
    if (response.reservationCreated && response.reservationDetails) {
      const { personas, fecha, hora, id } = response.reservationDetails;
      const confirmationMessage = `¡Perfecto! Tu reserva para ${personas} personas el ${fecha} a las ${hora} ha sido confirmada. Te esperamos en ${response.restaurantName}.`;
      
      try {
        // Enviar respuesta por WhatsApp/SMS
        await client.messages.create({
          body: confirmationMessage,
          from: to,
          to: from,
        });

        logger.info('Confirmation message sent', { 
          from: to, 
          to: from, 
          reservationId: id 
        });
      } catch (twilioError) {
        logger.error('Error sending Twilio message', { 
          error: twilioError, 
          from: to, 
          to: from 
        });
        // No lanzar error, la reserva ya fue creada
      }
    }

    // Log de la API
    const duration = Date.now() - startTime;
    logAPI('POST', '/api/twilio/webhook', undefined, 200, duration);

    return NextResponse.json({ 
      success: true, 
      processed: true,
      reservationCreated: response.reservationCreated || false
    });
  }
);

async function getRestaurantByTwilioNumber(twilioNumber: string): Promise<string | null> {
  try {
    // Aquí implementarías la lógica para buscar el restaurante
    // basado en el número de Twilio en Airtable o Firebase
    
    // Simulación - en producción conectarías con tu base de datos
    const restaurantMappings: { [key: string]: string } = {
      '+1234567890': 'rest_elbuensabor',
      '+0987654321': 'rest_demo'
    };
    
    return restaurantMappings[twilioNumber] || 'rest_elbuensabor'; // fallback para demo
  } catch (error) {
    logger.error('Error getting restaurant by Twilio number', { error, twilioNumber });
    return null;
  }
}

async function processWithRetellAI(data: {
  message: string;
  from: string;
  to: string;
  restaurantId: string;
  messageType: string;
}) {
  try {
    // Aquí implementarías la integración real con Retell AI
    // Por ahora simulamos una respuesta
    
    logger.info('Processing message with Retell AI', {
      restaurantId: data.restaurantId,
      messageLength: data.message.length,
      from: data.from
    });
    
    // Simulación de procesamiento IA
    const isReservationRequest = data.message.toLowerCase().includes('reserva') || 
                                data.message.toLowerCase().includes('mesa') ||
                                data.message.toLowerCase().includes('cita');
    
    if (isReservationRequest) {
      // Simular creación de reserva
      const reservationId = `res_${Date.now()}`;
      
      return {
        reservationCreated: true,
        reservationDetails: {
          id: reservationId,
          fecha: new Date().toISOString().split('T')[0],
          hora: '19:00',
          personas: 2,
        },
        restaurantName: 'El Buen Sabor'
      };
    }
    
    return {
      reservationCreated: false,
      response: 'Mensaje procesado correctamente'
    };
    
  } catch (error) {
    logger.error('Error processing with Retell AI', { error, data });
    throw error;
  }
}

