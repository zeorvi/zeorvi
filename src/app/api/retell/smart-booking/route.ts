import { NextRequest, NextResponse } from 'next/server';
import { getTablesByStatus, getReservationsByDate, simulateRetellAIReservation } from '@/lib/restaurantData';
import { logger } from '@/lib/logger';

// POST - Reserva inteligente con gestión automática de turnos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clientName, 
      clientPhone, 
      people, 
      date, 
      preferredTime, 
      notes,
      restaurantId = 'default'
    } = body;
    
    // Validar datos requeridos
    if (!clientName || !clientPhone || !people || !date) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: clientName, clientPhone, people, date' },
        { status: 400 }
      );
    }
    
    // Obtener reservas del día para analizar disponibilidad
    const reservasDelDia = getReservationsByDate(new Date(date));
    const mesasLibres = getTablesByStatus('libre');
    const totalMesas = getTablesByStatus('all').length;
    
    // Definir turnos disponibles
    const turnosDisponibles = [
      { hora: '13:00', nombre: 'Comida - Primer turno (13:00-15:00)', tipo: 'comida' },
      { hora: '14:00', nombre: 'Comida - Segundo turno (14:00-16:00)', tipo: 'comida' },
      { hora: '20:00', nombre: 'Cena - Primer turno (20:00-22:00)', tipo: 'cena' },
      { hora: '22:00', nombre: 'Cena - Segundo turno (22:00-23:30)', tipo: 'cena' }
    ];
    
    // Analizar disponibilidad por turno
    const analisisDisponibilidad = turnosDisponibles.map(turno => {
      const reservasEnTurno = reservasDelDia.filter(r => 
        r.time === turno.hora && r.status !== 'cancelada'
      );
      const mesasDisponibles = totalMesas - reservasEnTurno.length;
      
      return {
        ...turno,
        reservas_actuales: reservasEnTurno.length,
        mesas_disponibles: mesasDisponibles,
        disponible: mesasDisponibles > 0,
        capacidad_suficiente: mesasLibres.some(mesa => mesa.capacity >= people)
      };
    });
    
    // Buscar el mejor turno
    let mejorTurno = null;
    
    // 1. Intentar hora preferida si se especificó
    if (preferredTime) {
      mejorTurno = analisisDisponibilidad.find(t => 
        t.hora === preferredTime && t.disponible && t.capacidad_suficiente
      );
    }
    
    // 2. Si no hay hora preferida o no está disponible, buscar el mejor turno
    if (!mejorTurno) {
      // Priorizar turnos con más disponibilidad
      const turnosOrdenados = analisisDisponibilidad
        .filter(t => t.disponible && t.capacidad_suficiente)
        .sort((a, b) => b.mesas_disponibles - a.mesas_disponibles);
      
      mejorTurno = turnosOrdenados[0];
    }
    
    // Si no hay turnos disponibles
    if (!mejorTurno) {
      const alternativas = analisisDisponibilidad
        .filter(t => t.capacidad_suficiente)
        .map(t => ({
          hora: t.hora,
          nombre: t.nombre,
          disponible: t.disponible,
          mesas_disponibles: t.mesas_disponibles
        }));
      
      return NextResponse.json({
        success: false,
        message: 'No hay disponibilidad para la fecha solicitada',
        alternativas,
        estado_restaurante: {
          total_mesas: totalMesas,
          mesas_libres: mesasLibres.length,
          fecha_consultada: date
        }
      });
    }
    
    // Crear la reserva en el mejor turno disponible
    const resultadoReserva = simulateRetellAIReservation({
      name: clientName,
      phone: clientPhone,
      people,
      date,
      time: mejorTurno.hora,
      notes: notes || `Reserva automática - ${mejorTurno.nombre}`
    });
    
    if (resultadoReserva.success) {
      logger.info('Reserva creada automáticamente por Retell', {
        restaurantId,
        clientName,
        turno: mejorTurno.hora,
        people,
        date
      });
      
      return NextResponse.json({
        success: true,
        message: `Reserva confirmada para ${clientName}`,
        reserva: {
          id: resultadoReserva.reservationId,
          cliente: clientName,
          telefono: clientPhone,
          fecha: date,
          hora: mejorTurno.hora,
          turno_asignado: mejorTurno.nombre,
          personas: people,
          mesa_asignada: resultadoReserva.tableId,
          estado: 'pendiente',
          notas: notes
        },
        turno_seleccionado: {
          hora: mejorTurno.hora,
          nombre: mejorTurno.nombre,
          mesas_restantes: mejorTurno.mesas_disponibles - 1
        },
        mensaje_para_cliente: `Perfecto ${clientName}, he confirmado tu reserva para ${people} personas el ${new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${mejorTurno.hora}. Tu mesa es la ${resultadoReserva.tableId}. Te esperamos en ${mejorTurno.nombre.toLowerCase()}.`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No se pudo procesar la reserva',
        estado_restaurante: {
          total_mesas: totalMesas,
          mesas_libres: mesasLibres.length,
          turnos_analizados: analisisDisponibilidad
        }
      });
    }
    
  } catch (error) {
    logger.error('Error en reserva inteligente de Retell', { error });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Consultar disponibilidad de turnos específicos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId') || 'default';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const people = parseInt(searchParams.get('people') || '2');
    
    // Obtener estado actual
    const reservasDelDia = getReservationsByDate(new Date(date));
    const mesasLibres = getTablesByStatus('libre');
    const totalMesas = getTablesByStatus('all').length;
    
    // Analizar cada turno
    const estadoTurnos = {
      fecha: date,
      restaurante_id: restaurantId,
      personas_solicitadas: people,
      
      comida: {
        primer_turno_13: {
          hora: '13:00',
          nombre: 'Comida - Primer turno',
          horario_completo: '13:00 a 15:00',
          reservas_actuales: reservasDelDia.filter(r => r.time === '13:00' && r.status !== 'cancelada').length,
          mesas_disponibles: totalMesas - reservasDelDia.filter(r => r.time === '13:00' && r.status !== 'cancelada').length,
          puede_acomodar_grupo: mesasLibres.some(mesa => mesa.capacity >= people),
          disponible: true
        },
        
        segundo_turno_14: {
          hora: '14:00',
          nombre: 'Comida - Segundo turno',
          horario_completo: '14:00 a 16:00',
          reservas_actuales: reservasDelDia.filter(r => r.time === '14:00' && r.status !== 'cancelada').length,
          mesas_disponibles: totalMesas - reservasDelDia.filter(r => r.time === '14:00' && r.status !== 'cancelada').length,
          puede_acomodar_grupo: mesasLibres.some(mesa => mesa.capacity >= people),
          disponible: true
        }
      },
      
      cena: {
        primer_turno_20: {
          hora: '20:00',
          nombre: 'Cena - Primer turno',
          horario_completo: '20:00 a 22:00',
          reservas_actuales: reservasDelDia.filter(r => r.time === '20:00' && r.status !== 'cancelada').length,
          mesas_disponibles: totalMesas - reservasDelDia.filter(r => r.time === '20:00' && r.status !== 'cancelada').length,
          puede_acomodar_grupo: mesasLibres.some(mesa => mesa.capacity >= people),
          disponible: true
        },
        
        segundo_turno_22: {
          hora: '22:00',
          nombre: 'Cena - Segundo turno',
          horario_completo: '22:00 a 23:30',
          reservas_actuales: reservasDelDia.filter(r => r.time === '22:00' && r.status !== 'cancelada').length,
          mesas_disponibles: totalMesas - reservasDelDia.filter(r => r.time === '22:00' && r.status !== 'cancelada').length,
          puede_acomodar_grupo: mesasLibres.some(mesa => mesa.capacity >= people),
          disponible: true
        }
      },
      
      resumen_para_agente: {
        hay_disponibilidad: mesasLibres.length > 0,
        mejor_turno_recomendado: (() => {
          const turnos = [
            { hora: '13:00', disponibles: totalMesas - reservasDelDia.filter(r => r.time === '13:00' && r.status !== 'cancelada').length, tipo: 'comida' },
            { hora: '14:00', disponibles: totalMesas - reservasDelDia.filter(r => r.time === '14:00' && r.status !== 'cancelada').length, tipo: 'comida' },
            { hora: '20:00', disponibles: totalMesas - reservasDelDia.filter(r => r.time === '20:00' && r.status !== 'cancelada').length, tipo: 'cena' },
            { hora: '22:00', disponibles: totalMesas - reservasDelDia.filter(r => r.time === '22:00' && r.status !== 'cancelada').length, tipo: 'cena' }
          ];
          return turnos.sort((a, b) => b.disponibles - a.disponibles)[0];
        })(),
        
        mensaje_sugerido: `Tenemos disponibilidad para ${people} personas. Te recomiendo nuestro turno con más disponibilidad.`
      }
    };
    
    // Marcar turnos no disponibles
    Object.values(estadoTurnos.almuerzo).forEach(turno => {
      if (turno.mesas_disponibles <= 0 || !turno.puede_acomodar_grupo) {
        turno.disponible = false;
      }
    });
    
    Object.values(estadoTurnos.cena).forEach(turno => {
      if (turno.mesas_disponibles <= 0 || !turno.puede_acomodar_grupo) {
        turno.disponible = false;
      }
    });
    
    return NextResponse.json(estadoTurnos);
    
  } catch (error) {
    logger.error('Error al consultar disponibilidad de turnos', { error });
    return NextResponse.json(
      { error: 'Error al consultar disponibilidad' },
      { status: 500 }
    );
  }
}
