/**
 * API de Mesas - Reemplaza Firebase Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/auth';
import { db } from '@/lib/database';
import { z } from 'zod';

const createTableSchema = z.object({
  number: z.string().min(1, 'Número de mesa requerido'),
  name: z.string().optional(),
  capacity: z.number().min(1, 'Capacidad debe ser al menos 1'),
  location: z.string().optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).default('available'),
  position_x: z.number().default(0),
  position_y: z.number().default(0),
  notes: z.string().optional()
});

const updateTableSchema = z.object({
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).optional(),
  notes: z.string().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional()
});

// GET - Obtener mesas del restaurante
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

    const tables = await db.getTables(resolvedParams.id);

    return NextResponse.json({
      success: true,
      tables
    });

  } catch (error) {
    console.error('Error obteniendo mesas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// POST - Crear nueva mesa
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

    // Verificar permisos
    if (user.restaurantId !== resolvedParams.id || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTableSchema.parse(body);

    // Verificar que el número de mesa no esté en uso
    const existingTables = await db.getTables(resolvedParams.id);
    const tableExists = existingTables.some(table => table.number === validatedData.number);
    
    if (tableExists) {
      return NextResponse.json({
        error: 'El número de mesa ya está en uso'
      }, { status: 400 });
    }

    const table = await db.createTable(resolvedParams.id, validatedData);

    return NextResponse.json({
      success: true,
      table,
      message: 'Mesa creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando mesa:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Error creando mesa'
    }, { status: 500 });
  }
}

// PUT - Actualizar estado de mesa
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
    const { tableId, ...updateData } = body;
    
    if (!tableId) {
      return NextResponse.json({ error: 'ID de mesa requerido' }, { status: 400 });
    }

    const validatedData = updateTableSchema.parse(updateData);

    // Actualizar mesa
    if (validatedData.status) {
      await db.updateTableStatus(resolvedParams.id, tableId, validatedData.status);
    }

    // Si hay otros campos para actualizar
    if (Object.keys(validatedData).length > 0) {
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

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = NOW()`);
        updateValues.push(tableId);
        
        await db.pg.query(`
          UPDATE ${schemaName}.tables 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `, updateValues);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mesa actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando mesa:', error);
    return NextResponse.json({
      error: 'Error actualizando mesa'
    }, { status: 500 });
  }
}

