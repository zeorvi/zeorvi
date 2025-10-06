import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { productionDb } from '@/lib/database/production';

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

    const schedule = await productionDb.getRestaurantSchedule(restaurantId);
    
    logger.info(`Retrieved schedule for restaurant ${restaurantId}`);

    return NextResponse.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    logger.error('Error getting restaurant schedule', error);
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
