import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

// Configurar Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY!,
}).base(process.env.AIRTABLE_BASE_ID!);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const date = searchParams.get('date');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId es requerido' },
        { status: 400 }
      );
    }

    // Construir filtro para Airtable
    let filter = `{Restaurante} = "${restaurantId}"`;
    if (date) {
      filter += ` AND {Fecha} = "${date}"`;
    }

    const records = await base('Reservas')
      .select({
        filterByFormula: filter,
        sort: [{ field: 'Fecha', direction: 'asc' }],
      })
      .all();

    const reservations = records.map(record => ({
      id: record.id,
      fecha: record.get('Fecha'),
      hora: record.get('Hora'),
      personas: record.get('Personas'),
      cliente: record.get('Cliente'),
      telefono: record.get('Telefono'),
      mesa: record.get('Mesa'),
      estado: record.get('Estado'),
      notas: record.get('Notas'),
    }));

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fecha,
      hora,
      personas,
      cliente,
      telefono,
      mesa,
      estado = 'Pendiente',
      notas,
      restauranteId,
    } = body;

    // Validar campos requeridos
    if (!fecha || !hora || !personas || !cliente || !telefono || !restauranteId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const record = await base('Reservas').create({
      Fecha: fecha,
      Hora: hora,
      Personas: personas,
      Cliente: cliente,
      Telefono: telefono,
      Mesa: mesa,
      Estado: estado,
      Notas: notas,
      Restaurante: restauranteId,
    });

    return NextResponse.json({
      id: record.id,
      message: 'Reserva creada exitosamente',
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

