import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Horarios hardcoded para producción
// IMPORTANTE: Solo se verifica el DÍA, NO la hora. El restaurante está abierto todo el día excepto los días cerrados.
const HORARIOS_HARDCODED = {
  rest_003: {
    diasCerrados: ['lunes', 'martes'], // La Gaviota cierra lunes y martes
    turnos: [
      { Turno: 'Todo el día', Inicio: '00:00', Fin: '23:59' }
    ]
  },
  rest_001: {
    diasCerrados: ['lunes', 'martes'],
    turnos: [
      { Turno: 'Todo el día', Inicio: '00:00', Fin: '23:59' }
    ]
  }
};

// GET - Verificar si el restaurante está abierto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const hora = searchParams.get('hora');
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Usar fecha y hora actuales si no se proporcionan
    const fechaFinal = fecha || new Date().toISOString().split('T')[0];
    const horaFinal = hora || new Date().toTimeString().slice(0, 5);

    // SIEMPRE usar horarios hardcoded para evitar problemas de horarios específicos
    console.log('🔐 Using hardcoded schedules (day-based only) for restaurant:', restaurantId);
    
    const config = HORARIOS_HARDCODED[restaurantId as keyof typeof HORARIOS_HARDCODED];
    let status: {
      abierto: boolean;
      mensaje: string;
      horarios: any[];
    };
    
    if (!config) {
      // Si no hay configuración, asumir que está abierto
      status = {
        abierto: true,
        mensaje: 'Restaurante abierto todo el día',
        horarios: []
      };
    } else {
      // Verificar SOLO el día de la semana (NO la hora)
      const fechaObj = new Date(`${fechaFinal}T12:00:00`);
      const diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      
      console.log(`📅 Fecha recibida: ${fechaFinal}`);
      console.log(`📅 Objeto fecha: ${fechaObj.toISOString()}`);
      console.log(`📅 Día de la semana detectado: "${diaSemana}"`);
      console.log(`📅 Días cerrados configurados: ${config.diasCerrados.join(', ')}`);
      console.log(`📅 ¿Está cerrado? ${config.diasCerrados.includes(diaSemana)}`);
      
      // Verificar si está cerrado ese día
      if (config.diasCerrados.includes(diaSemana)) {
        const diasTexto = config.diasCerrados.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        status = {
          abierto: false,
          mensaje: `Restaurante cerrado los ${diasTexto}`,
          horarios: config.turnos
        };
      } else {
        // Está abierto todo el día (sin importar la hora)
        status = {
          abierto: true,
          mensaje: 'Restaurante abierto todo el día',
          horarios: config.turnos
        };
      }
    }
    
    console.log('✅ Hardcoded schedule check (day-based):', status);

    return NextResponse.json({
      success: true,
      status,
      restaurantId,
      fecha: fechaFinal,
      hora: horaFinal
    });

  } catch (error) {
    console.error('Error verificando horarios:', error);
    // En caso de error, asumir que está abierto
    return NextResponse.json({
      success: true,
      status: {
        abierto: true,
        mensaje: 'Error verificando horarios, asumiendo que está abierto'
      }
    }, { status: 200 });
  }
}

