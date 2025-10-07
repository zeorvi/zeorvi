import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService, Reserva } from '@/lib/googleSheetsService';

// GET - Obtener reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');
    const restaurantId = searchParams.get('restaurantId');
    const all = searchParams.get('all');

    if (!restaurantId && all !== 'true') {
      return NextResponse.json({
        success: false,
        error: 'Se requiere restaurantId o all=true'
      }, { status: 400 });
    }

    let reservas: Reserva[] = [];
    
    if (restaurantId) {
      // Obtener reservas de un restaurante específico
      reservas = await GoogleSheetsService.getReservas(restaurantId);
      
      if (fecha) {
        reservas = reservas.filter(r => r.Fecha === fecha);
      }
    } else if (all === 'true') {
      // Obtener todas las reservas de todos los restaurantes
      reservas = await GoogleSheetsService.getAllReservas();
    }

    if (estado && reservas) {
      reservas = reservas.filter((r) => r.Estado === estado);
    }

    return NextResponse.json({
      success: true,
      reservas,
      total: reservas.length,
      fecha: fecha || 'todas',
      estado: estado || 'todos',
      restaurantId: restaurantId || 'all'
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
    const { restaurantId, ...reservaData } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    const result = await GoogleSheetsService.crearReserva({
      Fecha: reservaData.fecha,
      Hora: reservaData.hora,
      Turno: reservaData.turno || 'Cena',
      Cliente: reservaData.cliente,
      Telefono: reservaData.telefono,
      Personas: reservaData.personas,
      Zona: reservaData.zona || '',
      Mesa: reservaData.mesa,
      Estado: reservaData.estado || 'confirmada',
      Notas: reservaData.notas || ''
    }, restaurantId);

    if (result) {
      return NextResponse.json({
        success: true,
        mensaje: 'Reserva creada exitosamente'
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

// PUT - Actualizar reserva
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, ID, ...nuevosDatos } = body;

    if (!restaurantId || !ID) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId e ID son requeridos'
      }, { status: 400 });
    }

    // Buscar la reserva por ID y actualizar
    const reservas = await GoogleSheetsService.getReservas(restaurantId);
    const reserva = reservas.find(r => r.ID === ID);
    
    if (!reserva) {
      return NextResponse.json({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 });
    }

    const result = await GoogleSheetsService.actualizarEstadoReserva(
      reserva.Cliente,
      reserva.Telefono,
      nuevosDatos.estado || reserva.Estado,
      restaurantId
    );

    if (result) {
      return NextResponse.json({
        success: true,
        mensaje: 'Reserva actualizada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error actualizando la reserva'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error actualizando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE - Cancelar reserva
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const ID = searchParams.get('ID');

    if (!restaurantId || !ID) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId e ID son requeridos'
      }, { status: 400 });
    }

    // Buscar la reserva por ID y cancelarla
    const reservas = await GoogleSheetsService.getReservas(restaurantId);
    const reserva = reservas.find(r => r.ID === ID);
    
    if (!reserva) {
      return NextResponse.json({
        success: false,
        error: 'Reserva no encontrada'
      }, { status: 404 });
    }

    const result = await GoogleSheetsService.actualizarEstadoReserva(
      reserva.Cliente,
      reserva.Telefono,
      'cancelada',
      restaurantId
    );

    if (result) {
      return NextResponse.json({
        success: true,
        mensaje: 'Reserva cancelada exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Error cancelando la reserva'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error cancelando reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
