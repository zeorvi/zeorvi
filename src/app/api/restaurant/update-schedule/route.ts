import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { productionDb } from '@/lib/database/production';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
