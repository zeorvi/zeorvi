import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// GET - Obtener todas las reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');

    let reservas;
    
    if (fecha) {
      reservas = await GoogleSheetsService.getReservasPorFecha(fecha);
    } else {
      reservas = await GoogleSheetsService.getReservas();
    }

    if (estado) {
      reservas = reservas.filter(r => r.estado === estado);
    }

    return NextResponse.json({
      success: true,
      reservas,
      total: reservas.length,
      fecha: fecha || 'todas',
      estado: estado || 'todos'
    });

  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, hora, cliente, telefono, personas, notas } = body;

    if (!fecha || !hora || !cliente || !telefono || !personas) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: fecha, hora, cliente, telefono, personas'
      }, { status: 400 });
    }

    // Verificar disponibilidad
    const disponible = await GoogleSheetsService.verificarDisponibilidad(fecha, hora, personas);
    
    if (!disponible) {
      return NextResponse.json({
        success: false,
        error: 'No hay disponibilidad para esa fecha y hora'
      }, { status: 409 });
    }

    // Crear reserva
    const reserva = {
      fecha,
      hora,
      cliente,
      telefono,
      personas: parseInt(personas),
      estado: 'confirmada' as const,
      notas: notas || ''
    };

    const creada = await GoogleSheetsService.crearReserva(reserva);

    if (creada) {
      return NextResponse.json({
        success: true,
        reserva,
        message: 'Reserva creada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error creando la reserva'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// PUT - Actualizar estado de reserva
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente, telefono, nuevoEstado } = body;

    if (!cliente || !telefono || !nuevoEstado) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: cliente, telefono, nuevoEstado'
      }, { status: 400 });
    }

    const actualizada = await GoogleSheetsService.actualizarEstadoReserva(cliente, telefono, nuevoEstado);

    if (actualizada) {
      return NextResponse.json({
        success: true,
        message: 'Estado de reserva actualizado'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error actualizando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
