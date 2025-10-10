import { NextRequest, NextResponse } from 'next/server';

// GET /api/restaurant/schedule - Obtener horario del restaurante
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID is required' 
      }, { status: 400 });
    }

    console.log('📊 [Restaurant Schedule] Obteniendo horario para:', restaurantId);
    
    // Horario hardcoded para La Gaviota
    const schedule = {
      restaurantId: restaurantId,
      schedules: [
        {
          day: 'monday',
          isOpen: false,
          shifts: []
        },
        {
          day: 'tuesday', 
          isOpen: false,
          shifts: []
        },
        {
          day: 'wednesday',
          isOpen: true,
          shifts: [
            { name: 'Todo el día', start: '00:00', end: '23:59' }
          ]
        },
        {
          day: 'thursday',
          isOpen: true,
          shifts: [
            { name: 'Todo el día', start: '00:00', end: '23:59' }
          ]
        },
        {
          day: 'friday',
          isOpen: true,
          shifts: [
            { name: 'Todo el día', start: '00:00', end: '23:59' }
          ]
        },
        {
          day: 'saturday',
          isOpen: true,
          shifts: [
            { name: 'Todo el día', start: '00:00', end: '23:59' }
          ]
        },
        {
          day: 'sunday',
          isOpen: true,
          shifts: [
            { name: 'Todo el día', start: '00:00', end: '23:59' }
          ]
        }
      ]
    };
    
    console.log(`✅ [Restaurant Schedule] Horario obtenido para ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('❌ [Restaurant Schedule] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener horario del restaurante'
    }, { status: 500 });
  }
}

// POST /api/restaurant/update-schedule - Actualizar horario del restaurante
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, schedules } = body;

    if (!restaurantId || !schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Restaurant ID and schedules array are required' 
      }, { status: 400 });
    }

    await productionDb.updateRestaurantSchedule(restaurantId, schedules);
    
    logger.info(`Updated schedule for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      message: 'Horario actualizado correctamente'
    });

  } catch (error) {
    logger.error('Error updating restaurant schedule', error);
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar horario del restaurante'
    }, { status: 500 });
  }
}
