import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// GET - Verificar si el restaurante está abierto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const hora = searchParams.get('hora');
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    if (!fecha || !hora) {
      return NextResponse.json({
        success: false,
        error: 'fecha y hora son requeridos'
      }, { status: 400 });
    }

    const status = await GoogleSheetsService.verificarRestauranteAbierto(
      restaurantId,
      fecha,
      hora
    );

    return NextResponse.json({
      success: true,
      status,
      restaurantId,
      fecha,
      hora
    });

  } catch (error) {
    console.error('Error verificando horarios:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
