import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener información completa del dashboard para Retell
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Información completa del dashboard
    const dashboardData = {
      restaurante: {
        id: restaurantId,
        nombre: 'Restaurante El Buen Sabor',
        tipo: 'Familiar',
        telefono: '+34 912 345 678',
        email: 'admin@elbuensabor.com',
        estado: 'activo'
      },

      // AGENDA DIARIA
      agendaDiaria: {
        fecha: today,
        reservasHoy: [
          {
            id: 'res_001',
            hora: '20:00',
            cliente: 'Juan Pérez',
            telefono: '+34 600 123 456',
            personas: 4,
            mesa: 'M5',
            estado: 'confirmada',
            notas: 'Cumpleaños'
          },
          {
            id: 'res_002',
            hora: '19:30',
            cliente: 'María García',
            telefono: '+34 601 234 567',
            personas: 2,
            mesa: 'M3',
            estado: 'pendiente'
          },
          {
            id: 'res_003',
            hora: '21:00',
            cliente: 'Carlos López',
            telefono: '+34 602 345 678',
            personas: 6,
            mesa: 'M8',
            estado: 'confirmada'
          }
        ]
      },

      // GESTIÓN DE MESAS
      mesas: {
        libres: [
          { id: 'M1', nombre: 'Mesa 1', capacidad: 2, ubicacion: 'Terraza' },
          { id: 'M2', nombre: 'Mesa 2', capacidad: 4, ubicacion: 'Salón Principal' },
          { id: 'M4', nombre: 'Mesa 4', capacidad: 2, ubicacion: 'Terraza' },
          { id: 'M6', nombre: 'Mesa 6', capacidad: 6, ubicacion: 'Terraza' }
        ],
        ocupadas: [
          { 
            id: 'M5', 
            nombre: 'Mesa 5', 
            capacidad: 8, 
            ubicacion: 'Salón Privado',
            cliente: 'Juan Pérez',
            telefono: '+34 600 123 456',
            horaInicio: '20:00'
          }
        ],
        reservadas: [
          { 
            id: 'M3', 
            nombre: 'Mesa 3', 
            capacidad: 6, 
            ubicacion: 'Salón Principal',
            cliente: 'María García',
            telefono: '+34 601 234 567',
            horaReserva: '19:30'
          }
        ]
      },

      // ESTADÍSTICAS EN TIEMPO REAL
      estadisticas: {
        reservasHoy: 12,
        mesasLibres: 8,
        mesasOcupadas: 5,
        mesasReservadas: 2,
        ocupacionPorcentaje: 60,
        capacidadTotal: 20,
        clientesAtendidos: 45,
        ingresosDia: 1250
      },

      // CLIENTES REGISTRADOS
      clientes: [
        {
          id: 'cli_001',
          nombre: 'Juan Pérez',
          telefono: '+34 600 123 456',
          email: 'juan@email.com',
          ultimaVisita: '2024-01-15',
          totalReservas: 8,
          mesaPreferida: 'Terraza'
        },
        {
          id: 'cli_002',
          nombre: 'María García',
          telefono: '+34 601 234 567',
          email: 'maria@email.com',
          ultimaVisita: '2024-01-10',
          totalReservas: 3,
          mesaPreferida: 'Salón Principal'
        }
      ],

      // REPORTES
      reportes: {
        reservasTotales: 156,
        ocupacionPromedio: 89,
        mesasMasPopulares: ['Terraza', 'Salón Principal'],
        horariosPopulares: ['20:00', '19:30', '21:00'],
        clientesFrecuentes: ['Juan Pérez', 'María García', 'Carlos López']
      }
    };

    logger.info('Dashboard data provided to Retell', { restaurantId });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      message: 'Información completa del dashboard disponible para el agente'
    });

  } catch (error) {
    logger.error('Error providing dashboard data to Retell', { error });
    return NextResponse.json({ 
      error: 'Error al obtener información del dashboard' 
    }, { status: 500 });
  }
}

