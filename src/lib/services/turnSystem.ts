// Sistema de turnos para horarios de restaurante
export interface TimeSlot {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  maxDuration: number; // minutos
  type: 'almuerzo' | 'cena';
  isActive: boolean;
}

export interface RestaurantTurns {
  restaurantId: string;
  timeSlots: TimeSlot[];
  lastUpdated: Date;
}

// Turnos por defecto
export const DEFAULT_TURNS: TimeSlot[] = [
  // Turnos de almuerzo
  {
    id: 'almuerzo_1',
    name: 'Primer turno de almuerzo',
    startTime: '13:00',
    endTime: '15:00',
    maxDuration: 120, // 2 horas
    type: 'almuerzo',
    isActive: true
  },
  {
    id: 'almuerzo_2', 
    name: 'Segundo turno de almuerzo',
    startTime: '14:00',
    endTime: '16:00',
    maxDuration: 120,
    type: 'almuerzo',
    isActive: true
  },
  // Turnos de cena
  {
    id: 'cena_1',
    name: 'Primer turno de cena',
    startTime: '20:00',
    endTime: '22:00',
    maxDuration: 120,
    type: 'cena',
    isActive: true
  },
  {
    id: 'cena_2',
    name: 'Segundo turno de cena', 
    startTime: '22:00',
    endTime: '23:30',
    maxDuration: 90, // 1.5 horas (turno de cierre)
    type: 'cena',
    isActive: true
  }
];

// Clase para gestionar el sistema de turnos
export class TurnSystemService {
  private static instance: TurnSystemService;
  private restaurantTurns: Map<string, RestaurantTurns> = new Map();

  static getInstance(): TurnSystemService {
    if (!TurnSystemService.instance) {
      TurnSystemService.instance = new TurnSystemService();
    }
    return TurnSystemService.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  // Obtener turnos de un restaurante
  getRestaurantTurns(restaurantId: string): TimeSlot[] {
    const turns = this.restaurantTurns.get(restaurantId);
    return turns?.timeSlots || DEFAULT_TURNS;
  }

  // Establecer turnos para un restaurante
  setRestaurantTurns(restaurantId: string, timeSlots: TimeSlot[]): void {
    this.restaurantTurns.set(restaurantId, {
      restaurantId,
      timeSlots,
      lastUpdated: new Date()
    });
    this.saveToStorage();
  }

  // Encontrar el turno más cercano para una hora solicitada
  findNearestTurn(restaurantId: string, requestedTime: string): {
    exactMatch: TimeSlot | null;
    nearestOptions: TimeSlot[];
    suggestion: string;
  } {
    const turns = this.getRestaurantTurns(restaurantId).filter(turn => turn.isActive);
    const requestedMinutes = this.timeToMinutes(requestedTime);
    
    // Buscar coincidencia exacta
    const exactMatch = turns.find(turn => turn.startTime === requestedTime);
    
    if (exactMatch) {
      return {
        exactMatch,
        nearestOptions: [],
        suggestion: `Perfecto, tenemos disponibilidad a las ${exactMatch.startTime}`
      };
    }

    // Buscar opciones cercanas
    const nearestOptions = turns
      .map(turn => ({
        turn,
        timeDiff: Math.abs(this.timeToMinutes(turn.startTime) - requestedMinutes)
      }))
      .sort((a, b) => a.timeDiff - b.timeDiff)
      .slice(0, 2)
      .map(item => item.turn);

    const suggestion = nearestOptions.length > 0 
      ? `Para las ${requestedTime} no tenemos disponibilidad. Los horarios más cercanos son las ${nearestOptions.map(turn => turn.startTime).join(' o las ')}`
      : 'Lo siento, no tenemos horarios disponibles cerca de esa hora';

    return {
      exactMatch: null,
      nearestOptions,
      suggestion
    };
  }

  // Verificar si una hora está dentro de un turno
  isTimeInTurn(restaurantId: string, time: string): boolean {
    const turns = this.getRestaurantTurns(restaurantId).filter(turn => turn.isActive);
    return turns.some(turn => turn.startTime === time);
  }

  // Obtener todos los horarios disponibles para un tipo de comida
  getAvailableTimesForType(restaurantId: string, type: 'almuerzo' | 'cena'): string[] {
    return this.getRestaurantTurns(restaurantId)
      .filter(turn => turn.type === type && turn.isActive)
      .map(turn => turn.startTime)
      .sort();
  }

  // Obtener todos los horarios disponibles
  getAllAvailableTimes(restaurantId: string): string[] {
    return this.getRestaurantTurns(restaurantId)
      .filter(turn => turn.isActive)
      .map(turn => turn.startTime)
      .sort();
  }

  // Determinar tipo de comida basado en la hora
  getMealTypeByTime(time: string): 'almuerzo' | 'cena' {
    const minutes = this.timeToMinutes(time);
    // Antes de las 17:00 es almuerzo, después es cena
    return minutes < 17 * 60 ? 'almuerzo' : 'cena';
  }

  // Obtener turno por hora exacta
  getTurnByTime(restaurantId: string, time: string): TimeSlot | null {
    const turns = this.getRestaurantTurns(restaurantId);
    return turns.find(turn => turn.startTime === time && turn.isActive) || null;
  }

  // Validar si una hora está en formato correcto y es válida
  validateTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Convertir hora a minutos para cálculos
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Convertir minutos a hora
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Generar sugerencias de horarios para Retell
  generateTimeSuggestions(restaurantId: string, requestedTime: string): {
    message: string;
    availableTimes: string[];
    mealType: 'almuerzo' | 'cena';
  } {
    const mealType = this.getMealTypeByTime(requestedTime);
    const availableTimes = this.getAvailableTimesForType(restaurantId, mealType);
    
    const { nearestOptions, suggestion } = this.findNearestTurn(restaurantId, requestedTime);
    
    return {
      message: suggestion,
      availableTimes,
      mealType
    };
  }

  // Guardar en localStorage
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.restaurantTurns.entries()).map(([id, turns]) => ({
        id,
        ...turns,
        lastUpdated: turns.lastUpdated.toISOString()
      }));
      
      localStorage.setItem('restaurant_turns', JSON.stringify(data));
    }
  }

  // Cargar desde localStorage
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('restaurant_turns');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          data.forEach((item: any) => {
            const turns: RestaurantTurns = {
              ...item,
              lastUpdated: new Date(item.lastUpdated)
            };
            this.restaurantTurns.set(item.id, turns);
          });
        } catch (error) {
          console.error('Error cargando turnos de restaurantes:', error);
        }
      }
    }
  }
}

// Instancia singleton
export const turnSystemService = TurnSystemService.getInstance();

// Hook para usar en componentes React
export function useTurnSystem() {
  const service = TurnSystemService.getInstance();
  
  return {
    getRestaurantTurns: (restaurantId: string) => service.getRestaurantTurns(restaurantId),
    setRestaurantTurns: (restaurantId: string, timeSlots: TimeSlot[]) => service.setRestaurantTurns(restaurantId, timeSlots),
    findNearestTurn: (restaurantId: string, time: string) => service.findNearestTurn(restaurantId, time),
    isTimeInTurn: (restaurantId: string, time: string) => service.isTimeInTurn(restaurantId, time),
    getAllAvailableTimes: (restaurantId: string) => service.getAllAvailableTimes(restaurantId),
    getAvailableTimesForType: (restaurantId: string, type: 'almuerzo' | 'cena') => service.getAvailableTimesForType(restaurantId, type),
    generateTimeSuggestions: (restaurantId: string, time: string) => service.generateTimeSuggestions(restaurantId, time),
    validateTime: (time: string) => service.validateTime(time),
    getMealTypeByTime: (time: string) => service.getMealTypeByTime(time)
  };
}
