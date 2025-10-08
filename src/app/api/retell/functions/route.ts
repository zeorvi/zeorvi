import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Algunos modelos de Retell envían el cuerpo como { name, parameters }
    // Otros como { function: { name, arguments } }
    // Este bloque cubre ambos casos
    const name = body.name || body.function?.name || body.tool_name || '';
    const parameters = body.parameters || body.args || body.arguments || body.function?.arguments || {};
    const restaurantId = 'rest_003';

    console.log("📞 Llamada recibida:", name, "Parámetros:", parameters);

    let result;

    switch (name) {
      // ✅ Obtener horarios y días cerrados
      case 'obtener_horarios_y_dias_cerrados':
        result = await GoogleSheetsService.obtenerHorariosYDiasCerrados(restaurantId);
        break;

      // ✅ Verificar disponibilidad
      case 'verificar_disponibilidad': {
        let { fecha } = parameters || {};
        const { hora, personas, zona } = parameters || {};
        const hoy = new Date();

        console.log("➡️ Datos recibidos:", { fecha, hora, personas, zona });

        // --- Si la fecha viene vacía o token ---
        if (!fecha || typeof fecha !== 'string' || fecha === 'undefined' || fecha.includes('{{')) {
          fecha = 'mañana';
        }

        // --- Normalización de fecha ---
        const normalizarFecha = (texto: string): string => {
          const t = texto.toLowerCase().trim();

          if (t.includes('hoy') || t.includes('today')) return hoy.toISOString().split('T')[0];
          if (t.includes('mañana') || t.includes('tomorrow') || t.includes('current_date_plus_1')) {
            hoy.setDate(hoy.getDate() + 1);
            return hoy.toISOString().split('T')[0];
          }
          if (t.includes('pasado mañana')) {
            hoy.setDate(hoy.getDate() + 2);
            return hoy.toISOString().split('T')[0];
          }

          const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
          const idx = dias.findIndex(d => t.includes(d) || t.includes(d.replace('é','e')));
          if (idx >= 0) {
            let diff = idx - hoy.getDay();
            if (diff <= 0) diff += 7;
            hoy.setDate(hoy.getDate() + diff);
            return hoy.toISOString().split('T')[0];
          }

          // fallback
          hoy.setDate(hoy.getDate() + 1);
          return hoy.toISOString().split('T')[0];
        };

        fecha = normalizarFecha(fecha);

        // --- Validación hora ---
        if (!hora || typeof hora !== "string") {
          return NextResponse.json({
            success: false,
            error: "Hora no proporcionada o inválida."
          }, { status: 400 });
        }

        // Permitir "8:00", "08:00", "20:00"
        const horaNormalizada = hora.trim();
        const patronHora = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

        if (!patronHora.test(horaNormalizada)) {
          console.warn("⚠️ Hora inválida recibida:", horaNormalizada);
          return NextResponse.json({
            success: false,
            error: "Hora inválida. Debe estar en formato HH:MM (ej: 20:00)."
          }, { status: 400 });
        }

        const nPersonas = Number(personas) || 1;

        result = await GoogleSheetsService.verificarDisponibilidad(
          restaurantId,
          fecha,
          hora,
          nPersonas,
          zona
        );

        break;
      }

      // ✅ Crear reserva
      case 'crear_reserva': {
        const { fecha, hora, cliente, telefono, personas, zona, notas } = parameters || {};
        result = await GoogleSheetsService.crearReserva(
          restaurantId,
          fecha,
          hora,
          cliente,
          telefono,
          personas,
          zona,
          notas
        );
        break;
      }

      // ✅ Cancelar reserva
      case 'cancelar_reserva': {
        const { cliente, telefono } = parameters || {};
        result = await GoogleSheetsService.cancelarReserva(restaurantId, cliente, telefono);
        break;
      }

      // ✅ Buscar reserva
      case 'buscar_reserva': {
        const { cliente, telefono } = parameters || {};
        result = await GoogleSheetsService.buscarReserva(restaurantId, cliente, telefono);
        break;
      }

      // ✅ Transferir llamada
      case 'transferir_llamada': {
        const { motivo } = parameters || {};
        console.log('🔄 Transferir llamada solicitada:', motivo);
        result = { success: true, mensaje: `Llamada transferida por motivo: ${motivo}` };
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Función ${name} no reconocida`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      function_name: name,
      restaurantId,
      result
    });
  } catch (err: any) {
    console.error('❌ Error en Retell Functions:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
