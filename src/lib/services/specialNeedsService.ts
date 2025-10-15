// Sistema de necesidades especiales para reservas
export interface SpecialNeed {
  id: string;
  name: string;
  category: 'dietary' | 'accessibility' | 'equipment' | 'other';
  description: string;
  icon: string;
  requiresSpecialTable?: boolean;
  requiresSpecialPreparation?: boolean;
}

export interface ReservationSpecialNeeds {
  reservationId: string;
  specialNeeds: string[]; // IDs de necesidades especiales
  additionalNotes?: string;
}

// Necesidades especiales predefinidas
export const SPECIAL_NEEDS: SpecialNeed[] = [
  // Alimentarias
  {
    id: 'celiac',
    name: 'Celíaco',
    category: 'dietary',
    description: 'Sin gluten, cocina separada',
    icon: '🌾',
    requiresSpecialPreparation: true
  },
  {
    id: 'vegetarian',
    name: 'Vegetariano',
    category: 'dietary', 
    description: 'Sin carne ni pescado',
    icon: '🥗',
    requiresSpecialPreparation: false
  },
  {
    id: 'vegan',
    name: 'Vegano',
    category: 'dietary',
    description: 'Sin productos animales',
    icon: '🌱',
    requiresSpecialPreparation: true
  },
  {
    id: 'lactose_intolerant',
    name: 'Intolerante a lactosa',
    category: 'dietary',
    description: 'Sin lácteos',
    icon: '🥛',
    requiresSpecialPreparation: true
  },
  {
    id: 'nut_allergy',
    name: 'Alergia a frutos secos',
    category: 'dietary',
    description: 'Sin frutos secos, contaminación cruzada',
    icon: '🥜',
    requiresSpecialPreparation: true
  },
  {
    id: 'seafood_allergy',
    name: 'Alergia a mariscos',
    category: 'dietary',
    description: 'Sin mariscos ni pescados',
    icon: '🦐',
    requiresSpecialPreparation: true
  },
  
  // Accesibilidad
  {
    id: 'wheelchair',
    name: 'Silla de ruedas',
    category: 'accessibility',
    description: 'Mesa accesible, espacio amplio',
    icon: '♿',
    requiresSpecialTable: true
  },
  {
    id: 'mobility_aid',
    name: 'Ayuda de movilidad',
    category: 'accessibility',
    description: 'Bastón, andador, etc.',
    icon: '🦯',
    requiresSpecialTable: true
  },
  {
    id: 'hearing_impaired',
    name: 'Dificultades auditivas',
    category: 'accessibility',
    description: 'Mesa en zona tranquila',
    icon: '👂',
    requiresSpecialTable: true
  },
  {
    id: 'visual_impaired',
    name: 'Dificultades visuales',
    category: 'accessibility',
    description: 'Mesa con buena iluminación',
    icon: '👁️',
    requiresSpecialTable: true
  },

  // Equipamiento
  {
    id: 'baby_chair',
    name: 'Silla de bebé',
    category: 'equipment',
    description: 'Trona para bebé',
    icon: '👶',
    requiresSpecialTable: false
  },
  {
    id: 'booster_seat',
    name: 'Alzador para niño',
    category: 'equipment',
    description: 'Asiento elevado para niños',
    icon: '🧒',
    requiresSpecialTable: false
  },

  // Otras
  {
    id: 'birthday',
    name: 'Cumpleaños',
    category: 'other',
    description: 'Celebración especial',
    icon: '🎂',
    requiresSpecialPreparation: false
  },
  {
    id: 'anniversary',
    name: 'Aniversario',
    category: 'other',
    description: 'Celebración romántica',
    icon: '💕',
    requiresSpecialPreparation: false
  },
  {
    id: 'business_dinner',
    name: 'Cena de negocios',
    category: 'other',
    description: 'Ambiente tranquilo, mesa amplia',
    icon: '💼',
    requiresSpecialTable: true
  }
];

// Clase para gestionar necesidades especiales
export class SpecialNeedsService {
  private static instance: SpecialNeedsService;
  private reservationNeeds: Map<string, ReservationSpecialNeeds> = new Map();

  static getInstance(): SpecialNeedsService {
    if (!SpecialNeedsService.instance) {
      SpecialNeedsService.instance = new SpecialNeedsService();
    }
    return SpecialNeedsService.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  // Obtener todas las necesidades especiales disponibles
  getAllSpecialNeeds(): SpecialNeed[] {
    return SPECIAL_NEEDS;
  }

  // Obtener necesidades por categoría
  getSpecialNeedsByCategory(category: SpecialNeed['category']): SpecialNeed[] {
    return SPECIAL_NEEDS.filter(need => need.category === category);
  }

  // Obtener necesidad específica por ID
  getSpecialNeedById(id: string): SpecialNeed | null {
    return SPECIAL_NEEDS.find(need => need.id === id) || null;
  }

  // Agregar necesidades especiales a una reserva
  setReservationSpecialNeeds(reservationId: string, specialNeedIds: string[], additionalNotes?: string): void {
    this.reservationNeeds.set(reservationId, {
      reservationId,
      specialNeeds: specialNeedIds,
      additionalNotes
    });
    this.saveToStorage();
  }

  // Obtener necesidades especiales de una reserva
  getReservationSpecialNeeds(reservationId: string): ReservationSpecialNeeds | null {
    return this.reservationNeeds.get(reservationId) || null;
  }

  // Generar texto descriptivo para las necesidades especiales
  generateSpecialNeedsText(specialNeedIds: string[]): string {
    const needs = specialNeedIds
      .map(id => this.getSpecialNeedById(id))
      .filter(Boolean) as SpecialNeed[];

    if (needs.length === 0) return '';

    const categories = {
      dietary: needs.filter(n => n.category === 'dietary'),
      accessibility: needs.filter(n => n.category === 'accessibility'),
      equipment: needs.filter(n => n.category === 'equipment'),
      other: needs.filter(n => n.category === 'other')
    };

    const parts = [];

    if (categories.dietary.length > 0) {
      parts.push(`Alimentación: ${categories.dietary.map(n => n.name).join(', ')}`);
    }
    if (categories.accessibility.length > 0) {
      parts.push(`Accesibilidad: ${categories.accessibility.map(n => n.name).join(', ')}`);
    }
    if (categories.equipment.length > 0) {
      parts.push(`Equipamiento: ${categories.equipment.map(n => n.name).join(', ')}`);
    }
    if (categories.other.length > 0) {
      parts.push(`Especial: ${categories.other.map(n => n.name).join(', ')}`);
    }

    return parts.join(' | ');
  }

  // Generar preguntas para Retell AI
  generateRetellQuestions(): string[] {
    return [
      "¿Hay alguna alergia alimentaria que deba saber?",
      "¿Necesitan silla de bebé o alzador para niños?", 
      "¿Requieren acceso para silla de ruedas?",
      "¿Es alguna celebración especial como cumpleaños o aniversario?",
      "¿Alguna otra necesidad especial que pueda ayudarles?"
    ];
  }

  // Parsear respuesta de cliente para identificar necesidades
  parseClientResponse(response: string): string[] {
    const normalizedResponse = response.toLowerCase();
    const identifiedNeeds: string[] = [];

    // Buscar palabras clave
    const keywords = {
      'celiac': ['celiaco', 'celíaco', 'gluten', 'sin gluten'],
      'vegetarian': ['vegetariano', 'vegetariana', 'veggie'],
      'vegan': ['vegano', 'vegana', 'sin productos animales'],
      'lactose_intolerant': ['lactosa', 'intolerante lactosa', 'sin lacteos', 'sin lácteos'],
      'nut_allergy': ['alergia frutos secos', 'alergia nueces', 'sin frutos secos', 'sin nueces'],
      'seafood_allergy': ['alergia mariscos', 'alergia pescado', 'sin mariscos', 'sin pescado'],
      'wheelchair': ['silla de ruedas', 'silla ruedas', 'acceso discapacitados', 'accesible'],
      'baby_chair': ['silla bebe', 'silla bebé', 'trona', 'silla para bebe'],
      'booster_seat': ['alzador', 'silla niño', 'asiento niño'],
      'birthday': ['cumpleaños', 'cumple', 'birthday'],
      'anniversary': ['aniversario', 'anniversary'],
      'business_dinner': ['cena negocios', 'cena trabajo', 'reunion trabajo']
    };

    Object.entries(keywords).forEach(([needId, words]) => {
      if (words.some(word => normalizedResponse.includes(word))) {
        identifiedNeeds.push(needId);
      }
    });

    return identifiedNeeds;
  }

  // Generar instrucciones para el personal del restaurante
  generateKitchenInstructions(specialNeedIds: string[]): string[] {
    const needs = specialNeedIds
      .map(id => this.getSpecialNeedById(id))
      .filter(Boolean) as SpecialNeed[];

    const instructions: string[] = [];

    needs.forEach(need => {
      switch (need.id) {
        case 'celiac':
          instructions.push('🌾 CELÍACO: Usar utensilios separados, verificar ingredientes');
          break;
        case 'nut_allergy':
          instructions.push('🥜 ALERGIA FRUTOS SECOS: Evitar contaminación cruzada');
          break;
        case 'seafood_allergy':
          instructions.push('🦐 ALERGIA MARISCOS: Sin mariscos ni pescados');
          break;
        case 'wheelchair':
          instructions.push('♿ SILLA DE RUEDAS: Mesa accesible, espacio amplio');
          break;
        case 'baby_chair':
          instructions.push('👶 BEBÉ: Preparar trona y espacio seguro');
          break;
        case 'birthday':
          instructions.push('🎂 CUMPLEAÑOS: Preparar sorpresa si es posible');
          break;
      }
    });

    return instructions;
  }

  // Verificar si requiere mesa especial
  requiresSpecialTable(specialNeedIds: string[]): boolean {
    return specialNeedIds.some(id => {
      const need = this.getSpecialNeedById(id);
      return need?.requiresSpecialTable || false;
    });
  }

  // Verificar si requiere preparación especial en cocina
  requiresSpecialPreparation(specialNeedIds: string[]): boolean {
    return specialNeedIds.some(id => {
      const need = this.getSpecialNeedById(id);
      return need?.requiresSpecialPreparation || false;
    });
  }

  // Guardar en localStorage
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const data = Array.from(this.reservationNeeds.entries());
      localStorage.setItem('reservation_special_needs', JSON.stringify(data));
    }
  }

  // Cargar desde localStorage
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('reservation_special_needs');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          data.forEach(([id, needs]: [string, ReservationSpecialNeeds]) => {
            this.reservationNeeds.set(id, needs);
          });
        } catch (error) {
          console.error('Error cargando necesidades especiales:', error);
        }
      }
    }
  }
}

// Instancia singleton
export const specialNeedsService = SpecialNeedsService.getInstance();

// Hook para usar en componentes React
export function useSpecialNeeds() {
  const service = SpecialNeedsService.getInstance();
  
  return {
    getAllSpecialNeeds: () => service.getAllSpecialNeeds(),
    getSpecialNeedsByCategory: (category: SpecialNeed['category']) => service.getSpecialNeedsByCategory(category),
    setReservationSpecialNeeds: (reservationId: string, needIds: string[], notes?: string) => 
      service.setReservationSpecialNeeds(reservationId, needIds, notes),
    getReservationSpecialNeeds: (reservationId: string) => service.getReservationSpecialNeeds(reservationId),
    generateSpecialNeedsText: (needIds: string[]) => service.generateSpecialNeedsText(needIds),
    parseClientResponse: (response: string) => service.parseClientResponse(response),
    generateKitchenInstructions: (needIds: string[]) => service.generateKitchenInstructions(needIds),
    requiresSpecialTable: (needIds: string[]) => service.requiresSpecialTable(needIds),
    requiresSpecialPreparation: (needIds: string[]) => service.requiresSpecialPreparation(needIds)
  };
}
















