import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

function normalizeZona(z?: string) {
  if (!z) return undefined;
  const s = z.trim().toLowerCase();
  if (s.includes('terraza')) return 'Terraza';
  if (s.includes('salón') || s.includes('salon') || s.includes('interior')) return 'Salón Principal';
  if (s.includes('privad')) return 'Comedor Privado';
  return z; // deja tal cual si no matchea
}

function isValidISO(dateStr?: string) {
  if (!dateStr) return false;
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function isValidTime(h?: string) {
  if (!h) return false;
  return /^\d{2}:\d{2}$/.test(h);
}

// POST - Verificar disponibilidad con validación estricta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { restaurantId, fecha, hora, personas, zona } = body || {};

    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'restaurantId es requerido' }, { status: 400 });
    }

    // ❗ corta cualquier token sin resolver tipo "{{tomorrow}}"
    if (!isValidISO(fecha)) {
      return NextResponse.json({ success: false, error: 'fecha debe ser YYYY-MM-DD (no se aceptan tokens como {{tomorrow}})' }, { status: 400 });
    }
    if (!isValidTime(hora)) {
      return NextResponse.json({ success: false, error: 'hora debe ser HH:MM' }, { status: 400 });
    }

    const nPersonas = Number.parseInt(String(personas ?? ''), 10);
    if (!Number.isFinite(nPersonas) || nPersonas <= 0) {
      return NextResponse.json({ success: false, error: 'personas debe ser un número > 0' }, { status: 400 });
    }

    const zonaNorm = normalizeZona(zona || undefined);

    const res = await GoogleSheetsService.verificarDisponibilidad(
      restaurantId,
      fecha,
      hora,
      nPersonas,
      zonaNorm
    );

    return NextResponse.json({ ...res, restaurantId, fecha, hora, personas: nPersonas, zona: zonaNorm });
  } catch (error) {
    console.error('Error verificando disponibilidad (POST):', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET - Verificar disponibilidad de mesas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const hora = searchParams.get('hora');
    const personas = searchParams.get('personas');
    const zona = searchParams.get('zona');
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    if (!fecha || !hora || !personas) {
      return NextResponse.json({
        success: false,
        error: 'fecha, hora y personas son requeridos'
      }, { status: 400 });
    }

    // Validaciones estrictas también para GET
    if (!isValidISO(fecha)) {
      return NextResponse.json({ success: false, error: 'fecha debe ser YYYY-MM-DD (no se aceptan tokens como {{tomorrow}})' }, { status: 400 });
    }
    if (!isValidTime(hora)) {
      return NextResponse.json({ success: false, error: 'hora debe ser HH:MM' }, { status: 400 });
    }

    const nPersonas = Number.parseInt(personas, 10);
    if (!Number.isFinite(nPersonas) || nPersonas <= 0) {
      return NextResponse.json({ success: false, error: 'personas debe ser un número > 0' }, { status: 400 });
    }

    const zonaNorm = normalizeZona(zona || undefined);

    const disponibilidad = await GoogleSheetsService.verificarDisponibilidad(
      restaurantId,
      fecha,
      hora,
      nPersonas,
      zonaNorm
    );

    return NextResponse.json({
      success: true,
      disponible: disponibilidad.disponible,
      mesa: disponibilidad.mesa,
      mensaje: disponibilidad.mensaje,
      alternativas: disponibilidad.alternativas,
      restaurantId,
      fecha,
      hora,
      personas: nPersonas,
      zona: zonaNorm
    });

  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}