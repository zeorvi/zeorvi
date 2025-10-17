import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/googleSheetsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, mesaId, mesaNombre, cliente, telefono, personas, notas, zona, estado } = body;

    // Validaciones
    if (!restaurantId || !mesaId || !mesaNombre) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos: restaurantId, mesaId, mesaNombre'
      }, { status: 400 });
    }

    if (!cliente || !personas) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos del cliente: cliente, personas'
      }, { status: 400 });
    }

    // El estado puede ser 'occupied' o 'reserved'
    const estadoFinal: 'confirmada' = 'confirmada'; // Todas las mesas ocupadas/reservadas manualmente tienen estado confirmada
    const tipoAccion = estado === 'reserved' ? 'Reserva manual' : 'Walk-in';

    console.log(`📝 [occupy-table] Creando ${tipoAccion} para mesa ${mesaNombre}...`);
    console.log(`   Cliente: ${cliente}`);
    console.log(`   Teléfono: ${telefono || 'Sin teléfono'}`);
    console.log(`   Personas: ${personas}`);
    console.log(`   Estado: ${estadoFinal}`);

    // Obtener fecha y hora actual
    const now = new Date();
    const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hora = now.toTimeString().split(':').slice(0, 2).join(':'); // HH:MM

    // Determinar el turno basado en la hora
    const horaNumero = parseInt(hora.split(':')[0]);
    let turno = 'Comida';
    if (horaNumero >= 19 || horaNumero < 4) {
      turno = 'Cena';
    } else if (horaNumero >= 4 && horaNumero < 12) {
      turno = 'Desayuno';
    }

    // Crear la reserva en Google Sheets
    const reserva = {
      Fecha: fecha,
      Hora: hora,
      Turno: turno,
      Cliente: cliente,
      Telefono: telefono || 'Sin teléfono',
      Personas: personas,
      Zona: zona || 'Sin zona',
      Mesa: mesaNombre,
      Estado: estadoFinal,
      Notas: notas ? `${tipoAccion}: ${notas}` : `${tipoAccion} - Mesa ${estado === 'reserved' ? 'reservada' : 'ocupada'} por el encargado`
    };

    console.log('💾 Guardando reserva en Google Sheets:', reserva);

    const result = await GoogleSheetsService.addReserva(restaurantId, reserva);

    if (result.success) {
      console.log(`✅ ${tipoAccion} creada exitosamente: ${result.ID}`);
      
      // Calcular hora de liberación (2 horas después)
      const liberacionTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      return NextResponse.json({
        success: true,
        reservaId: result.ID,
        mensaje: `Mesa ${mesaNombre} ${estado === 'reserved' ? 'reservada' : 'ocupada'} exitosamente`,
        detalles: {
          cliente,
          personas,
          estado: estadoFinal,
          horaOcupacion: hora,
          horaLiberacionAutomatica: liberacionTime.toTimeString().split(':').slice(0, 2).join(':'),
          mesaNombre,
          zona: zona || 'Sin zona'
        }
      });
    } else {
      console.error(`❌ Error al crear ${tipoAccion}:`, result.error);
      return NextResponse.json({
        success: false,
        error: result.error || 'Error al crear la reserva'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error en occupy-table:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

