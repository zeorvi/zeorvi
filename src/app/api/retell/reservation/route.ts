import { NextRequest, NextResponse } from 'next/server';
import { RetellReservationFlow } from '@/lib/retellReservationFlow';

// POST - Procesar solicitud de reserva desde Retell AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🤖 Solicitud de reserva desde Retell AI:', JSON.stringify(body, null, 2));

    const {
      customerName,
      phone,
      people,
      date,
      time,
      specialRequests,
      restaurantId,
      restaurantName,
      spreadsheetId,
      action = 'create' // 'create', 'modify', 'check'
    } = body;

    // Validar campos requeridos
    if (!customerName || !phone || !people || !date || !time || !restaurantId || !restaurantName || !spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: customerName, phone, people, date, time, restaurantId, restaurantName, spreadsheetId',
        response: 'Lo siento, necesito más información para procesar su reserva. Por favor, proporcione su nombre, teléfono, número de personas, fecha y hora deseada.'
      }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'create':
        result = await RetellReservationFlow.processReservationRequest({
          customerName,
          phone,
          people: parseInt(people),
          date,
          time,
          specialRequests,
          restaurantId,
          restaurantName,
          spreadsheetId
        });
        break;

      case 'check':
        const availability = await RetellReservationFlow.checkAvailability(
          date,
          time,
          parseInt(people),
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        
        if (availability.available) {
          result = {
            success: true,
            message: `¡Perfecto! Tenemos disponibilidad para ${people} persona${people > 1 ? 's' : ''} el ${date} a las ${time}. ¿Le gustaría confirmar la reserva?`
          };
        } else {
          let message = `Lo siento, no tenemos disponibilidad para ${people} persona${people > 1 ? 's' : ''} el ${date} a las ${time}.`;
          if (availability.suggestedTimes && availability.suggestedTimes.length > 0) {
            message += ` ¿Le gustaría probar con estos horarios alternativos: ${availability.suggestedTimes.join(', ')}?`;
          }
          result = {
            success: false,
            message
          };
        }
        break;

      case 'modify':
        result = await RetellReservationFlow.modifyExistingReservation(
          customerName,
          phone,
          date,
          time,
          parseInt(people),
          restaurantId,
          restaurantName,
          spreadsheetId
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida. Use: create, modify, o check',
          response: 'Lo siento, no entendí su solicitud. Por favor, intente nuevamente.'
        }, { status: 400 });
    }

    // Preparar respuesta para Retell AI
    const response = {
      success: result.success,
      message: result.message,
      reservationId: result.reservationId,
      data: {
        restaurant: restaurantName,
        customer: customerName,
        phone,
        people: parseInt(people),
        date,
        time,
        status: result.success ? 'confirmed' : 'unavailable'
      }
    };

    console.log('✅ Respuesta para Retell AI:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error procesando solicitud de reserva:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      response: 'Lo siento, hubo un error técnico. Por favor, contacte directamente al restaurante para hacer su reserva.',
      data: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// GET - Verificar disponibilidad
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');
    const people = searchParams.get('people');
    const restaurantId = searchParams.get('restaurantId');
    const restaurantName = searchParams.get('restaurantName');
    const spreadsheetId = searchParams.get('spreadsheetId');

    if (!date || !time || !people || !restaurantId || !restaurantName || !spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros: date, time, people, restaurantId, restaurantName, spreadsheetId',
        available: false,
        message: 'Parámetros incompletos para verificar disponibilidad'
      }, { status: 400 });
    }

    const availability = await RetellReservationFlow.checkAvailability(
      date,
      time,
      parseInt(people),
      restaurantId,
      restaurantName,
      spreadsheetId
    );

    return NextResponse.json({
      success: true,
      available: availability.available,
      message: availability.available 
        ? `Disponible para ${people} personas el ${date} a las ${time}`
        : `No disponible. ${availability.reason || 'Sin disponibilidad'}`,
      suggestedTimes: availability.suggestedTimes,
      maxCapacity: availability.maxCapacity,
      data: {
        date,
        time,
        people: parseInt(people),
        restaurantId,
        restaurantName
      }
    });

  } catch (error) {
    console.error('❌ Error verificando disponibilidad:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      available: false,
      message: 'Error verificando disponibilidad'
    }, { status: 500 });
  }
}
