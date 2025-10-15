import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';
import { DateTime } from 'luxon';

// Configuración de runtime dinámico
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

      // ✅ Crear reserva - A PRUEBA DE TODO
      case 'crear_reserva': {
        try {
          const args = parameters || body || {};
          const call = body.call || {};

          // 🧭 Zona horaria correcta
          const zona = "Europe/Madrid";

          // ✅ 1️⃣ Normalizar fecha con luxon
          let fechaFinal: string;
          const fechaInput = args.fecha || "mañana";
          
          if (fechaInput === "mañana" || fechaInput === "tomorrow") {
            fechaFinal = DateTime.now().setZone(zona).plus({ days: 1 }).toISODate() || '';
          } else if (fechaInput === "hoy" || fechaInput === "today") {
            fechaFinal = DateTime.now().setZone(zona).toISODate() || '';
          } else {
            // Si viene "2025-10-11" o similar, lo validamos
            const f = DateTime.fromISO(fechaInput, { zone: zona });
            if (f.isValid) {
              fechaFinal = f.toISODate() || '';
            } else {
              throw new Error(`Fecha inválida: ${fechaInput}`);
            }
          }

          // ✅ 2️⃣ Recuperar número de teléfono
          const telefono =
            args.telefono && args.telefono !== "" && args.telefono !== "caller_phone_number"
              ? args.telefono
              : call.from_number ||
                body.caller_phone_number ||
                body.metadata?.caller_number ||
                (body.call as { from_number?: string })?.from_number ||
                (body.session as { caller_phone?: string })?.caller_phone ||
                "no_disponible";

          // ✅ 3️⃣ Construir la reserva
          const reserva = {
            cliente: args.cliente || "Desconocido",
            fecha: fechaFinal,
            hora: args.hora || "",
            personas: Number(args.personas) || 1,
            telefono,
            mesa: args.mesa || "",
            zona: args.zona || "",
            notas: args.notas || "",
            estado: "confirmada",
            call_id: call.id || body.call_id || "",
            creado_en: new Date().toISOString(),
            restaurantId
          };

          console.log("✅ Reserva construida:", reserva);

          // 💾 4️⃣ Guardar en Google Sheets
          const sheetResult = await GoogleSheetsService.crearReserva(
            restaurantId,
            fechaFinal,
            reserva.hora,
            reserva.cliente,
            telefono,
            reserva.personas,
            reserva.zona,
            reserva.notas
          );

          console.log("✅ Reserva guardada en Sheets:", sheetResult);

          // 🟢 5️⃣ Respuesta para Retell
          result = {
            success: true,
            mensaje: `Reserva confirmada para ${reserva.cliente} el ${reserva.fecha} a las ${reserva.hora}`,
            reserva,
            call_id: reserva.call_id
          };

        } catch (err) {
          console.error("❌ Error creando reserva:", err);
          result = {
            success: false,
            error: err instanceof Error ? err.message : "Error creando la reserva",
            mensaje: "No se pudo crear la reserva"
          };
        }
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
