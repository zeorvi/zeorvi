import { NextRequest, NextResponse } from 'next/server';
import { getReservationsByDate, createReservation, Reservation } from '@/lib/restaurantData';
import { retellCalendarSync } from '@/lib/services/retellCalendarSync';
import { turnSystemService } from '@/lib/services/turnSystem';
import { specialNeedsService } from '@/lib/services/specialNeedsService';

// Helper para parsear fechas relativas
function parseRelativeDate(dateInput: string): Date {
  const today = new Date();
  const normalizedInput = dateInput.toLowerCase().trim();
  
  switch (normalizedInput) {
    case 'hoy':
    case 'today':
      return today;
    
    case 'mañana':
    case 'manana':
    case 'tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    
    case 'pasado mañana':
    case 'pasado manana':
    case 'day after tomorrow':
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(today.getDate() + 2);
      return dayAfterTomorrow;
    
    case 'lunes':
    case 'monday':
      return getNextWeekday(today, 1);
    case 'martes':
    case 'tuesday':
      return getNextWeekday(today, 2);
    case 'miércoles':
    case 'miercoles':
    case 'wednesday':
      return getNextWeekday(today, 3);
    case 'jueves':
    case 'thursday':
      return getNextWeekday(today, 4);
    case 'viernes':
    case 'friday':
      return getNextWeekday(today, 5);
    case 'sábado':
    case 'sabado':
    case 'saturday':
      return getNextWeekday(today, 6);
    case 'domingo':
    case 'sunday':
      return getNextWeekday(today, 0);
    
    default:
      // Intentar parsear fecha en formato estándar
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
      
      // Si no se puede parsear, devolver mañana por defecto
      const defaultTomorrow = new Date(today);
      defaultTomorrow.setDate(today.getDate() + 1);
      return defaultTomorrow;
  }
}

function getNextWeekday(date: Date, targetDay: number): Date {
  const result = new Date(date);
  const currentDay = result.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7;
  
  // Si es el mismo día, tomar la próxima semana
  if (daysUntilTarget === 0) {
    result.setDate(result.getDate() + 7);
  } else {
    result.setDate(result.getDate() + daysUntilTarget);
  }
  
  return result;
}

// Helper para validar horarios con sistema de turnos
function parseTimeWithTurns(timeInput: string, restaurantId: string = 'elbuensabor'): {
  parsedTime: string | null;
  isValidTurn: boolean;
  nearestTurns: string[];
  suggestion: string;
} {
  const normalizedTime = timeInput.toLowerCase().trim();
  
  // Patrones comunes de tiempo
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2}):(\d{2})/,
    /(\d{1,2})/
  ];
  
  let parsedTime: string | null = null;
  
  for (const pattern of timePatterns) {
    const match = normalizedTime.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[3] || match[2];
      
      // Convertir formato 12h a 24h
      if (ampm && ampm.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (ampm && ampm.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      // Si no hay AM/PM y es menor a 8, asumir PM (horario de cena)
      if (!ampm && hours < 8) {
        hours += 12;
      }
      
      // Validar horarios razonables (13:00 - 23:30)
      if (hours >= 13 && hours <= 23) {
        parsedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        break;
      }
    }
  }

  if (!parsedTime) {
    return {
      parsedTime: null,
      isValidTurn: false,
      nearestTurns: [],
      suggestion: 'No pude entender la hora. Por favor, especifica una hora entre las 13:00 y 23:30.'
    };
  }

  // Verificar si está en un turno válido
  const isValidTurn = turnSystemService.isTimeInTurn(restaurantId, parsedTime);
  
  if (isValidTurn) {
    return {
      parsedTime,
      isValidTurn: true,
      nearestTurns: [],
      suggestion: `Perfecto, ${parsedTime} está disponible`
    };
  }

  // Si no es un turno válido, buscar opciones cercanas
  const { nearestOptions, suggestion } = turnSystemService.findNearestTurn(restaurantId, parsedTime);
  
  return {
    parsedTime,
    isValidTurn: false,
    nearestTurns: nearestOptions.map(turn => turn.startTime),
    suggestion
  };
}

// GET - Consultar disponibilidad
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || 'mañana';
    const timeParam = searchParams.get('time');
    const peopleParam = searchParams.get('people');
    
    const targetDate = parseRelativeDate(dateParam);
    const dateString = targetDate.toISOString().split('T')[0];
    
    // Obtener reservas existentes para esa fecha
    const existingReservations = getReservationsByDate(targetDate);
    
    // Obtener horarios de turnos disponibles
    const allTurnTimes = turnSystemService.getAllAvailableTimes('elbuensabor');
    const availableSlots = allTurnTimes.filter(time => {
      // Verificar si el turno está ocupado
      return !existingReservations.some(res => res.time === time);
    });
    
    // Información del día consultado
    const dayInfo = {
      date: dateString,
      dateFormatted: targetDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      dayName: targetDate.toLocaleDateString('es-ES', { weekday: 'long' }),
      isToday: targetDate.toDateString() === new Date().toDateString(),
      isTomorrow: targetDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
    };

    // Notificar consulta de disponibilidad
    retellCalendarSync.notifyAvailabilityCheck({
      date: dateString,
      time: timeParam || undefined,
      people: peopleParam ? parseInt(peopleParam) : undefined,
      availableSlots,
      totalSlots: availableSlots.length
    });
    
    return NextResponse.json({
      success: true,
      date: dayInfo,
      availableSlots,
      totalSlots: availableSlots.length,
      existingReservations: existingReservations.length,
      suggestedTimes: availableSlots.slice(0, 3), // Primeros 3 horarios disponibles
      message: `Encontré ${availableSlots.length} horarios disponibles para ${dayInfo.dateFormatted}`
    });
    
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al consultar la disponibilidad del calendario'
    }, { status: 500 });
  }
}

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, people, clientName, clientPhone, notes, specialNeeds } = body;
    
    // Parsear fecha
    const targetDate = parseRelativeDate(date);
    const timeResult = parseTimeWithTurns(time, 'elbuensabor');
    
    if (!timeResult.parsedTime) {
      return NextResponse.json({
        success: false,
        error: timeResult.suggestion
      }, { status: 400 });
    }

    if (!timeResult.isValidTurn) {
      return NextResponse.json({
        success: false,
        error: timeResult.suggestion,
        availableTimes: timeResult.nearestTurns,
        mealType: turnSystemService.getMealTypeByTime(timeResult.parsedTime)
      }, { status: 400 });
    }

    const parsedTime = timeResult.parsedTime;
    
    // Validar número de personas
    const numPeople = parseInt(people) || 2;
    if (numPeople < 1 || numPeople > 12) {
      return NextResponse.json({
        success: false,
        error: 'El número de personas debe ser entre 1 y 12.'
      }, { status: 400 });
    }
    
    // Verificar disponibilidad
    const existingReservations = getReservationsByDate(targetDate);
    const isTimeOccupied = existingReservations.some(res => res.time === parsedTime);
    
    if (isTimeOccupied) {
      return NextResponse.json({
        success: false,
        error: `Lo siento, ya hay una reserva para las ${parsedTime}. ¿Te gustaría otro horario?`,
        suggestedTimes: getSuggestedAlternatives(targetDate, parsedTime)
      }, { status: 409 });
    }
    
    // Procesar necesidades especiales si las hay
    let processedSpecialNeeds: string[] = [];
    let specialNeedsText = '';
    
    if (specialNeeds && typeof specialNeeds === 'string') {
      processedSpecialNeeds = specialNeedsService.parseClientResponse(specialNeeds);
      specialNeedsText = specialNeedsService.generateSpecialNeedsText(processedSpecialNeeds);
    }

    // Crear la reserva
    const newReservation: Omit<Reservation, 'id' | 'createdAt'> = {
      clientId: `retell_${Date.now()}`, // ID temporal para cliente de Retell
      tableId: await assignBestTable(numPeople, existingReservations, processedSpecialNeeds),
      date: targetDate,
      time: parsedTime,
      duration: 120, // 2 horas por defecto
      people: numPeople,
      status: 'confirmada',
      source: 'llamada',
      notes: [
        `Reserva por teléfono - Cliente: ${clientName}, Tel: ${clientPhone}`,
        specialNeedsText ? `Necesidades especiales: ${specialNeedsText}` : '',
        notes || ''
      ].filter(Boolean).join(' | ')
    };
    
    const reservation = await createReservation('elbuensabor', newReservation);
    
    // Guardar necesidades especiales si las hay
    if (processedSpecialNeeds.length > 0) {
      specialNeedsService.setReservationSpecialNeeds(
        reservation.id, 
        processedSpecialNeeds, 
        specialNeeds
      );
    }
    
    const dateFormatted = targetDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    // Notificar que se creó una nueva reserva desde Retell
    retellCalendarSync.notifyReservationCreated({
      id: reservation.id,
      clientName,
      clientPhone,
      date: targetDate.toISOString().split('T')[0],
      time: parsedTime,
      people: numPeople,
      tableId: reservation.tableId,
      status: 'confirmada',
      source: 'llamada',
      notes: newReservation.notes,
      createdAt: new Date().toISOString()
    });

    // Generar mensaje de confirmación
    let confirmationMessage = `¡Perfecto! He creado tu reserva para ${numPeople} personas el ${dateFormatted} a las ${parsedTime}`;
    
    if (processedSpecialNeeds.length > 0) {
      const kitchenInstructions = specialNeedsService.generateKitchenInstructions(processedSpecialNeeds);
      confirmationMessage += `. Hemos anotado tus necesidades especiales y el equipo estará preparado`;
    }
    
    confirmationMessage += '. ¡Te esperamos en El Buen Sabor!';
    
    return NextResponse.json({
      success: true,
      reservation,
      message: confirmationMessage,
      specialNeeds: processedSpecialNeeds.length > 0 ? {
        identified: processedSpecialNeeds,
        text: specialNeedsText,
        kitchenInstructions: specialNeedsService.generateKitchenInstructions(processedSpecialNeeds)
      } : null,
      details: {
        date: dateFormatted,
        time: parsedTime,
        people: numPeople,
        client: clientName,
        phone: clientPhone
      }
    });
    
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return NextResponse.json({
      success: false,
      error: 'Hubo un error al procesar tu reserva. Por favor, intenta de nuevo.'
    }, { status: 500 });
  }
}

// Helper para asignar la mejor mesa considerando necesidades especiales
async function assignBestTable(people: number, existingReservations: Reservation[], specialNeeds: string[] = []): Promise<string> {
  const occupiedTables = existingReservations.map(res => res.tableId);
  
  // Mesas disponibles por capacidad
  const tablesByCapacity = {
    2: ['1', '2', '3', '4', '5'],
    4: ['6', '7', '8', '9', '10'],
    6: ['11', '12', '13'],
    8: ['14', '15'],
    12: ['16']
  };

  // Mesas especiales para accesibilidad (números pares = más accesibles)
  const accessibleTables = ['2', '4', '6', '8', '10', '12', '14', '16'];
  
  // Verificar si requiere mesa especial
  const needsAccessibleTable = specialNeeds.includes('wheelchair') || 
                               specialNeeds.includes('mobility_aid') ||
                               specialNeeds.includes('business_dinner');
  
  // Si requiere mesa accesible, priorizar esas mesas
  if (needsAccessibleTable) {
    for (const [capacity, tables] of Object.entries(tablesByCapacity)) {
      if (people <= parseInt(capacity)) {
        const accessibleAvailable = tables.filter(table => 
          accessibleTables.includes(table) && !occupiedTables.includes(table)
        );
        if (accessibleAvailable.length > 0) {
          return accessibleAvailable[0];
        }
      }
    }
  }
  
  // Buscar mesa del tamaño exacto (comportamiento normal)
  for (const [capacity, tables] of Object.entries(tablesByCapacity)) {
    if (people <= parseInt(capacity)) {
      const availableTable = tables.find(table => !occupiedTables.includes(table));
      if (availableTable) {
        return availableTable;
      }
    }
  }
  
  // Si no hay mesas disponibles, asignar la primera disponible
  for (let i = 1; i <= 16; i++) {
    const tableId = i.toString();
    if (!occupiedTables.includes(tableId)) {
      return tableId;
    }
  }
  
  // Fallback
  return '1';
}

// Helper para sugerir horarios alternativos usando turnos
function getSuggestedAlternatives(date: Date, requestedTime: string): string[] {
  const existingReservations = getReservationsByDate(date);
  const occupiedTimes = existingReservations.map(res => res.time);
  
  // Obtener todos los turnos disponibles
  const allTurnTimes = turnSystemService.getAllAvailableTimes('elbuensabor');
  
  // Filtrar turnos no ocupados
  const availableTurnTimes = allTurnTimes.filter(time => !occupiedTimes.includes(time));
  
  // Buscar los más cercanos al horario solicitado
  const { nearestOptions } = turnSystemService.findNearestTurn('elbuensabor', requestedTime);
  
  const suggestions = nearestOptions
    .filter(turn => availableTurnTimes.includes(turn.startTime))
    .map(turn => turn.startTime)
    .slice(0, 3);
  
  // Si no hay suficientes sugerencias cercanas, agregar cualquier turno disponible
  if (suggestions.length < 3) {
    const additionalSuggestions = availableTurnTimes
      .filter(time => !suggestions.includes(time))
      .slice(0, 3 - suggestions.length);
    
    suggestions.push(...additionalSuggestions);
  }
  
  return suggestions;
}
