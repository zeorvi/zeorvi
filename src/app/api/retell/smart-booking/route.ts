import { NextRequest, NextResponse } from 'next/server';
import { verifyRetellWebhook } from '@/lib/webhookValidator';
import { logger } from '@/lib/logger';

// GET - Obtener opciones de reserva inteligente
export async function GET(request: NextRequest) {
  let restaurantId: string | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date');
    const people = searchParams.get('people');
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Mock data de opciones de reserva
    const options = {
      fecha: date || new Date().toISOString().split('T')[0],
      restaurante_id: restaurantId,
      personas_solicitadas: parseInt(people || '2'),
      comida: {
        primer_turno_13: {
          hora: '13:00',
          nombre: 'Primer turno almuerzo',
          horario_completo: '13:00 - 15:00',
          reservas_actuales: 5,
          mesas_disponibles: 3,
          puede_acomodar_grupo: true,
          disponible: true
        },
        segundo_turno_14: {
          hora: '14:00',
          nombre: 'Segundo turno almuerzo',
          horario_completo: '14:00 - 16:00',
          reservas_actuales: 2,
          mesas_disponibles: 8,
          puede_acomodar_grupo: true,
          disponible: true
        }
      },
      cena: {
        primer_turno_20: {
          hora: '20:00',
          nombre: 'Primer turno cena',
          horario_completo: '20:00 - 22:00',
          reservas_actuales: 3,
          mesas_disponibles: 5,
          puede_acomodar_grupo: true,
          disponible: true
        },
        segundo_turno_21: {
          hora: '21:00',
          nombre: 'Segundo turno cena',
          horario_completo: '21:00 - 23:00',
          reservas_actuales: 1,
          mesas_disponibles: 7,
          puede_acomodar_grupo: true,
          disponible: true
        }
      },
      resumen: {
        total_mesas_disponibles: 23,
        mejor_opcion: 'segundo_turno_14',
        recomendacion: 'Recomendamos el segundo turno de almuerzo a las 14:00'
      }
    };

    return NextResponse.json({
      success: true,
      data: options,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error fetching smart booking options', {
      error: (error as Error).message,
      restaurantId: restaurantId || 'unknown',
      action: 'GET_smart_booking'
    });
    return NextResponse.json({
      error: 'Error al obtener opciones de reserva inteligente'
    }, { status: 500 });
  }
}

// POST - Procesar reserva inteligente
export async function POST(request: NextRequest) {
  let body: any = {};
  
  try {
    body = await request.json();

    // Validar webhook de Retell
    const signature = request.headers.get('x-retell-signature') || '';
    const validation = verifyRetellWebhook(signature, JSON.stringify(body));
    if (!validation.valid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const { restaurantId, date, people, preferredTime, clientInfo } = body;

    if (!restaurantId || !date || !people) {
      return NextResponse.json({
        error: 'Restaurant ID, fecha y número de personas son requeridos'
      }, { status: 400 });
    }

    // Simular procesamiento de reserva inteligente
    const bookingResult = {
      reservationId: `RES-${Date.now()}`,
      restaurantId,
      date,
      people: parseInt(people),
      time: preferredTime || '14:00',
      status: 'confirmada',
      clientInfo,
      assignedTable: 'Mesa 5',
      createdAt: new Date().toISOString()
    };

    logger.info('Smart booking processed via Retell', {
      reservationId: bookingResult.reservationId,
      restaurantId,
      people,
      time: bookingResult.time
    });

    return NextResponse.json({
      success: true,
      reservation: bookingResult,
      message: 'Reserva inteligente procesada correctamente'
    });

  } catch (error) {
    logger.error('Error processing smart booking via Retell', {
      error: (error as Error).message,
      restaurantId: body?.restaurantId || 'unknown',
      action: 'POST_smart_booking'
    });
    return NextResponse.json({
      error: 'Error al procesar reserva inteligente'
    }, { status: 500 });
  }
}



