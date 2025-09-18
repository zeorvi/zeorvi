import { NextRequest, NextResponse } from 'next/server';
import { getReservationsByDate, Reservation } from '@/lib/restaurantData';
import { retellCalendarSync } from '@/lib/services/retellCalendarSync';

// Helper para buscar reservas por teléfono o nombre
function findReservationsByClient(phone?: string, name?: string, date?: string): Reservation[] {
  const searchDate = date ? new Date(date) : new Date();
  const allReservations = getReservationsByDate(searchDate);
  
  return allReservations.filter(reservation => {
    // Si se proporciona teléfono, buscar en notas (donde se almacena el teléfono de Retell)
    if (phone) {
      const phoneMatch = reservation.notes?.toLowerCase().includes(phone.toLowerCase()) ||
                         reservation.clientId.includes(phone);
      if (phoneMatch) return true;
    }
    
    // Si se proporciona nombre, buscar en notas
    if (name) {
      const nameMatch = reservation.notes?.toLowerCase().includes(name.toLowerCase());
      if (nameMatch) return true;
    }
    
    return false;
  });
}

// Helper para normalizar números de teléfono
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+34/, '');
}

// GET - Buscar reservas para cancelar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const name = searchParams.get('name');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    if (!phone && !name) {
      return NextResponse.json({
        success: false,
        error: 'Necesito el teléfono o nombre del cliente para buscar la reserva.'
      }, { status: 400 });
    }

    // Buscar reservas del día
    const foundReservations = findReservationsByClient(phone || undefined, name || undefined, date);
    
    // Notificar búsqueda
    retellCalendarSync.notifyReservationSearch({
      phone: phone || undefined,
      name: name || undefined,
      foundReservations: foundReservations.length,
      searchDate: date
    });
    
    if (foundReservations.length === 0) {
      // Buscar en días cercanos (±3 días)
      const extendedSearch = [];
      for (let offset = -3; offset <= 3; offset++) {
        if (offset === 0) continue;
        
        const searchDate = new Date();
        searchDate.setDate(searchDate.getDate() + offset);
        
        const dayReservations = findReservationsByClient(phone || undefined, name || undefined, searchDate.toISOString().split('T')[0]);
        extendedSearch.push(...dayReservations.map(res => ({
          ...res,
          searchDate: searchDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        })));
      }
      
      if (extendedSearch.length === 0) {
        return NextResponse.json({
          success: false,
          error: `No encontré ninguna reserva para ${phone ? `el teléfono ${phone}` : `el nombre ${name}`}. ¿Podrías verificar los datos?`,
          suggestions: [
            'Verifica que el teléfono sea correcto',
            'Confirma que la reserva esté a nombre de la persona que llama',
            'La reserva podría estar en otra fecha cercana'
          ]
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        reservations: extendedSearch,
        message: `Encontré ${extendedSearch.length} reserva(s) en fechas cercanas. ¿Cuál quieres cancelar?`,
        action: 'confirm_cancellation'
      });
    }

    // Si encontró reservas para el día solicitado
    const reservationDetails = foundReservations.map(res => ({
      id: res.id,
      time: res.time,
      people: res.people,
      tableId: res.tableId,
      status: res.status,
      date: new Date(res.date).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      }),
      notes: res.notes
    }));

    return NextResponse.json({
      success: true,
      reservations: reservationDetails,
      message: foundReservations.length === 1 
        ? `Encontré tu reserva para ${foundReservations[0].people} personas el ${reservationDetails[0].date} a las ${foundReservations[0].time}. ¿Quieres cancelarla?`
        : `Encontré ${foundReservations.length} reservas. ¿Cuál quieres cancelar?`,
      action: 'confirm_cancellation'
    });
    
  } catch (error) {
    console.error('Error al buscar reservas:', error);
    return NextResponse.json({
      success: false,
      error: 'Hubo un error al buscar tu reserva. Por favor, intenta de nuevo.'
    }, { status: 500 });
  }
}

// POST - Cancelar reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, phone, name, reason } = body;
    
    if (!reservationId) {
      return NextResponse.json({
        success: false,
        error: 'Necesito el ID de la reserva para cancelarla.'
      }, { status: 400 });
    }

    // En un sistema real, aquí actualizarías la base de datos
    // Por ahora, simularemos la cancelación
    
    // Notificar la cancelación al dashboard
    retellCalendarSync.notifyReservationCancelled({
      reservationId,
      clientName: name,
      clientPhone: phone,
      reason: reason || 'Cancelación solicitada por teléfono'
    });

    // Guardar notificación de cancelación
    if (typeof window !== 'undefined' && window.localStorage) {
      const notification = {
        id: `cancel_${reservationId}`,
        type: 'warning',
        title: '⚠️ Reserva Cancelada por Teléfono',
        message: `${name || 'Cliente'} canceló su reserva`,
        details: reason || 'Cancelación telefónica',
        timestamp: Date.now(),
        source: 'retell_ai'
      };

      const notifications = JSON.parse(localStorage.getItem('retell_notifications') || '[]');
      notifications.unshift(notification);
      notifications.splice(10); // Mantener solo 10
      
      localStorage.setItem('retell_notifications', JSON.stringify(notifications));
      
      // Disparar evento del DOM
      window.dispatchEvent(new CustomEvent('retell:reservation_cancelled', {
        detail: notification
      }));
    }

    return NextResponse.json({
      success: true,
      message: `Perfecto, he cancelado tu reserva. Lamento que no puedas acompañarnos. ¡Esperamos verte pronto en El Buen Sabor!`,
      details: {
        reservationId,
        status: 'cancelada',
        cancelledAt: new Date().toISOString(),
        reason: reason || 'Cancelación telefónica'
      }
    });
    
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Hubo un error al cancelar tu reserva. Por favor, intenta de nuevo o llama directamente al restaurante.'
    }, { status: 500 });
  }
}

// PUT - Modificar reserva
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, newDate, newTime, newPeople, reason } = body;
    
    if (!reservationId) {
      return NextResponse.json({
        success: false,
        error: 'Necesito el ID de la reserva para modificarla.'
      }, { status: 400 });
    }

    // Validar nueva fecha y hora si se proporcionan
    if (newDate) {
      const targetDate = new Date(newDate);
      if (targetDate < new Date()) {
        return NextResponse.json({
          success: false,
          error: 'No puedo cambiar la reserva a una fecha pasada.'
        }, { status: 400 });
      }
    }

    // En un sistema real, aquí verificarías disponibilidad y actualizarías la BD
    
    // Notificar la modificación al dashboard
    retellCalendarSync.emit('retell:reservation:updated', {
      type: 'reservation_updated',
      source: 'retell_ai',
      data: {
        reservationId,
        changes: {
          newDate,
          newTime,
          newPeople,
          reason
        },
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      message: `Reserva ${reservationId} modificada por teléfono`
    });

    const changes = [];
    if (newDate) changes.push(`fecha a ${new Date(newDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`);
    if (newTime) changes.push(`hora a las ${newTime}`);
    if (newPeople) changes.push(`${newPeople} personas`);

    return NextResponse.json({
      success: true,
      message: `¡Perfecto! He modificado tu reserva${changes.length > 0 ? ': ' + changes.join(', ') : ''}. Te esperamos en El Buen Sabor.`,
      details: {
        reservationId,
        changes: { newDate, newTime, newPeople },
        updatedAt: new Date().toISOString(),
        reason
      }
    });
    
  } catch (error) {
    console.error('Error al modificar reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Hubo un error al modificar tu reserva. Por favor, intenta de nuevo.'
    }, { status: 500 });
  }
}
