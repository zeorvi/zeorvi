import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { DateTime } from 'luxon';

// --- Función auxiliar para obtener fecha con zona horaria española ---
function obtenerFecha(fechaTexto: string): string {
  const zona = "Europe/Madrid";

  if (fechaTexto === "mañana" || fechaTexto === "tomorrow" || fechaTexto.includes('{{')) {
    return DateTime.now().setZone(zona).plus({ days: 1 }).toISODate() || '';
  } else if (fechaTexto === "hoy" || fechaTexto === "today") {
    return DateTime.now().setZone(zona).toISODate() || '';
  } else if (fechaTexto === "pasado mañana") {
    return DateTime.now().setZone(zona).plus({ days: 2 }).toISODate() || '';
  } else {
    // Si ya viene en formato ISO (YYYY-MM-DD), devolverlo
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)) {
      return fechaTexto;
    }
    
    // Buscar días de la semana
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const textoLower = fechaTexto.toLowerCase().trim();
    const idx = dias.findIndex(d => textoLower.includes(d) || textoLower.includes(d.replace('é','e')));
    
    if (idx >= 0) {
      const hoy = DateTime.now().setZone(zona);
      const diaSemana = hoy.weekday === 7 ? 0 : hoy.weekday; // Convertir domingo de 7 a 0
      let diff = idx - diaSemana;
      if (diff <= 0) diff += 7;
      return hoy.plus({ days: diff }).toISODate() || '';
    }
    
    // Fallback: mañana
    return DateTime.now().setZone(zona).plus({ days: 1 }).toISODate() || '';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Algunos modelos de Retell envían el cuerpo como { name, parameters }
    // Otros como { function: { name, arguments } }
    // Este bloque cubre ambos casos
    const name =
      body.name ||
      body.function_name ||
      body.function?.name ||
      body.tool_name ||
      body?.request?.function_name ||
      '';
    const parameters = body.parameters || body.args || body.arguments || body.function?.arguments || {};
    const restaurantId = 'rest_003';

    console.log("📞 Llamada recibida:", name, "Parámetros:", parameters);

    let result: unknown;

    switch (name) {
      // ✅ Obtener horarios y días cerrados
      case 'obtener_horarios_y_dias_cerrados':
        result = await GoogleSheetsService.obtenerHorariosYDiasCerrados(restaurantId);
        break;

      // ✅ Verificar disponibilidad
      case 'verificar_disponibilidad': {
        const { fecha, hora, personas, zona } = parameters || {};

        console.log("➡️ Datos recibidos:", { fecha, hora, personas, zona });

        // 📅 Usar nueva función de fecha con zona horaria española
        const fechaISO = obtenerFecha(fecha || 'mañana');
        console.log("📅 Fecha normalizada:", fechaISO, "desde:", fecha);

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
          fechaISO,
          hora,
          nPersonas,
          zona
        );

        break;
      }

      // ✅ Crear reserva
      case 'crear_reserva': {
        const { fecha, hora, cliente, telefono, personas, zona, notas } = parameters || {};
        
        // 📅 Usar nueva función de fecha con zona horaria española
        const fechaISO = obtenerFecha(fecha || 'mañana');
        console.log("📅 Fecha normalizada:", fechaISO, "desde:", fecha);

        // 🔍 1️⃣ Intentamos obtener el número de teléfono de TODAS las formas posibles
        const telefonoFinal =
          telefono ||
          body.phone ||
          body.caller_phone_number ||
          body.call?.from_number ||
          body.call?.caller_number ||
          body.session?.caller_phone ||
          body.session?.from ||
          body?.caller ||
          body?.metadata?.caller_phone_number ||
          "no_disponible";

        // 🧩 2️⃣ Si no hay número pero hay cliente con nombre, añade algo identificativo
        const telefonoSeguro = telefonoFinal === "no_disponible"
          ? `sin_numero_${Date.now()}`
          : telefonoFinal;

        console.log("📞 Teléfono procesado:", telefonoSeguro, "original:", telefono);

        result = await GoogleSheetsService.crearReserva(
          restaurantId,
          fechaISO,
          hora,
          cliente || "Desconocido",
          telefonoSeguro,
          Number(personas) || 1,
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
  } catch (err) {
    console.error('❌ Error en Retell Functions:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}
