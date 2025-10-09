import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

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

    if (!fecha || !hora) {
      return NextResponse.json({
        success: false,
        error: 'fecha y hora son requeridos'
      }, { status: 400 });
    }

    // Detectar entorno
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    let status;

    if (isProduction) {
      // PRODUCCIÓN: Usar horarios hardcoded (SOLO VERIFICA DÍA, NO HORA)
      console.log('🔐 Production environment - using hardcoded schedules (day-based only)');
      
      const config = HORARIOS_HARDCODED[restaurantId as keyof typeof HORARIOS_HARDCODED];
      
      if (!config) {
        // Si no hay configuración, asumir que está abierto
        status = {
          abierto: true,
          mensaje: 'Restaurante abierto todo el día',
          horarios: []
        };
      } else {
        // Verificar SOLO el día de la semana (NO la hora)
        const fechaObj = new Date(`${fecha}T12:00:00`);
        const diaSemana = fechaObj.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
        
        console.log(`📅 Día de la semana: ${diaSemana}, Días cerrados: ${config.diasCerrados.join(', ')}`);
        
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
    } else {
      // DESARROLLO: Usar Google Sheets
      console.log('🔧 Development environment - using Google Sheets');
      status = await GoogleSheetsService.verificarRestauranteAbierto(
        restaurantId,
        fecha,
        hora
      );
    }

    return NextResponse.json({
      success: true,
      status,
      restaurantId,
      fecha,
      hora
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

