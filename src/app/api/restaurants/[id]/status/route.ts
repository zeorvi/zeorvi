/**
 * API para actualizar el estado de un restaurante
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { logger } from '@/lib/logger';
import authService from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await authService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Solo los administradores pueden actualizar restaurantes
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para actualizar restaurantes' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const restaurantId = resolvedParams.id;
    const body = await request.json();
    const { status } = body;

    // Validar estado
    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido. Debe ser "active" o "inactive"' },
        { status: 400 }
      );
    }

    // Actualizar estado del restaurante
    const client = await db.pg.connect();
    try {
      const result = await client.query(`
        UPDATE restaurants 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, restaurantId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Restaurante no encontrado' },
          { status: 404 }
        );
      }

      logger.info('Restaurant status updated', { 
        restaurantId, 
        newStatus: status,
        userId: user.id 
      });

      return NextResponse.json({
        success: true,
        message: `Restaurante ${status === 'active' ? 'activado' : 'desactivado'} correctamente`
      });

    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Restaurant status update API error', { error, restaurantId: (await params).id });                                                                                        
    return NextResponse.json(                                                         
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

