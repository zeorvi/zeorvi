/**
 * API de Reservas - Reemplaza Firebase Firestore
 * Sistema completo de gestión de reservas
 */

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';
import { db } from '@/lib/database';
import { z } from 'zod';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createReservationSchema = z.object({
  table_id: z.number().optional(),
  client_name: z.string().min(2, 'Nombre del cliente requerido'),
  client_phone: z.string().optional(),
  client_email: z.string().email().optional(),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  reservation_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:MM)'),
  duration_minutes: z.number().min(30).max(480).default(120),
  party_size: z.number().min(1).max(20),
  notes: z.string().optional(),
  special_requests: z.string().optional(),
  source: z.enum(['manual', 'retell', 'online', 'phone']).default('manual'),
  source_data: z.record(z.any()).default({})
});

const updateReservationSchema = z.object({
  status: z.enum(['confirmed', 'pending', 'cancelled', 'no_show', 'completed']).optional(),
  table_id: z.number().optional(),
  notes: z.string().optional(),
  special_requests: z.string().optional()
});

// GET - Obtener reservas del restaurante
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Verificar acceso al restaurante
    if (user.restaurantId !== resolvedParams.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const filters: any = {};
    if (date) filters.date = date;
    if (status) filters.status = status;
    if (limit) filters.limit = limit;

    const reservations = await db.getReservations(resolvedParams.id, filters);

    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    });

  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear nueva reserva
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Verificar acceso
    if (user.restaurantId !== resolvedParams.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createReservationSchema.parse(body);

    // Verificar disponibilidad de mesa si se especifica
    if (validatedData.table_id) {
      const tables = await db.getTables(resolvedParams.id);
      const table = tables.find(t => t.id === validatedData.table_id);
      
      if (!table) {
        return NextResponse.json({
          error: 'Mesa no encontrada'
        }, { status: 400 });
      }

      if (table.status === 'maintenance') {
        return NextResponse.json({
          error: 'Mesa en mantenimiento'
        }, { status: 400 });
      }

      // Verificar conflictos de horario
      const existingReservations = await db.getReservations(resolvedParams.id, {
        date: validatedData.reservation_date
      });

      const conflictingReservation = existingReservations.find(res => 
        res.table_id === validatedData.table_id &&
        res.status === 'confirmed' &&
        // Lógica de verificación de horarios
        res.reservation_time === validatedData.reservation_time
      );

      if (conflictingReservation) {
        return NextResponse.json({
          error: 'La mesa ya está reservada en ese horario'
        }, { status: 400 });
      }
    }

    // Crear o actualizar cliente
    let clientId: number | undefined;
    if (validatedData.client_phone || validatedData.client_email) {
      const client = await db.createOrUpdateClient(resolvedParams.id, {
        name: validatedData.client_name,
        phone: validatedData.client_phone,
        email: validatedData.client_email,
        notes: '',
        preferences: [],
        total_visits: 0,
        total_spent: 0
      });
      clientId = client.id;
    }

    // Crear reserva
    const reservation = await db.createReservation(resolvedParams.id, {
      ...validatedData,
      client_id: clientId,
      status: 'confirmed',
      reservation_date: new Date(validatedData.reservation_date)
    });

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reserva creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando reserva:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error creando reserva'
    }, { status: 500 });
  }
}

// PUT - Actualizar reserva
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Verificar acceso
    if (user.restaurantId !== resolvedParams.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { reservationId, ...updateData } = body;
    
    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 });
    }

    const validatedData = updateReservationSchema.parse(updateData);

    // Actualizar reserva
    const schemaName = `restaurant_${resolvedParams.id.replace(/-/g, '_')}`;
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(reservationId);

    const result = await db.pg.query(`
      UPDATE ${schemaName}.reservations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const updatedReservation = result.rows[0];

    // Si se cambió el estado a cancelada, liberar mesa
    if (validatedData.status === 'cancelled' && updatedReservation.table_id) {
      await db.updateTableStatus(resolvedParams.id, updatedReservation.table_id, 'available');
    }

    // Si se asignó mesa, reservarla
    if (validatedData.table_id && validatedData.status !== 'cancelled') {
      await db.updateTableStatus(resolvedParams.id, validatedData.table_id, 'reserved');
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      message: 'Reserva actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando reserva:', error);
    return NextResponse.json({
      error: 'Error actualizando reserva'
    }, { status: 500 });
  }
}

// DELETE - Cancelar reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authService.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Verificar permisos
    if (user.restaurantId !== resolvedParams.id || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json({ error: 'ID de reserva requerido' }, { status: 400 });
    }

    const schemaName = `restaurant_${resolvedParams.id.replace(/-/g, '_')}`;

    // Obtener reserva antes de cancelar
    const result = await db.pg.query(`
      SELECT * FROM ${schemaName}.reservations WHERE id = $1
    `, [reservationId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    const reservation = result.rows[0];

    // Marcar como cancelada
    await db.pg.query(`
      UPDATE ${schemaName}.reservations 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
    `, [reservationId]);

    // Liberar mesa si estaba asignada
    if (reservation.table_id) {
      await db.updateTableStatus(resolvedParams.id, reservation.table_id, 'available');
    }

    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando reserva:', error);
    return NextResponse.json({
      error: 'Error cancelando reserva'
    }, { status: 500 });
  }
}

