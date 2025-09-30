import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// GET - Obtener reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');
    const restaurantId = searchParams.get('restaurantId');
    const restaurantName = searchParams.get('restaurantName');
    const all = searchParams.get('all');

    let reservas;
    
    if (restaurantId && restaurantName) {
      // Obtener reservas de un restaurante específico
      if (fecha) {
        reservas = await GoogleSheetsService.getReservasPorFecha(fecha, restaurantId, restaurantName);
      } else {
        reservas = await GoogleSheetsService.getReservas(restaurantId, restaurantName);
      }
    } else if (all === 'true') {
      // Obtener todas las reservas de todos los restaurantes
      reservas = await GoogleSheetsService.getAllReservas();
    } else {
      return NextResponse.json({
        success: false,
        error: 'Se requiere restaurantId y restaurantName, o all=true'
      }, { status: 400 });
    }

    if (estado) {
      reservas = reservas.filter(r => r.estado === estado);
    }

    return NextResponse.json({
      success: true,
      reservas,
      total: reservas.length,
      fecha: fecha || 'todas',
      estado: estado || 'todos',
      restaurantId: restaurantId || 'all',
      restaurantName: restaurantName || 'all'
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
    const { fecha, hora, horario, cliente, telefono, personas, notas, restaurante, restauranteId } = body;

    if (!fecha || !hora || !cliente || !telefono || !personas || !restaurante || !restauranteId) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: fecha, hora, cliente, telefono, personas, restaurante, restauranteId'
      }, { status: 400 });
    }

    // Verificar disponibilidad
    const disponible = await GoogleSheetsService.verificarDisponibilidad(fecha, hora, personas, restauranteId, restaurante);
    
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
      horario: horario || hora, // Usar horario si está disponible, sino usar hora
      cliente,
      telefono,
      personas: parseInt(personas),
      estado: 'confirmada' as const,
      notas: notas || '',
      restaurante,
      restauranteId
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
    const { cliente, telefono, nuevoEstado, restaurante, restauranteId } = body;

    if (!cliente || !telefono || !nuevoEstado || !restaurante || !restauranteId) {
      return NextResponse.json({
        success: false,
        error: 'Faltan campos requeridos: cliente, telefono, nuevoEstado, restaurante, restauranteId'
      }, { status: 400 });
    }

    const actualizada = await GoogleSheetsService.actualizarEstadoReserva(cliente, telefono, nuevoEstado, restauranteId, restaurante);

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