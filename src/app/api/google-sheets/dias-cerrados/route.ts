import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener días cerrados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    const diasCerrados = await GoogleSheetsService.getDiasCerrados(restaurantId);

    return NextResponse.json({
      success: true,
      diasCerrados,
      restaurantId
    });

  } catch (error) {
    console.error('Error obteniendo días cerrados:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Guardar días cerrados
export async function POST(request: NextRequest) {
  try {
    const { restaurantId, diasCerrados } = await request.json();

    if (!restaurantId || !Array.isArray(diasCerrados)) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId y diasCerrados son requeridos'
      }, { status: 400 });
    }

    const result = await GoogleSheetsService.saveDiasCerrados(restaurantId, diasCerrados);

    if (result.success) {
      return NextResponse.json({
        success: true,
        mensaje: 'Días cerrados guardados exitosamente',
        diasCerrados
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error guardando días cerrados'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error guardando días cerrados:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

