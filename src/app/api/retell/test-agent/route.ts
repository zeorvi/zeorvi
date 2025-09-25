import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, message, people, date, time } = body;

    if (!restaurantId) {
      return NextResponse.json({
        success: false,
        error: 'restaurantId es requerido'
      }, { status: 400 });
    }

    // Simular consulta de disponibilidad
    const availabilityResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/check-availability?restaurantId=${restaurantId}&people=${people || 2}&date=${date || 'hoy'}&time=${time || '20:00'}`);
    const availabilityData = await availabilityResponse.json();

    // Simular consulta del dashboard
    const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/dashboard-info?restaurantId=${restaurantId}`);
    const dashboardData = await dashboardResponse.json();

    // Simular consulta de reservas
    const reservationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/reservations?restaurantId=${restaurantId}&date=${date || 'hoy'}`);
    const reservationsData = await reservationsResponse.json();

    // Simular consulta de mesas
    const tablesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/tables?restaurantId=${restaurantId}`);
    const tablesData = await tablesResponse.json();

    // Simular consulta de agenda
    const agendaResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/agenda?restaurantId=${restaurantId}&date=${date || 'hoy'}`);
    const agendaData = await agendaResponse.json();

    // Simular consulta de clientes
    const clientsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/retell/clients?restaurantId=${restaurantId}`);
    const clientsData = await clientsResponse.json();

    // Generar respuesta del agente basada en los datos del dashboard
    let agentResponse = '';
    
    if (message.toLowerCase().includes('disponibilidad') || message.toLowerCase().includes('mesa')) {
      if (availabilityData.success && availabilityData.availability.hasAvailability) {
        agentResponse = `¡Perfecto! He consultado nuestro sistema y tenemos disponibilidad. ${availabilityData.recommendations[0]}`;
        
        if (availabilityData.tablesByLocation.length > 0) {
          agentResponse += ` Tenemos mesas disponibles en: ${availabilityData.tablesByLocation.map((loc: any) => `${loc.location} (${loc.count} mesa${loc.count > 1 ? 's' : ''})`).join(', ')}.`;
        }
        
        agentResponse += ` ¿Le gustaría que le confirme la reserva?`;
      } else {
        agentResponse = `Lamentablemente no tenemos mesas disponibles para ${people || 2} persona${(people || 2) > 1 ? 's' : ''} en este momento. ${availabilityData.recommendations[0]}`;
        
        if (availabilityData.alternativeTimes.length > 0) {
          agentResponse += ` Le sugiero estos horarios alternativos: ${availabilityData.alternativeTimes.join(', ')}.`;
        }
      }
    } else if (message.toLowerCase().includes('reservar') || message.toLowerCase().includes('reserva')) {
      if (availabilityData.success && availabilityData.availability.hasAvailability) {
        agentResponse = `¡Excelente! He verificado la disponibilidad y podemos confirmar su reserva. `;
        agentResponse += `Tenemos ${availabilityData.availability.availableTables} mesa${availabilityData.availability.availableTables > 1 ? 's' : ''} disponible${availabilityData.availability.availableTables > 1 ? 's' : ''} para ${people || 2} persona${(people || 2) > 1 ? 's' : ''}. `;
        agentResponse += `¿Podría darme su nombre y teléfono para confirmar la reserva?`;
      } else {
        agentResponse = `Lamentablemente no tenemos disponibilidad para ${people || 2} persona${(people || 2) > 1 ? 's' : ''} en el horario solicitado. `;
        if (availabilityData.alternativeTimes.length > 0) {
          agentResponse += `Le sugiero estos horarios alternativos: ${availabilityData.alternativeTimes.join(', ')}.`;
        }
      }
    } else if (message.toLowerCase().includes('agenda') || message.toLowerCase().includes('reservas del día')) {
      if (agendaData.success) {
        const stats = agendaData.statistics;
        agentResponse = `He consultado la agenda de hoy y tenemos ${stats.totalReservations} reservas confirmadas para ${stats.totalPeople} personas. `;
        agentResponse += `En el turno de comida: ${stats.lunch.reservations} reservas (${stats.lunch.people} personas). `;
        agentResponse += `En el turno de cena: ${stats.dinner.reservations} reservas (${stats.dinner.people} personas). `;
        agentResponse += `¿Le gustaría hacer una nueva reserva?`;
      }
    } else if (message.toLowerCase().includes('cliente') || message.toLowerCase().includes('maría') || message.toLowerCase().includes('garcía')) {
      if (clientsData.success && clientsData.clients.length > 0) {
        const client = clientsData.clients[0];
        agentResponse = `He encontrado información del cliente ${client.name}. `;
        agentResponse += `Es un cliente frecuente con ${client.totalReservations} reservas anteriores. `;
        agentResponse += `Su última visita fue el ${client.lastVisit}. `;
        if (client.preferences.specialRequests) {
          agentResponse += `Sus preferencias incluyen: ${client.preferences.specialRequests}. `;
        }
        agentResponse += `¿Le gustaría hacer una nueva reserva para ${client.name}?`;
      } else {
        agentResponse = `No he encontrado información del cliente en nuestra base de datos. `;
        agentResponse += `¿Le gustaría que le ayude a crear un nuevo perfil de cliente?`;
      }
    } else if (message.toLowerCase().includes('liberar') || message.toLowerCase().includes('mesa s1')) {
      agentResponse = `He procesado la solicitud para liberar la mesa S1. `;
      agentResponse += `La mesa ha sido marcada como disponible en nuestro sistema. `;
      agentResponse += `¿Hay algo más en lo que pueda ayudarle?`;
    } else if (message.toLowerCase().includes('estado') || message.toLowerCase().includes('ocupación') || message.toLowerCase().includes('mesas')) {
      if (tablesData.success) {
        const stats = tablesData.statistics;
        agentResponse = `He consultado el estado actual de todas las mesas. `;
        agentResponse += `Tenemos ${stats.available} mesas disponibles de un total de ${stats.total}. `;
        agentResponse += `La ocupación actual es del ${stats.occupancyRate}%. `;
        
        if (stats.available > 0) {
          agentResponse += `Tenemos buena disponibilidad en este momento. ¿Le gustaría hacer una reserva?`;
        } else {
          agentResponse += `Estamos bastante ocupados, pero puedo sugerirle algunos horarios alternativos.`;
        }
      }
    } else {
      agentResponse = `He consultado nuestro sistema de gestión completo. `;
      if (availabilityData.success) {
        agentResponse += availabilityData.availability.hasAvailability 
          ? `Tenemos disponibilidad para su reserva. ¿Cuántas personas serán?`
          : `Actualmente no tenemos disponibilidad, pero puedo ayudarle a encontrar un horario alternativo.`;
      }
    }

    return NextResponse.json({
      success: true,
      agentResponse,
      dashboardData: dashboardData.success ? {
        totalTables: dashboardData.currentStatus.totalTables,
        available: dashboardData.currentStatus.available,
        occupied: dashboardData.currentStatus.occupied,
        occupancyRate: dashboardData.currentStatus.occupancyRate
      } : null,
      availabilityData: availabilityData.success ? {
        hasAvailability: availabilityData.availability.hasAvailability,
        availableTables: availabilityData.availability.availableTables,
        recommendations: availabilityData.recommendations
      } : null,
      reservationsData: reservationsData.success ? {
        total: reservationsData.summary.total,
        confirmed: reservationsData.summary.confirmed,
        pending: reservationsData.summary.pending
      } : null,
      tablesData: tablesData.success ? {
        total: tablesData.statistics.total,
        available: tablesData.statistics.available,
        occupied: tablesData.statistics.occupied,
        occupancyRate: tablesData.statistics.occupancyRate
      } : null,
      agendaData: agendaData.success ? {
        totalReservations: agendaData.statistics.totalReservations,
        totalPeople: agendaData.statistics.totalPeople,
        lunch: agendaData.statistics.lunch,
        dinner: agendaData.statistics.dinner
      } : null,
      clientsData: clientsData.success ? {
        total: clientsData.statistics.total,
        vip: clientsData.statistics.vip,
        newThisMonth: clientsData.statistics.newThisMonth
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test agent:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
