import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// GET - Verificar disponibilidad
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const hora = searchParams.get('hora');
    const personas = searchParams.get('personas');

    if (!fecha || !hora || !personas) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros: fecha, hora, personas'
      }, { status: 400 });
    }

    const disponible = await GoogleSheetsService.verificarDisponibilidad(
      fecha, 
      hora, 
      parseInt(personas)
    );

    // Obtener reservas existentes en esa fecha/hora
    const reservasExistentes = await GoogleSheetsService.getReservasPorFecha(fecha);
    const reservasEnEsaHora = reservasExistentes.filter(r => r.hora === hora);

    return NextResponse.json({
      success: true,
      disponible,
      fecha,
      hora,
      personas: parseInt(personas),
      reservasExistentes: reservasEnEsaHora.length,
      detalles: {
        totalPersonasReservadas: reservasEnEsaHora.reduce((sum, r) => sum + r.personas, 0),
        capacidadMaxima: 50, // Puedes ajustar esto
        personasDisponibles: disponible ? 50 - reservasEnEsaHora.reduce((sum, r) => sum + r.personas, 0) : 0
      }
    });

  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
