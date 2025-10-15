import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Obtener estado completo del restaurante para el agente de IA (versión de prueba)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Datos mock para La Gaviota (rest_003)
    const mockRestaurantData = {
      id: 'rest_003',
      name: 'Restaurante La Gaviota',
      type: 'Marisquería',
      phone: '+34 912 345 678',
      email: 'info@lagaviota.com',
      address: 'Paseo Marítimo, 123, Valencia'
    };

    // Mesas mock para La Gaviota
    const mockTables = [
      { id: 'M1', name: 'Mesa 1', capacity: 4, location: 'Terraza', status: 'libre', lastUpdated: new Date() },
      { id: 'M2', name: 'Mesa 2', capacity: 2, location: 'Terraza', status: 'ocupada', clientName: 'María García', partySize: 2, lastUpdated: new Date() },
      { id: 'M3', name: 'Mesa 3', capacity: 6, location: 'Salón Principal', status: 'libre', lastUpdated: new Date() },
      { id: 'M4', name: 'Mesa 4', capacity: 4, location: 'Salón Principal', status: 'reservada', clientName: 'Juan Pérez', partySize: 4, lastUpdated: new Date() },
      { id: 'M5', name: 'Mesa 5', capacity: 2, location: 'Comedor Privado', status: 'libre', lastUpdated: new Date() },
      { id: 'M6', name: 'Mesa 6', capacity: 8, location: 'Terraza', status: 'libre', lastUpdated: new Date() },
      { id: 'M7', name: 'Mesa 7', capacity: 4, location: 'Salón Principal', status: 'ocupada', clientName: 'Ana López', partySize: 3, lastUpdated: new Date() },
      { id: 'M8', name: 'Mesa 8', capacity: 2, location: 'Comedor Privado', status: 'libre', lastUpdated: new Date() },
    ];

    // Horario mock
    const mockSchedule = [
      { dayOfWeek: 'monday', isOpen: true, openingTime: '12:00', closingTime: '23:00' },
      { dayOfWeek: 'tuesday', isOpen: true, openingTime: '12:00', closingTime: '23:00' },
      { dayOfWeek: 'wednesday', isOpen: true, openingTime: '12:00', closingTime: '23:00' },
      { dayOfWeek: 'thursday', isOpen: true, openingTime: '12:00', closingTime: '23:00' },
      { dayOfWeek: 'friday', isOpen: true, openingTime: '12:00', closingTime: '00:00' },
      { dayOfWeek: 'saturday', isOpen: true, openingTime: '12:00', closingTime: '00:00' },
      { dayOfWeek: 'sunday', isOpen: true, openingTime: '12:00', closingTime: '22:00' },
    ];

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentHour = now.getHours();

    // Verificar si el restaurante está abierto
    const todaySchedule = mockSchedule.find(s => s.dayOfWeek === currentDay);
    const isCurrentlyOpen = todaySchedule?.isOpen && 
      currentHour >= parseInt(todaySchedule.openingTime.split(':')[0]) &&
      currentHour < parseInt(todaySchedule.closingTime.split(':')[0]);

    // Calcular métricas
    const totalTables = mockTables.length;
    const libres = mockTables.filter(t => t.status === 'libre').length;
    const ocupadas = mockTables.filter(t => t.status === 'ocupada').length;
    const reservadas = mockTables.filter(t => t.status === 'reservada').length;
    const porcentajeOcupacion = Math.round(((ocupadas + reservadas) / totalTables) * 100);

    // Disponibilidad por capacidad
    const availabilityByCapacity = {
      para2Personas: mockTables.filter(t => t.status === 'libre' && t.capacity >= 2).length,
      para4Personas: mockTables.filter(t => t.status === 'libre' && t.capacity >= 4).length,
      para6Personas: mockTables.filter(t => t.status === 'libre' && t.capacity >= 6).length,
      para8Personas: mockTables.filter(t => t.status === 'libre' && t.capacity >= 8).length,
    };

    // Ubicaciones
    const ubicaciones = Array.from(new Set(mockTables.map(t => t.location)));
    const mesasPorUbicacion = ubicaciones.reduce((acc: any, loc) => {
      const tablesInLoc = mockTables.filter(t => t.location === loc);
      acc[loc] = {
        total: tablesInLoc.length,
        libres: tablesInLoc.filter(t => t.status === 'libre').length,
        ocupadas: tablesInLoc.filter(t => t.status === 'ocupada').length,
        reservadas: tablesInLoc.filter(t => t.status === 'reservada').length,
      };
      return acc;
    }, {});

    const dashboardInfo = {
      restaurante: mockRestaurantData,
      estadoActual: {
        estaAbierto: isCurrentlyOpen,
        diaActual: currentDay,
        horaActual: `${currentHour}:00`,
        fechaActual: now.toLocaleDateString('es-ES'),
      },
      horario: {
        diasAbierto: mockSchedule.filter(s => s.isOpen).map(s => s.dayOfWeek),
        horarios: mockSchedule.reduce((acc: any, s) => {
          acc[s.dayOfWeek] = s.isOpen ? `${s.openingTime} - ${s.closingTime}` : 'Cerrado';
          return acc;
        }, {}),
        proximoCierre: todaySchedule?.closingTime || 'No disponible',
      },
      mesas: {
        total: totalTables,
        porEstado: {
          libres,
          ocupadas,
          reservadas,
          ocupadoTodoDia: 0,
        },
        porcentajeOcupacion,
        detalleMesas: mockTables.map(t => ({
          nombre: t.name,
          capacidad: t.capacity,
          ubicacion: t.location,
          estado: t.status,
          cliente: t.clientName || null,
          telefono: null,
          personas: t.partySize || null,
          ultimaActualizacion: t.lastUpdated.toISOString(),
        })),
      },
      disponibilidad: availabilityByCapacity,
      ubicaciones: {
        total: ubicaciones.length,
        lista: ubicaciones,
        mesasPorUbicacion,
      },
      reservas: {
        totalHoy: 0,
        confirmadas: 0,
        pendientes: 0,
        proximasReservas: []
      },
      predicciones: {
        proximasHoras: [],
        tendencia: 'estable'
      },
      recomendaciones: [
        isCurrentlyOpen ? 'Restaurante abierto y funcionando normalmente' : 'Restaurante cerrado',
        libres > totalTables / 2 ? 'Hay buena disponibilidad de mesas' : 'El restaurante está muy ocupado'
      ],
      puedeReservar: isCurrentlyOpen && libres > 0,
      capacidadMaxima: Math.max(...mockTables.map(t => t.capacity)),
    };

    logger.info('Restaurant status provided to Retell (MOCK)', { 
      restaurantId, 
      totalTables,
      occupancyRate: porcentajeOcupacion,
      isOpen: isCurrentlyOpen 
    });

    return NextResponse.json({
      success: true,
      data: dashboardInfo,
      timestamp: now.toISOString(),
      message: 'Información completa del estado del restaurante disponible para el agente (MOCK)'
    });

  } catch (error) {
    logger.error('Error providing restaurant status to Retell', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener el estado del restaurante'
    }, { status: 500 });
  }
}
